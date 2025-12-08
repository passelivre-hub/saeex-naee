// Lógica do Painel Estatístico (index.html) · Saeex-Naee

(async function initDashboard() {
  try {
    const customColumns = loadCustomColumns();
    const institutionsRaw = await loadInstitutions();
    const institutions = applyQuantityDefaults(institutionsRaw, customColumns);

    renderSummaryCards(institutions, customColumns);
    renderTipoChart(institutions, customColumns);
    renderRegiaoChart(institutions, customColumns);
    renderMap(institutions, customColumns);
  } catch (error) {
    console.error('Erro ao inicializar o painel:', error);
    const badge = document.getElementById('mapaBadge');
    if (badge) badge.textContent = 'Erro ao carregar dados';
  }
})();

/**
 * Cartões de resumo no topo do painel.
 */
function renderSummaryCards(data, customColumns) {
  const container = document.getElementById('summary-cards');
  if (!container) return;

  const totalAssessorias = data.reduce(
    (total, item) => total + sumQuantities(item, customColumns),
    0,
  );
  const totalInstituicoes = data.length;
  const regioes = new Set(data.map((i) => i.Regiao));

  container.innerHTML = `
    <div class="card">
      <div class="card-label">Total de Assessorias</div>
      <div class="card-value">${totalAssessorias}</div>
    </div>
    <div class="card">
      <div class="card-label">Instituições cadastradas</div>
      <div class="card-value">${totalInstituicoes}</div>
    </div>
    <div class="card">
      <div class="card-label">Regiões atendidas</div>
      <div class="card-value">${regioes.size}</div>
    </div>
  `;
}

/**
 * Gráfico por tipo de assessoria.
 * Título desejado: "Número de Assessorias".
 */
function renderTipoChart(data, customColumns) {
  const canvas = document.getElementById('tipoChart');
  if (!canvas) return;

  const byType = new Map();

  data.forEach((item) => {
    const key = item.Tipo || 'Sem informação';
    const value = sumQuantities(item, customColumns);
    byType.set(key, (byType.get(key) || 0) + value);
  });

  const labels = Array.from(byType.keys());
  const values = Array.from(byType.values());

  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Número de Assessorias',
          data: values,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: { autoSkip: false },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

/**
 * Gráfico por região.
 * Título desejado: "Assessorias por Região".
 */
function renderRegiaoChart(data, customColumns) {
  const canvas = document.getElementById('regiaoChart');
  if (!canvas) return;

  const byRegion = new Map();

  data.forEach((item) => {
    const key = item.Regiao || 'Sem informação';
    const value = sumQuantities(item, customColumns);
    byRegion.set(key, (byRegion.get(key) || 0) + value);
  });

  const labels = Array.from(byRegion.keys());
  const values = Array.from(byRegion.values());

  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Assessorias por Região',
          data: values,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: { autoSkip: false },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

/**
 * Mapa Leaflet com os municípios atendidos.
 */
async function renderMap(institutions, customColumns) {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Centraliza em Santa Catarina
  const map = L.map('map').setView([-27.3, -50.5], 7);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const badge = document.getElementById('mapaBadge');
  if (badge) badge.textContent = 'Carregando...';

  try {
    const response = await fetch('sc_municipios.geojson');
    if (!response.ok) {
      throw new Error('Erro ao carregar sc_municipios.geojson');
    }
    const geojson = await response.json();

    // Índice de instituições por município
    const byMunicipio = new Map();
    institutions.forEach((inst) => {
      const key = (inst.Municipio || '').trim().toLowerCase();
      if (!key) return;
      const value = sumQuantities(inst, customColumns);
      byMunicipio.set(key, (byMunicipio.get(key) || 0) + value);
    });

    let atendidos = 0;

    function getColor(total) {
      if (total === 0) return '#e5e7eb'; // cinza claro
      if (total <= 5) return '#bfdbfe'; // azul claro
      if (total <= 15) return '#60a5fa'; // azul médio
      return '#1d4ed8'; // azul forte
    }

    L.geoJSON(geojson, {
      style: (feature) => {
        const nome = (feature.properties.name || '').trim().toLowerCase();
        const total = byMunicipio.get(nome) || 0;
        if (total > 0) atendidos += 1;
        return {
          color: '#ffffff',
          weight: 1,
          fillOpacity: total > 0 ? 0.8 : 0.3,
          fillColor: getColor(total),
        };
      },
      onEachFeature: (feature, layer) => {
        const nome = feature.properties.name;
        const key = (nome || '').trim().toLowerCase();
        const total = byMunicipio.get(key) || 0;
        if (total > 0) {
          layer.bindPopup(
            `<strong>${nome}</strong><br/>Número de Assessorias: ${total}`,
          );
        } else {
          layer.bindPopup(`<strong>${nome}</strong><br/>Sem registros preenchidos`);
        }
      },
    }).addTo(map);

    if (badge) {
      badge.textContent =
        atendidos > 0
          ? `${atendidos} municípios com assessorias`
          : 'Sem registros preenchidos';
    }
  } catch (error) {
    console.error('Erro ao renderizar mapa:', error);
    if (badge) badge.textContent = 'Erro ao carregar mapa';
  }
}
