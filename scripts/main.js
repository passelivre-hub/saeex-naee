(async function initDashboard() {
  const customColumns = loadCustomColumns();
  const institutions = applyQuantityDefaults(await loadInstitutions(), customColumns);

  renderSummaryCards(institutions, customColumns);
  renderTipoChart(institutions, customColumns);
  renderRegiaoChart(institutions, customColumns);
  renderMap(institutions, customColumns);
})();

function renderSummaryCards(data, customColumns) {
  const container = document.getElementById('summary-cards');
  const totalAssessorias = data.reduce((total, item) => total + sumQuantities(item, customColumns), 0);
  const totalInstituicoes = data.length;
  const regioes = new Set(data.map((i) => i.Regiao));

  const cards = [
    {
      title: 'Número de Assessorias registradas',
      value: totalAssessorias,
      badge: `${totalInstituicoes} instituições ativas`,
    },
    {
      title: 'Regiões atendidas',
      value: regioes.size,
      badge: 'Abrangência estadual',
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
      <div class="card">
        <h3>${card.title}</h3>
        <p class="stat-value">${card.value}</p>
        <span class="badge">${card.badge}</span>
      </div>
    `
    )
    .join('');
}

function renderTipoChart(data, customColumns) {
  const totals = {};
  data.forEach((item) => {
    const tipo = item.Tipo || 'Não informado';
    totals[tipo] = (totals[tipo] || 0) + sumQuantities(item, customColumns);
  });

  const ctx = document.getElementById('tipoChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [
        {
          label: 'Número de Assessorias',
          data: Object.values(totals),
          backgroundColor: '#00a0df',
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderRegiaoChart(data, customColumns) {
  const totals = {};
  data.forEach((item) => {
    const regiao = item.Regiao || 'Não informado';
    totals[regiao] = (totals[regiao] || 0) + sumQuantities(item, customColumns);
  });

  const ctx = document.getElementById('regiaoChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [
        {
          label: 'Número de Assessorias',
          data: Object.values(totals),
          backgroundColor: '#f59e0b',
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderMap(data, customColumns) {
  const map = L.map('map').setView([-27.2423, -50.2189], 6.7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  const normalizeName = (value) =>
    (value || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const totalsByMunicipio = {};
  data.forEach((item) => {
    const municipio = (item.Municipio || '').trim();
    if (!municipio) return;
    const total = sumQuantities(item, customColumns);
    const key = normalizeName(municipio);
    if (!totalsByMunicipio[key]) {
      totalsByMunicipio[key] = { total: 0, entries: [], displayName: municipio };
    }
    totalsByMunicipio[key].total += total;
    totalsByMunicipio[key].entries.push(item);
  });

  fetch('sc_municipios.geojson')
    .then((response) => response.json())
    .then((geojson) => {
      let atendidos = 0;

      L.geoJSON(geojson, {
        style: (feature) => {
          const municipio = feature.properties.name;
          const info = totalsByMunicipio[normalizeName(municipio)];
          if (info && info.total > 0) {
            atendidos += 1;
            return {
              fillColor: '#16a34a',
              color: '#0f5132',
              weight: 1,
              fillOpacity: 0.6,
            };
          }
          return {
            fillColor: '#e5e7eb',
            color: '#cbd5e1',
            weight: 1,
            fillOpacity: 0.4,
          };
        },
        onEachFeature: (feature, layer) => {
          const municipio = feature.properties.name;
          const info = totalsByMunicipio[normalizeName(municipio)];
          if (info && info.total > 0) {
            const inst = info.entries[0];
            const municipioTitulo = inst.Municipio || info.displayName || municipio;
            const popup = `
              <strong>${municipioTitulo}</strong><br/>
              Instituição: ${inst['Nome Inst.'] || '---'}<br/>
              Tipo de assessoria: ${inst.Tipo || '---'}<br/>
              Endereço: ${inst.Endereco || '---'}<br/>
              Telefone: ${inst.Telefone || '---'}<br/>
              E-mail: ${inst['E-mail'] || '---'}<br/>
              Número de Assessorias: ${info.total}
            `;
            layer.bindPopup(popup);
          }
        },
      }).addTo(map);

      const badge = document.getElementById('mapaBadge');
      badge.textContent = atendidos > 0 ? `${atendidos} municípios com assessorias` : 'Sem registros preenchidos';
    });
}
