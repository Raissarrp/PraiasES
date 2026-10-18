
from pathlib import Path
import pymupdf
import re
import pandas as pd



BASE_DIR = Path(__file__).resolve().parents[3]

PDF_PATH = (
    BASE_DIR
    / "coletados"
    / "vitoria"
    / "Coleta_em_28_09_2026.PDF"
)



def limpar_texto(texto):
    """Normaliza espaços e quebras de linha."""

    texto = texto.replace("\xa0", " ")
    texto = re.sub(r"\s+", " ", texto)

    return texto.strip()


def extrair_pdf(caminho_pdf):
    """Extrai o texto de cada página do PDF."""

    caminho_pdf = Path(caminho_pdf)

    if not caminho_pdf.exists():
        raise FileNotFoundError(
            f"PDF não encontrado: {caminho_pdf.resolve()}"
        )

    paginas = []

    with pymupdf.open(caminho_pdf) as documento:
        for numero_pagina, pagina in enumerate(documento, start=1):
            texto = limpar_texto(pagina.get_text())

            paginas.append({
                "pagina": numero_pagina,
                "texto": texto
            })

    return paginas



def extrair_identificacao_ponto(texto):
  

    
    padrao = (
        r"ID da Amostra:\s*"
        r"(?P<id_amostra>\d+)\s*-\s*"
        r"(?P<relatorio>[\d./-]+)\s*-\s*"
        r"(?P<identificacao>.*?)"
        r"(?:"
        r":\s*(?P<codigo_praia>[A-Za-z0-9]+)\s*-"
        r"|"
        r"\s*-\s*(?P<descricao_efluente>Efluente\b.*?)"
        r"(?=\s+Tipo de Amostra:)"
        r")"
    )

    resultado = re.search(
        padrao,
        texto,
        re.IGNORECASE
    )

    if not resultado:
        return {
            "id_amostra": None,
            "id_relatorio": None,
            "praia": None,
            "codigo": None,
            "descricao": None
        }

    identificacao = resultado.group("identificacao").strip()

    codigo = resultado.group("codigo_praia")

    if codigo:
        praia = identificacao
        marcador = f"{praia}: {codigo}"
        posicao = texto.find(marcador)

        descricao = None

        if posicao != -1:
            inicio = posicao + len(marcador)
            trecho = texto[inicio:]

            descricao_match = re.search(
                r"(.*?)Tipo de Amostra:",
                trecho,
                re.IGNORECASE
            )

            if descricao_match:
                descricao = descricao_match.group(1).strip(" -:")

                descricao = re.sub(
                    r"\s*:?\s*UTM\s*E\s*\d+\s*/?\s*UTM\s*S\s*\d+.*$",
                    "",
                    descricao,
                    flags=re.IGNORECASE
                ).strip(" -:")

    else:
        praia = identificacao
        codigo = "11A"
        descricao = resultado.group("descricao_efluente").strip()

    return {
        "id_amostra": resultado.group("id_amostra"),
        "id_relatorio": resultado.group("relatorio"),
        "praia": praia,
        "codigo": codigo,
        "descricao": descricao
    }



def extrair_utm(texto):
    """Extrai as coordenadas UTM quando estão presentes."""

    padrao = (
        r"UTM\s*E\s*(\d+)"
        r"\s*/?\s*UTM\s*S\s*(\d+)"
    )

    resultado = re.search(
        padrao,
        texto,
        re.IGNORECASE
    )

    if not resultado:
        return {
            "utm_e": None,
            "utm_s": None
        }

    return {
        "utm_e": int(resultado.group(1)),
        "utm_s": int(resultado.group(2))
    }



def extrair_data_hora_coleta(texto):
    """Extrai a data e a hora da coleta da amostra."""

    padrao = (
        r"Data e Hora de Coleta:\s*"
        r"(\d{2}/\d{2}/\d{4})\s*"
        r"(\d{2}:\d{2})"
    )

    resultado = re.search(
        padrao,
        texto,
        re.IGNORECASE
    )

    if not resultado:
        return {
            "data_coleta": None,
            "hora_coleta": None
        }

    data = resultado.group(1)
    hora = resultado.group(2)

    return {
        "data_coleta": pd.to_datetime(
            data,
            format="%d/%m/%Y"
        ).date(),

        "hora_coleta": hora
    }



