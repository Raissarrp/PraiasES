const app = require('./app');
const configuracao = require('./config/env');

const servidor = app.listen(configuracao.porta, () => {
  console.log(`Backend executando na porta ${configuracao.porta}`);
});

function encerrar(sinal) {
  console.log(`Recebido ${sinal}. Encerrando backend.`);
  servidor.close(() => process.exit(0));
}

process.once('SIGINT', () => encerrar('SIGINT'));
process.once('SIGTERM', () => encerrar('SIGTERM'));
