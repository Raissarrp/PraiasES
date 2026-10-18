const { ErroHttp } = require('./erros');

const formatoData = /^\d{4}-\d{2}-\d{2}$/;

function textoOpcional(valor, nome) {
  if (valor === undefined || valor === '') {
    return undefined;
  }

  if (typeof valor !== 'string' || valor.length > 120) {
    throw new ErroHttp(`O parâmetro ${nome} é inválido.`);
  }

  return valor.trim();
}

function inteiroOpcional(valor, nome) {
  if (valor === undefined || valor === '') {
    return undefined;
  }

  if (!/^\d+$/.test(String(valor))) {
    throw new ErroHttp(`O parâmetro ${nome} deve ser um número inteiro positivo.`);
  }

  return Number(valor);
}

function dataOpcional(valor, nome) {
  if (valor === undefined || valor === '') {
    return undefined;
  }

  if (!formatoData.test(String(valor)) || Number.isNaN(Date.parse(`${valor}T00:00:00Z`))) {
    throw new ErroHttp(`O parâmetro ${nome} deve estar no formato AAAA-MM-DD.`);
  }

  return valor;
}

module.exports = {
  textoOpcional,
  inteiroOpcional,
  dataOpcional
};