def extrair_booleano(texto, campo):
    """Converte respostas Sim/Não em True/False."""

    padrao = rf"{re.escape(campo)}\s*:\s*(Sim|Não)"

    resultado = re.search(
        padrao,
        texto,
        re.IGNORECASE
    )

    if not resultado:
        return None

    return resultado.group(1).lower() == "sim"


def extrair_observacoes(texto):
    """Extrai as observações ambientais do relatório."""

    return {
        "algas": extrair_booleano(
            texto,
            "Presença de algas?"
        ),

        "banhistas": extrair_booleano(
            texto,
            "Presença de banhistas?"
        ),

        "lixo": extrair_booleano(
            texto,
            "Presença de lixo?"
        )
    }
    


def extrair_data_publicacao(texto):
    padrao = (
        r"Data e Hora de Publicação:\s*"
        r"(\d{2}/\d{2}/\d{4})\s*"
        r"(\d{2}:\d{2})"
    )

    resultado = re.search(padrao, texto, re.IGNORECASE)

    if not resultado:
        return None

    return pd.to_datetime(
        f"{resultado.group(1)} {resultado.group(2)}",
        format="%d/%m/%Y %H:%M"
    )



def extrair_temperatura(texto):
    padrao = (
        r"Temperatura Ambiente no Local da Coleta:\s*"
        r"(\d+(?:[.,]\d+)?)\s*°?\s*C"
    )

    resultado = re.search(padrao, texto, re.IGNORECASE)

    if not resultado:
        return None

    return float(resultado.group(1).replace(",", "."))



def extrair_coliformes(texto):
    """
    Converte valores como:
    5,40 x 103 NMP/100 mL -> 5400
    2,00 x 101 NMP/100 mL -> 20
    """

    padrao = (
        r"Coliformes Termotolerantes\s*"
        r"([\d.,]+)\s*[xX×]\s*10\s*(\d+)"
    )

    resultado = re.search(padrao, texto, re.IGNORECASE)

    if not resultado:
        return None

    mantissa = float(
        resultado.group(1).replace(",", ".")
    )

    expoente = int(resultado.group(2))

    return mantissa * (10 ** expoente)



def extrair_condicoes_meteorologicas(texto):
    padrao_24h = (
        r"Condições meteorológicas nas últimas 24 horas:\s*(.*?)"
        r"\s+Condições meteorológicas no momento da coleta:"
    )

    padrao_momento = (
        r"Condições meteorológicas no momento da coleta:\s*(.*?)"
        r"\s+Plano de Amostragem:"
    )

    resultado_24h = re.search(
        padrao_24h, texto, re.IGNORECASE
    )

    resultado_momento = re.search(
        padrao_momento, texto, re.IGNORECASE
    )

    return {
        "condicoes_meteorologicas_24h": (
            resultado_24h.group(1).strip()
            if resultado_24h else None
        ),
        "condicoes_meteorologicas_momento": (
            resultado_momento.group(1).strip()
            if resultado_momento else None
        )
    }



def extrair_plano_amostragem(texto):
    resultado = re.search(
        r"Plano de Amostragem:\s*([^\n]+)",
        texto,
        re.IGNORECASE
    )

    return resultado.group(1).strip() if resultado else None


def extrair_laboratorio(texto):
    resultado = re.search(
        r"Responsabilidade da Amostragem:\s*([^\n]+)",
        texto,
        re.IGNORECASE
    )

    return resultado.group(1).strip() if resultado else None



def identificar_tipo_ponto(texto, identificacao):
    """
    O relatório do ponto 11A descreve um efluente.
    Não devemos cadastrá-lo como uma praia.
    """

    conteudo = (
        (identificacao or "") + " " + texto
    ).lower()

    if "efluente" in conteudo:
        return "efluente"

    return "praia"



