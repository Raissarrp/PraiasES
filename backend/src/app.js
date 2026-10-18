const express = require('express');
const cors = require('cors');
const configuracao = require('./config/env');
const api = require('./routes/api');

const app = express();

app.use(cors({
  origin: configuracao.origemFrontend
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);

app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada.'
  });
});

app.use((erro, req, res, next) => {
  const statusCode = erro.statusCode || 500;
  const resposta = {
    erro: statusCode >= 500 ? 'Erro interno do servidor.' : erro.message,
    codigo: erro.codigo || 'ERRO_INTERNO'
  };

  if (erro.detalhes) {
    resposta.detalhes = erro.detalhes;
  }

  console.error('Erro na requisição:', {
    metodo: req.method,
    rota: req.originalUrl,
    statusCode,
    codigo: resposta.codigo,
    causa: erro.causa ? erro.causa.message || erro.causa.code : undefined
  });

  res.status(statusCode).json(resposta);
});

module.exports = app;
