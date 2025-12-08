const STORAGE_KEY = 'certa-institutions';
const CUSTOM_COLUMNS_KEY = 'certa-custom-columns';
const DEFAULT_TYPES = ['Online', 'Presencial'];
const QUANTITY_FIELDS = ['Qt Profissionais', 'Qt Estudantes Contemplados'];

async function fetchCsvData() {
  const response = await fetch('data/instituicoes.csv');
  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return rows.map((row) => {
    const values = row.split(',');
    return headers.reduce((acc, header, idx) => {
      acc[header.trim()] = (values[idx] || '').trim();
      return acc;
    }, {});
  });
}

async function loadInstitutions() {
  const persisted = localStorage.getItem(STORAGE_KEY);
  const baseData = persisted ? JSON.parse(persisted) : await fetchCsvData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(baseData));
  return baseData;
}

function saveInstitutions(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCustomColumns() {
  const persisted = localStorage.getItem(CUSTOM_COLUMNS_KEY);
  if (persisted) {
    return JSON.parse(persisted);
  }
  const defaults = [];
  localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(defaults));
  return defaults;
}

function applyQuantityDefaults(data, customColumns = []) {
  return data.map((entry) => {
    const normalized = { ...entry };
    QUANTITY_FIELDS.forEach((field) => {
      normalized[field] = Number(entry[field] || 0);
    });
    customColumns.forEach((field) => {
      normalized[field] = Number(entry[field] || 0);
    });
    return normalized;
  });
}

function saveCustomColumns(columns) {
  localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
}

function sumQuantities(entry, customColumns) {
  const baseTotal = QUANTITY_FIELDS.reduce((total, field) => total + Number(entry[field] || 0), 0);
  const customTotal = customColumns.reduce((total, column) => total + Number(entry[column] || 0), 0);
  return baseTotal + customTotal;
}
