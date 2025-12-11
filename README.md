# Painel de Assessorias do SAEEX/NAEE - FCEE

Painel estático em HTML/CSS/JS para visualizar, em um mapa estilizado de Santa Catarina, os dados de assessorias do SAEEX/NAEE, com indicadores por Coordenadoria Regional de Educação (CRE) e um painel administrativo para edição local.

## Como usar

1. Abra `index.html` em um navegador moderno.
2. Clique em qualquer CRE no mapa para abrir a janela com detalhes e percentuais de estudantes/ escolas sem AEE.
3. Use o **Painel administrativo** para atualizar os números. Os valores são armazenados no `localStorage` do navegador.
4. Para revisar o agrupamento de municípios de cada CRE, utilize o link informado pelo time: https://www.actsantacatarina.com.br/act/cres

## Paleta

- Verde escuro: `#006934` (Gov SC)
- Verde claro: `#00a859` (Gov SC)
- CREs sem assessoria: cinza `#7a8a92`

## Estrutura

- `index.html`: página principal.
- `style.css`: estilos com layout escuro e cartões.
- `script.js`: lógica do mapa, popup, cálculos de percentuais e painel administrativo.
- `data/cre-data.js`: dados iniciais das 37 CREs com posições aproximadas no grid.
- `assets/`: logotipos em SVG da FCEE e Governo de SC.

Os dados podem ser substituídos pelos oficiais assim que estiverem disponíveis; o layout manterá as cores em dois tons de verde intercalados e exibirá cinza para CREs sem assessoria.