def processar_pagina(pagina):
    texto = pagina["texto"]

    identificacao = extrair_identificacao_ponto(texto)
    utm = extrair_utm(texto)
    coleta = extrair_data_hora_coleta(texto)
    observacoes = extrair_observacoes(texto)
    meteorologia = extrair_condicoes_meteorologicas(texto)

    tipo_ponto = identificar_tipo_ponto(
        texto,
        identificacao.get("descricao")
    )

    registro = {
        "pagina": pagina["pagina"],

        **identificacao,
        **utm,
        **coleta,
        **observacoes,
        **meteorologia,

        "tipo_ponto": tipo_ponto,
        "data_publicacao": extrair_data_publicacao(texto),
        "temperatura_ambiente": extrair_temperatura(texto),
        "coliformes_nmp_100ml": extrair_coliformes(texto),
        "plano_amostragem": extrair_plano_amostragem(texto),
        "laboratorio": extrair_laboratorio(texto)
    }

    return registro



def validar_registro(registro):
    problemas = []

    obrigatorios = [
        "id_amostra",
        "data_coleta",
        "coliformes_nmp_100ml"
    ]

    for campo in obrigatorios:
        if registro.get(campo) is None:
            problemas.append(f"Campo ausente: {campo}")

    if registro.get("tipo_ponto") == "praia":
        if not registro.get("praia"):
            problemas.append("Nome da praia ausente")

        if not registro.get("codigo"):
            problemas.append("Código do ponto ausente")

        if (
            registro.get("utm_e") is None
            or registro.get("utm_s") is None
        ):
            problemas.append("Coordenadas UTM ausentes")

    return problemas



def processar_pdf_completo(caminho_pdf):
    paginas = extrair_pdf(caminho_pdf)

    registros = []

    for pagina in paginas:
        registro = processar_pagina(pagina)
        registro["problemas_validacao"] = "; ".join(
            validar_registro(registro)
        )

        registros.append(registro)

    df = pd.DataFrame(registros)

    pasta_saida = Path(__file__).resolve().parents[3] / "dados_processados"
    pasta_saida.mkdir(parents=True, exist_ok=True)

    caminho_csv = pasta_saida / "amostras_vitoria.csv"

    df.to_csv(
        caminho_csv,
        index=False,
        encoding="utf-8-sig"
    )

    praias = df[df["tipo_ponto"] == "praia"]
    efluentes = df[df["tipo_ponto"] == "efluente"]

    print("\n--- RESUMO DO PROCESSAMENTO ---")
    print("Páginas lidas:", len(paginas))
    print("Registros extraídos:", len(df))
    print("Pontos classificados como praia:", len(praias))
    print("Pontos classificados como efluente:", len(efluentes))
    print("Registros com problemas:", (df["problemas_validacao"] != "").sum())
    print("CSV salvo em:", caminho_csv)

    print("\n--- AMOSTRA DO RESULTADO ---")
    colunas = [
        "pagina",
        "praia",
        "codigo",
        "data_coleta",
        "temperatura_ambiente",
        "coliformes_nmp_100ml",
        "tipo_ponto"
    ]

    print(df[colunas].head(5).to_string(index=False))

    return df




def conferir_csv(caminho_csv):
    df = pd.read_csv(caminho_csv)

    print("\n--- CONFERÊNCIA DO CSV ---")

    print("\nQuantidade por tipo:")
    print(df["tipo_ponto"].value_counts(dropna=False))

    print("\nCódigos repetidos:")
    praias = df[df["tipo_ponto"] == "praia"]
    repetidos = praias[praias.duplicated(
        subset=["praia", "codigo"],
        keep=False
    )]

    if repetidos.empty:
        print("Nenhum código repetido dentro da mesma praia.")
    else:
        print(repetidos[["praia", "codigo", "pagina"]])

    print("\nValores ausentes:")
    colunas = [
        "id_amostra",
        "praia",
        "codigo",
        "data_coleta",
        "utm_e",
        "utm_s",
        "temperatura_ambiente",
        "coliformes_nmp_100ml"
    ]

    print(df[colunas].isna().sum())

    print("\nRegistros com problemas:")
    print(
        df[df["problemas_validacao"].fillna("") != ""]
        [["pagina", "praia", "codigo", "problemas_validacao"]]
    )




if __name__ == "__main__":
    df = processar_pdf_completo(PDF_PATH)

    conferir_csv(
        Path(__file__).resolve().parents[3]
        / "dados_processados"
        / "amostras_vitoria.csv"
    )
