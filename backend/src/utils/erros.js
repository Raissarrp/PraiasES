class ErroHttp extends Error {
  constructor(mensagem, statusCode = 400, codigo = 'REQUISICAO_INVALIDA', detalhes) {
    super(mensagem);
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function asyncHandler(funcao) {
  return (req, res, next) => {
    Promise.resolve(funcao(req, res, next)).catch(next);
  };
}

module.exports = {
  ErroHttp,
  asyncHandler
};
