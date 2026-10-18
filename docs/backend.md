# Backend

O backend usa Node.js, Express, CommonJS e o cliente JavaScript do Supabase.

## Configuração

Copie `.env.example` para `.env` e preencha:

- `PORT`: porta local do servidor.
- `FRONTEND_URL`: origem autorizada pelo CORS.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada usada somente no backend.
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

- `GET /api/health`
- `GET /api/municipios`
- `GET /api/praias?municipio_id=1`
- `GET /api/pontos-monitoramento?praia_id=1`
- `GET /api/amostras?ponto_id=1&de=2026-09-01&ate=2026-09-30`
- `GET /api/fontes`
- `GET /api/documentos?fonte_id=1`
- `POST /api/importacoes/csv` com o arquivo no campo multipart `arquivo`

O endpoint de importação preserva a classificação do ETL e não calcula classificação oficial de balneabilidade.
