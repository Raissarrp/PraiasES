const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const configuracao = require('../config/env');
const { configurado } = require('../config/supabase');
const { asyncHandler, ErroHttp } = require('../utils/erros');
const { textoOpcional, inteiroOpcional, dataOpcional } = require('../utils/validacao');
const consulta = require('../services/consultaService');
const importacao = require('../services/importacaoService');

const roteador = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: configuracao.tamanhoMaximoUpload }
});

function filtrosCatalogo(req, nomes) {
  return nomes
    .map((nome) => ({ coluna: nome, valor: inteiroOpcional(req.query[nome], nome) }))
    .filter((filtro) => filtro.valor !== undefined);
}

roteador.get('/health', asyncHandler(async (req, res) => {
  let banco = 'não configurado';
  let status = 'degradado';

  if (configurado) {
    try {
      await consulta.verificarSupabase();
      banco = 'conectado';
      status = 'ok';
    } catch (erro) {
      banco = 'indisponível';
    }
  }

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    servico: 'backend',
    supabase: banco
  });
}));

roteador.get('/municipios', asyncHandler(async (req, res) => {
  res.json(await consulta.listar('municipios', { ordenar: { coluna: 'nome' } }));
}));

roteador.get('/praias', asyncHandler(async (req, res) => {
  const municipioId = inteiroOpcional(req.query.municipio_id, 'municipio_id');
  res.json(await consulta.listar('praias', {
    filtros: municipioId === undefined ? [] : [{ coluna: 'municipio_id', valor: municipioId }],
    ordenar: { coluna: 'nome' }
  }));
}));

roteador.get('/pontos-monitoramento', asyncHandler(async (req, res) => {
  res.json(await consulta.listar('pontos_monitoramento', {
    filtros: filtrosCatalogo(req, ['praia_id', 'municipio_id']),
    ordenar: { coluna: 'codigo' }
  }));
}));

roteador.get('/amostras', asyncHandler(async (req, res) => {
  const filtros = filtrosCatalogo(req, ['ponto_id', 'praia_id']);
  const de = dataOpcional(req.query.de, 'de');
  const ate = dataOpcional(req.query.ate, 'ate');
  if (de && ate && de > ate) {
    throw new ErroHttp('O período inicial não pode ser posterior ao período final.');
  }

  res.json(await consulta.listar('amostras_balneabilidade', {
    filtros,
    de,
    ate,
    colunaData: 'data_coleta',
    ordenar: { coluna: 'data_coleta', ascendente: false }
  }));
}));

roteador.get('/fontes', asyncHandler(async (req, res) => {
  res.json(await consulta.listar('fontes', { ordenar: { coluna: 'nome' } }));
}));

roteador.get('/documentos', asyncHandler(async (req, res) => {
  res.json(await consulta.listar('documentos_fonte', {
    filtros: filtrosCatalogo(req, ['fonte_id']),
    ordenar: { coluna: 'data_publicacao', ascendente: false }
  }));
}));

roteador.post('/importacoes/csv', upload.single('arquivo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ErroHttp('Envie o arquivo CSV no campo arquivo.');
  }

  const nomeArquivo = req.file.originalname;
  if (!nomeArquivo.toLowerCase().endsWith('.csv')) {
    throw new ErroHttp('Apenas arquivos CSV são aceitos.');
  }

  let linhas;
  try {
    linhas = parse(req.file.buffer.toString('utf8'), {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (erro) {
    throw new ErroHttp('Não foi possível interpretar o CSV.', 422, 'CSV_INVALIDO');
  }

  const registros = linhas.map((linha, indice) => importacao.validarLinha(linha, indice + 2));
  if (!registros.length) {
    throw new ErroHttp('O CSV não possui registros.');
  }

  const resultado = await importacao.importar(registros, nomeArquivo);
  res.status(201).json(resultado);
}));

module.exports = roteador;
