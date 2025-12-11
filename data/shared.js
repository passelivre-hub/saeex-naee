const STORAGE_KEY = 'naee-cre-data';

export function loadData(initialData) {
  if (typeof localStorage === 'undefined') return initialData;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  try {
    return JSON.parse(saved);
  } catch (err) {
    return initialData;
  }
}

export function persistData(data) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function formatNumber(value) {
  return value.toLocaleString('pt-BR');
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export function computeDerived(cre) {
  const studentsOutside = Math.max(0, cre.publicoEE - cre.studentsInAEE);
  const schoolsWithoutAEE = Math.max(0, cre.totalSchools - cre.schoolsWithAEE);
  return {
    studentsOutside,
    outsidePct: percent(studentsOutside, cre.publicoEE),
    schoolsWithoutAEE,
    schoolsWithoutPct: percent(schoolsWithoutAEE, cre.totalSchools),
  };
}
