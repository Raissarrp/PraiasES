-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.praias (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome character varying NOT NULL,
  municipio character varying NOT NULL,
  latitude numeric,
  longitude numeric,
  geom USER-DEFINED,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT praias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chuva (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  data date NOT NULL,
  municipio character varying NOT NULL,
  precipitacao_mm numeric CHECK (precipitacao_mm >= 0::numeric),
  fonte character varying,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT chuva_pkey PRIMARY KEY (id)
);
CREATE TABLE public.saneamento (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  municipio character varying NOT NULL,
  ano integer NOT NULL CHECK (ano >= 1900 AND ano <= 2100),
  cobertura_esgoto numeric CHECK (cobertura_esgoto IS NULL OR cobertura_esgoto >= 0::numeric AND cobertura_esgoto <= 100::numeric),
  esgoto_tratado numeric CHECK (esgoto_tratado IS NULL OR esgoto_tratado >= 0::numeric AND esgoto_tratado <= 100::numeric),
  fonte character varying,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT saneamento_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fontes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome character varying NOT NULL,
  descricao text,
  url character varying,
  tipo_dado character varying,
  ultima_atualizacao timestamp with time zone,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT fontes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.municipios (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome character varying NOT NULL UNIQUE,
  latitude numeric,
  longitude numeric,
  geom USER-DEFINED,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT municipios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documentos_fonte (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  fonte_id bigint,
  municipio character varying,
  tipo_documento character varying,
  url text,
  nome_arquivo character varying,
  data_publicacao date,
  data_coleta timestamp with time zone DEFAULT now(),
  hash_documento character varying,
  status character varying DEFAULT 'processado'::character varying,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT documentos_fonte_pkey PRIMARY KEY (id),
  CONSTRAINT fk_documento_fonte FOREIGN KEY (fonte_id) REFERENCES public.fontes(id)
);
CREATE TABLE public.pontos_monitoramento (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  praia_id bigint,
  codigo character varying,
  descricao text,
  latitude double precision,
  longitude double precision,
  utm_e integer,
  utm_s integer,
  tipo_ponto character varying DEFAULT 'praia'::character varying,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT pontos_monitoramento_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ponto_praia FOREIGN KEY (praia_id) REFERENCES public.praias(id)
);
CREATE TABLE public.amostras_balneabilidade (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  ponto_id bigint NOT NULL,
  documento_id bigint,
  id_amostra character varying,
  id_relatorio character varying,
  data_coleta date,
  hora_coleta time without time zone,
  data_publicacao timestamp without time zone,
  tipo_amostra character varying,
  algas boolean,
  banhistas boolean,
  lixo boolean,
  condicoes_meteorologicas_24h text,
  condicoes_meteorologicas_momento text,
  temperatura_ambiente numeric,
  coliformes_nmp_100ml numeric,
  plano_amostragem character varying,
  laboratorio character varying,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT amostras_balneabilidade_pkey PRIMARY KEY (id),
  CONSTRAINT fk_amostra_ponto FOREIGN KEY (ponto_id) REFERENCES public.pontos_monitoramento(id),
  CONSTRAINT fk_amostra_documento FOREIGN KEY (documento_id) REFERENCES public.documentos_fonte(id)
);