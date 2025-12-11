import { initialCreData } from './data/cre-data.js';

const state = {
  creData: loadStoredData() ?? initialCreData,
  activeCre: null,
};

const palette = {
  toneA: '#006934',
  toneB: '#00a859',
  muted: '#8c9aa3',
};

function loadStoredData() {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem('naee-cre-data');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (err) {
    return null;
  }
}

function persistData() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('naee-cre-data', JSON.stringify(state.creData));
}

function formatNumber(value) {
  return value.toLocaleString('pt-BR');
}

function percent(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function computeDerived(cre) {
  const studentsOutside = Math.max(0, cre.publicoEE - cre.studentsInAEE);
  const schoolsWithoutAEE = Math.max(0, cre.totalSchools - cre.schoolsWithAEE);
  return {
    studentsOutside,
    outsidePct: percent(studentsOutside, cre.publicoEE),
    schoolsWithoutAEE,
    schoolsWithoutPct: percent(schoolsWithoutAEE, cre.totalSchools),
  };
}

function renderMap() {
  const grid = document.querySelector('#map-grid');
  grid.innerHTML = '';
  state.creData.forEach((cre, idx) => {
    const tile = document.createElement('div');
    tile.className = `cre-tile ${cre.hasAssessoria ? (idx % 2 === 0 ? 'tone-a' : 'tone-b') : 'tone-muted'} ${cre.hasAssessoria ? '' : 'badge'}`;
    tile.style.gridRow = cre.gridPosition?.row ?? 'auto';
    tile.style.gridColumn = cre.gridPosition?.column ?? 'auto';

    const title = document.createElement('div');
    title.className = 'cre-name';
    title.textContent = cre.name;

    const detail = document.createElement('div');
    detail.className = 'cre-detail';
    const derived = computeDerived(cre);
    detail.innerHTML = `Estudantes fora do AEE: <strong>${formatNumber(derived.studentsOutside)}</strong><br>Escolas sem AEE: <strong>${formatNumber(derived.schoolsWithoutAEE)}</strong>`;

    tile.appendChild(title);
    tile.appendChild(detail);
    tile.addEventListener('click', () => openPopup(cre.id));
    grid.appendChild(tile);
  });
}

function renderSummary() {
  const totals = state.creData.reduce(
    (acc, cre) => {
      acc.publicoEE += cre.publicoEE;
      acc.studentsInAEE += cre.studentsInAEE;
      acc.totalSchools += cre.totalSchools;
      acc.schoolsWithAEE += cre.schoolsWithAEE;
      acc.participants += cre.participants;
      acc.presenciais += cre.assessorias.presenciais;
      acc.online += cre.assessorias.online;
      return acc;
    },
    {
      publicoEE: 0,
      studentsInAEE: 0,
      totalSchools: 0,
      schoolsWithAEE: 0,
      participants: 0,
      presenciais: 0,
      online: 0,
    }
  );

  const studentsOutside = Math.max(0, totals.publicoEE - totals.studentsInAEE);
  const schoolsWithout = Math.max(0, totals.totalSchools - totals.schoolsWithAEE);

  const summary = document.querySelector('#summary');
  summary.innerHTML = '';
  const cards = [
    {
      title: 'Público da Educação Especial',
      value: formatNumber(totals.publicoEE),
      meta: `${percent(totals.studentsInAEE, totals.publicoEE)}% matriculados no AEE`,
      icon: '🎯',
    },
    {
      title: 'Estudantes fora do AEE',
      value: formatNumber(studentsOutside),
      meta: `${percent(studentsOutside, totals.publicoEE)}% precisam ser acompanhados`,
      icon: '🧭',
    },
    {
      title: 'Rede de Escolas',
      value: `${formatNumber(totals.schoolsWithAEE)} / ${formatNumber(totals.totalSchools)}`,
      meta: `${percent(totals.schoolsWithAEE, totals.totalSchools)}% possuem AEE`,
      icon: '🏫',
    },
    {
      title: 'Participantes assessorados',
      value: formatNumber(totals.participants),
      meta: `${formatNumber(totals.presenciais)} presenciais • ${formatNumber(totals.online)} on-line`,
      icon: '🤝',
    },
  ];

  cards.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'summary-card';
    el.innerHTML = `
      <div class="icon-label"><span>${card.icon}</span>${card.title}</div>
      <div class="value">${card.value}</div>
      <div class="meta">${card.meta}</div>
    `;
    summary.appendChild(el);
  });
}

