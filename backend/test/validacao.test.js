const test = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('csv-parse/sync');
const { validarLinha } = require('../src/services/importacaoService');

const cabecalho = [
  'pagina', 'id_amostra', 'id_relatorio', 'praia', 'codigo', 'descricao',
  'utm_e', 'utm_s', 'data_coleta', 'hora_coleta', 'algas', 'banhistas',
  'lixo', 'condicoes_meteorologicas_24h', 'condicoes_meteorologicas_momento',
  'tipo_ponto', 'data_publicacao', 'temperatura_ambiente',
  'coliformes_nmp_100ml', 'plano_amostragem', 'laboratorio',
  'problemas_validacao'
].join(',');

const linha = [
  '1', '486127', '59400-1/2026.0', 'Praia De Camburi', '1A',
  'Descrição', '368279.0', '7758695.0', '2026-09-28', '07:27',
  'False', 'False', 'True', 'ensolarado', 'nublado', 'praia',
  '2026-09-30 09:00:00', '24.8', '5400.0', 'Plano', 'Agrolab', ''
].join(',');

test('valida uma linha com o formato real do CSV', () => {
  const [registro] = parse(`${cabecalho}\n${linha}`, {
    columns: true,
    bom: true,
    skip_empty_lines: true
  });

  const resultado = validarLinha(registro, 2);

  assert.equal(resultado.id_amostra, '486127');
  assert.equal(resultado.tipo_ponto, 'praia');
  assert.equal(resultado.algas, false);
  assert.equal(resultado.coliformes_nmp_100ml, 5400);
});

test('rejeita tipo de ponto desconhecido', () => {
  assert.throws(
    () => validarLinha({
      id_amostra: '1',
      praia: 'Praia',
      codigo: '1',
      data_coleta: '2026-09-28',
      tipo_ponto: 'desconhecido'
    }, 2),
    { codigo: 'CSV_INVALIDO' }
  );
});
