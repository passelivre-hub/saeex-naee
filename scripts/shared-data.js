// Funções e constantes compartilhadas entre o Painel (index.html) e o Admin (admin.html)
// Projeto: Saeex-Naee · FCEE

// Chaves do localStorage (já usando nomenclatura Saeex-Naee)
const STORAGE_KEY = 'saeex-naee-institutions';
const CUSTOM_COLUMNS_KEY = 'saeex-naee-custom-columns';

// Tipos padrão de assessoria
const DEFAULT_TYPES = ['Online', 'Presencial'];

// Colunas numéricas padrão para somatório
const QUANTITY_FIELDS = ['Qt Profissionais', 'Qt Estudantes Contemplados'];

/**
 * Carrega o CSV bruto do diretório data/.
 */
async function fetchCsvData() {
  const response = await fetch('data/instituicoes.csv');
  if (!response.ok) {
    throw new Error('Não foi possível carregar data/instituicoes.csv');
  }
  const text = await response.text();
  return parseCsv(text);
}

/**
 * Parser CSV bem simples, suficiente para o arquivo instituicoes.csv.
 * Considera separador vírgula e aspas duplas opcionais.
 */
function parseCsv(text) {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim());

  return rows
    .filter((row) => row.trim().length > 0)
    .map((row) => {
      const values = splitCsvRow(row);
      const entry = {};
      headers.forEach((header, idx) => {
        entry[header] = values[idx] !== undefined ? values[idx] : '';
      });
      return entry;
    });
}

/**
 * Divide uma linha CSV respeitando aspas duplas.
 */
function splitCsvRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];

    if (char === '"') {
      // alterna estado de aspas
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map((v) => v.trim());
}

/**
 * Normaliza uma instituição:
 * - garante presença dos campos base (texto)
 * - converte colunas numéricas para número
 */
function normalizeInstitution(raw) {
  const base = {
    Municipio: '',
    Regiao: '',
    'Nome Inst.': '',
    Tipo: '',
    Endereco: '',
    Telefone: '',
    'E-mail': '',
  };

  const entry = { ...base, ...raw };

  QUANTITY_FIELDS.forEach((field) => {
    entry[field] = Number(entry[field] || 0);
  });

  return entry;
}

/**
 * Garante que todas as colunas numéricas (padrão + customizadas) existam
 * e sejam numéricas.
 */
function applyQuantityDefaults(list, customColumns) {
  return list.map((raw) => {
    const normalized = normalizeInstitution(raw);

    customColumns.forEach((column) => {
      normalized[column] = Number(normalized[column] || 0);
    });

    return normalized;
  });
}

/**
 * Carrega instituições:
 * - tenta primeiro do localStorage
 * - se vazio, cai para o CSV inicial
 */
async function loadInstitutions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Falha ao ler instituições do localStorage, usando CSV.', e);
  }

  // Fallback para CSV
  const csvInstitutions = await fetchCsvData();
  return csvInstitutions;
}

/**
 * Persiste instituições no localStorage.
 */
function saveInstitutions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar instituições no localStorage', e);
  }
}

/**
 * Carrega colunas personalizadas do localStorage.
 */
function loadCustomColumns() {
  try {
    const stored = localStorage.getItem(CUSTOM_COLUMNS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error('Erro ao carregar colunas personalizadas', e);
    return [];
  }
}

/**
 * Salva colunas personalizadas no localStorage.
 */
function saveCustomColumns(columns) {
  try {
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
  } catch (e) {
    console.error('Erro ao salvar colunas personalizadas', e);
  }
}

/**
 * Soma colunas numéricas padrão + customizadas.
 */
function sumQuantities(entry, customColumns) {
  const baseTotal = QUANTITY_FIELDS.reduce(
    (total, field) => total + Number(entry[field] || 0),
    0,
  );

  const customTotal = customColumns.reduce(
    (total, column) => total + Number(entry[column] || 0),
    0,
  );

  return baseTotal + customTotal;
}
