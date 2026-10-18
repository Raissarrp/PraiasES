const { obterSupabase } = require('../config/supabase');
const { ErroHttp } = require('../utils/erros');

const colunasObrigatorias = [
  'id_amostra',
  'praia',
  'codigo',
  'data_coleta',
  'tipo_ponto'
];

function texto(valor) {
  return valor === undefined || valor === null || valor === ''
    ? null
    : String(valor).trim();
}

function numero(valor, campo, linha) {
  if (valor === undefined || valor === '') {
    return null;
  }

  const convertido = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(convertido)) {
    throw new ErroHttp(`Valor inválido em ${campo} na linha ${linha}.`, 422, 'CSV_INVALIDO');
  }

  return convertido;
}

function booleano(valor, campo, linha) {
  if (valor === undefined || valor === '') {
    return null;
  }

  const normalizado = String(valor).trim().toLowerCase();
  if (['true', '1', 'sim'].includes(normalizado)) {
    return true;
  }
  if (['false', '0', 'não', 'nao'].includes(normalizado)) {
    return false;
  }

  throw new ErroHttp(`Valor inválido em ${campo} na linha ${linha}.`, 422, 'CSV_INVALIDO');
}

function data(valor, campo, linha) {
  const normalizado = texto(valor);
  if (!normalizado || !/^\d{4}-\d{2}-\d{2}$/.test(normalizado)) {
    throw new ErroHttp(`Data inválida em ${campo} na linha ${linha}.`, 422, 'CSV_INVALIDO');
  }

  return normalizado;
}

function validarLinha(linha, numeroLinha) {
  for (const coluna of colunasObrigatorias) {
    if (!texto(linha[coluna])) {
      throw new ErroHttp(`Campo obrigatório ausente: ${coluna}, linha ${numeroLinha}.`, 422, 'CSV_INVALIDO');
    }
  }

  if (!['praia', 'efluente'].includes(texto(linha.tipo_ponto))) {
    throw new ErroHttp(`Tipo de ponto inválido na linha ${numeroLinha}.`, 422, 'CSV_INVALIDO');
  }

  return {
    pagina: numero(linha.pagina, 'pagina', numeroLinha),
    id_amostra: texto(linha.id_amostra),
    id_relatorio: texto(linha.id_relatorio),
    praia: texto(linha.praia),
    codigo: texto(linha.codigo),
    descricao: texto(linha.descricao),
    utm_e: numero(linha.utm_e, 'utm_e', numeroLinha),
    utm_s: numero(linha.utm_s, 'utm_s', numeroLinha),
    data_coleta: data(linha.data_coleta, 'data_coleta', numeroLinha),
    hora_coleta: texto(linha.hora_coleta),
    algas: booleano(linha.algas, 'algas', numeroLinha),
    banhistas: booleano(linha.banhistas, 'banhistas', numeroLinha),
    lixo: booleano(linha.lixo, 'lixo', numeroLinha),
    condicoes_meteorologicas_24h: texto(linha.condicoes_meteorologicas_24h),
    condicoes_meteorologicas_momento: texto(linha.condicoes_meteorologicas_momento),
    tipo_ponto: texto(linha.tipo_ponto),
    data_publicacao: texto(linha.data_publicacao),
    temperatura_ambiente: numero(linha.temperatura_ambiente, 'temperatura_ambiente', numeroLinha),
    coliformes_nmp_100ml: numero(linha.coliformes_nmp_100ml, 'coliformes_nmp_100ml', numeroLinha),
    plano_amostragem: texto(linha.plano_amostragem),
    laboratorio: texto(linha.laboratorio),
    problemas_validacao: texto(linha.problemas_validacao)
  };
}

async function importar(registros, nomeArquivo) {
  const supabase = obterSupabase();
  const resposta = await supabase.rpc('importar_amostras_csv', {
    p_registros: registros,
    p_nome_arquivo: nomeArquivo
  });

  if (resposta.error) {
    const erro = new Error('Não foi possível importar o arquivo no Supabase.');
    erro.statusCode = 502;
    erro.codigo = 'ERRO_IMPORTACAO_SUPABASE';
    erro.causa = resposta.error;
    throw erro;
  }

  return resposta.data;
}

module.exports = {
  validarLinha,
  importar
};