function openPopup(creId) {
  const cre = state.creData.find((item) => item.id === creId);
  if (!cre) return;
  state.activeCre = cre;
  const derived = computeDerived(cre);

  const popup = document.querySelector('#popup');
  const content = popup.querySelector('.card');
  content.querySelector('.popup-title').textContent = cre.name;
  content.querySelector('.popup-sub').textContent = cre.municipios.join(' • ');
  content.querySelector('.popup-badge').textContent = cre.hasAssessoria ? 'Com assessoramento' : 'Sem assessoramento';

  const metrics = content.querySelector('.metric-grid');
  metrics.innerHTML = '';

  const metricList = [
    { label: 'Público Educação Especial', value: cre.publicoEE, icon: '📚' },
    { label: 'Total de Escolas', value: cre.totalSchools, icon: '🏫' },
    { label: 'Escolas com AEE', value: cre.schoolsWithAEE, icon: '🧩' },
    { label: 'Estudantes no AEE', value: cre.studentsInAEE, icon: '🎓' },
    { label: 'Participantes assessorados', value: cre.participants, icon: '🤝' },
    {
      label: 'Assessorias Presenciais',
      value: cre.assessorias.presenciais,
      icon: '📍',
      extra: `${cre.assessorias.online} on-line`,
    },
    {
      label: 'Estudantes fora do AEE',
      value: derived.studentsOutside,
      icon: '🧭',
      progress: derived.outsidePct,
    },
    {
      label: 'Escolas sem AEE',
      value: derived.schoolsWithoutAEE,
      icon: '🛠️',
      progress: derived.schoolsWithoutPct,
    },
  ];

  metricList.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <h4 class="icon-label"><span>${item.icon}</span>${item.label}</h4>
      <div class="value">${formatNumber(item.value)}</div>
      ${item.extra ? `<div class="meta">${item.extra}</div>` : ''}
      ${item.progress !== undefined ? `<div class="progress" aria-label="${item.progress}%"><span style="width:${item.progress}%"></span></div>` : ''}
    `;
    metrics.appendChild(card);
  });

  popup.style.display = 'flex';
}

function closePopup() {
  const popup = document.querySelector('#popup');
  popup.style.display = 'none';
}

function renderAdminTable() {
  const tbody = document.querySelector('#admin-body');
  tbody.innerHTML = '';
  state.creData.forEach((cre) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${cre.name}</strong></td>
      <td><input type="number" min="0" value="${cre.publicoEE}" data-id="${cre.id}" data-field="publicoEE"></td>
      <td><input type="number" min="0" value="${cre.totalSchools}" data-id="${cre.id}" data-field="totalSchools"></td>
      <td><input type="number" min="0" value="${cre.schoolsWithAEE}" data-id="${cre.id}" data-field="schoolsWithAEE"></td>
      <td><input type="number" min="0" value="${cre.studentsInAEE}" data-id="${cre.id}" data-field="studentsInAEE"></td>
      <td><input type="number" min="0" value="${cre.participants}" data-id="${cre.id}" data-field="participants"></td>
      <td><input type="number" min="0" value="${cre.assessorias.presenciais}" data-id="${cre.id}" data-field="presenciais"></td>
      <td><input type="number" min="0" value="${cre.assessorias.online}" data-id="${cre.id}" data-field="online"></td>
      <td class="toggle"><input type="checkbox" ${cre.hasAssessoria ? 'checked' : ''} data-id="${cre.id}" data-field="hasAssessoria"><label>Assessorado</label></td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const { id, field } = event.target.dataset;
      const cre = state.creData.find((item) => item.id === id);
      if (!cre) return;

      if (field === 'hasAssessoria') {
        cre.hasAssessoria = event.target.checked;
      } else if (field === 'presenciais' || field === 'online') {
        cre.assessorias[field] = Number(event.target.value || 0);
      } else {
        cre[field] = Number(event.target.value || 0);
      }
      persistData();
      renderMap();
      renderSummary();
    });
  });
}

function init() {
  renderMap();
  renderSummary();
  renderAdminTable();

  document.querySelector('#popup .close-btn').addEventListener('click', closePopup);
  document.querySelector('#popup').addEventListener('click', (e) => {
    if (e.target.id === 'popup') closePopup();
  });
}

document.addEventListener('DOMContentLoaded', init);
