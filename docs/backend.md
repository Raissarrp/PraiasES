# Backend

O backend usa Node.js, Express, CommonJS e o cliente JavaScript do Supabase.

## Configuração

Copie `.env.example` para `.env` e preencha:

- `PORT`: porta local do servidor.
- `FRONTEND_URL`: origem autorizada pelo CORS.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_ANON_KEY`: chave pública usada nas consultas sujeitas às políticas RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada usada somente no backend.
- `IMPORT_TOKEN`: token privado exigido para importar CSV.
- `MAX_UPLOAD_SIZE_MB`: tamanho máximo do CSV recebido.

O arquivo `.env` não deve ser versionado.

## Execução no PowerShell

```powershell
npm install
npm run dev
```

Para iniciar sem Nodemon:

```powershell
npm start
```

Para testar:

```powershell
npm test
```

## Banco

Aplique `database/01_extensions.sql` e `database/02_modelo_inicial.sql` no SQL Editor do Supabase somente depois de revisar a compatibilidade com o schema já existente. A segunda migration usa operações aditivas e cria a função transacional usada pela importação.

## Rotas

- `GET /api-docs` (somente fora de produção)
- `GET /api/health`
- `GET /api/municipios`
- `GET /api/praias?municipio_id=1`
- `GET /api/pontos-monitoramento?praia_id=1`
- `GET /api/amostras?ponto_id=1&de=2026-09-01&ate=2026-09-30`
- `GET /api/fontes`
- `GET /api/documentos?fonte_id=1`
- `POST /api/importacoes/csv` com o arquivo no campo multipart `arquivo`

O endpoint de importação exige `Authorization: Bearer <IMPORT_TOKEN>`, preserva a classificação do ETL e não calcula classificação oficial de balneabilidade. As consultas usam a chave anon e dependem das políticas RLS do Supabase. A chave service role é usada somente pela RPC de importação.
