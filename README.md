# Painel Saeex-Naee · FCEE

Projeto estático com **Painel Estatístico** (público) e **Painel Admin** para acompanhamento das assessorias do **Saeex-Naee** da Fundação Catarinense de Educação Especial (FCEE).

## Estrutura de arquivos

- `index.html`  
  Painel Estatístico com cartões de resumo, **gráficos** e **mapa de municípios atendidos**.

- `admin.html`  
  Painel Admin com:
  - login simples;
  - listagem e edição das instituições;
  - criação de **novas colunas de quantidade** (dinâmicas);
  - link para o painel público e botão de saída.

- `data/instituicoes.csv`  
  Cadastro inicial das instituições, utilizado tanto pelo Painel Admin quanto pelo Painel Estatístico e pelo mapa.

- `sc_municipios.geojson`  
  Arquivo GeoJSON com os municípios de Santa Catarina (usado no mapa).

- `scripts/shared-data.js`  
  Funções compartilhadas de carregamento/normalização de dados (CSV + localStorage).

- `scripts/main.js`  
  Lógica do painel público (cartões, gráficos, mapa).

- `scripts/admin.js`  
  Lógica do painel Admin (login, colunas dinâmicas, tabela e formulários).

- `styles/style.css`  
  Estilos gerais dos painéis (layout, tipografia, tabelas, mapa, overlay de login etc.).

## Logos (Painel e Admin)

Os dois arquivos (`index.html` e `admin.html`) esperam encontrar as logos nesta estrutura:

```text
saeex-naee/
  logos/
    logo-fcee.png
    logo-saeex-naee.png
