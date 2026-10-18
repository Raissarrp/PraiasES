const { obterSupabase } = require('../config/supabase');

function exigirDados(resultado, contexto) {
  if (resultado.error) {
    const erro = new Error(`Falha ao consultar ${contexto}.`);
    erro.statusCode = 502;
    erro.codigo = 'ERRO_SUPABASE';
    erro.causa = resultado.error;
    throw erro;
  }

  return resultado.data || [];
}

async function verificarSupabase() {
  const supabase = obterSupabase();
  const resultado = await supabase.from('fontes').select('id').limit(1);
  return exigirDados(resultado, 'a conectividade com o Supabase');
}

async function listar(tabela, opcoes = {}) {
  const supabase = obterSupabase();
  let consulta = supabase.from(tabela).select(opcoes.select || '*');

  for (const filtro of opcoes.filtros || []) {
    if (filtro.valor !== undefined) {
      consulta = consulta.eq(filtro.coluna, filtro.valor);
    }
  }

  if (opcoes.de) {
    consulta = consulta.gte(opcoes.colunaData, opcoes.de);
  }

  if (opcoes.ate) {
    consulta = consulta.lte(opcoes.colunaData, opcoes.ate);
  }

  if (opcoes.ordenar) {
    consulta = consulta.order(opcoes.ordenar.coluna, {
      ascending: opcoes.ordenar.ascendente !== false
    });
  }

  return exigirDados(await consulta, tabela);
}

module.exports = {
  verificarSupabase,
  listar
};
