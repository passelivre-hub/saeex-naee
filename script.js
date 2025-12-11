import { initialCreData } from './data/cre-data.js';
import { computeDerived, formatNumber, loadData, percent } from './data/shared.js';

const GRID_COLS = 8;
const GRID_ROWS = 7;

const state = {
  creData: loadData(initialCreData),
  activeCre: null,
};

function mapCoordinates(cre) {
  const col = cre.gridPosition?.column ?? 1;
  const row = cre.gridPosition?.row ?? 1;
  const left = ((col - 1) / (GRID_COLS - 1)) * 100;
  const top = ((row - 1) / (GRID_ROWS - 1)) * 100;
  return { left, top };
}

function renderMap() {
  const board = document.querySelector('#map-markers');
  board.innerHTML = '';
  state.creData.forEach((cre, idx) => {
    const marker = document.createElement('button');
    const { left, top } = mapCoordinates(cre);
    marker.className = `map-marker ${cre.hasAssessoria ? (idx % 2 === 0 ? 'tone-a' : 'tone-b') : 'tone-muted'}`;
    marker.style.left = `${left}%`;
    marker.style.top = `${top}%`;
    marker.setAttribute('aria-label', `${cre.name} - clique para detalhes`);

    marker.innerHTML = `
      <span class="dot"></span>
      <span class="label">${cre.name}</span>
    `;

    marker.addEventListener('click', () => openPopup(cre.id));
    board.appendChild(marker);
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

function init() {
  renderMap();
  renderSummary();

  document.querySelector('#popup .close-btn').addEventListener('click', closePopup);
  document.querySelector('#popup').addEventListener('click', (e) => {
    if (e.target.id === 'popup') closePopup();
  });
}

document.addEventListener('DOMContentLoaded', init);
