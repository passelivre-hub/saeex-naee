// Lógica do Painel Admin (admin.html) · Saeex-Naee

const credentials = { username: 'admin', password: 'certa2024' }; // mantém login/senha originais
const sessionKey = 'saeex-naee-session-auth';

let institutions = [];
let customColumns = [];

(async function initAdmin() {
  customColumns = loadCustomColumns();
  const institutionsRaw = await loadInstitutions();
  institutions = applyQuantityDefaults(institutionsRaw, customColumns);

  handleAuth();
  populateNewTypeSelect();
  renderCustomColumns();
  renderTable();
  bindEvents();
})();

/**
 * Garante overlay de login e sessão simples.
 */
function handleAuth() {
  const overlay = document.getElementById('login-overlay');
  const loggedIn = sessionStorage.getItem(sessionKey) === 'true';

  if (loggedIn) {
    if (overlay) overlay.style.display = 'none';
    return;
  }

  if (overlay) overlay.style.display = 'flex';

  const loginButton = document.getElementById('login-button');
  if (!loginButton) return;

  loginButton.addEventListener('click', () => {
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    const errorBox = document.getElementById('login-error');

    const username = userInput?.value || '';
    const password = passInput?.value || '';

    if (
      username === credentials.username &&
      password === credentials.password
    ) {
      sessionStorage.setItem(sessionKey, 'true');
      if (overlay) overlay.style.display = 'none';
    } else if (errorBox) {
      errorBox.textContent = 'Usuário ou senha inválidos.';
      errorBox.style.display = 'block';
    }
  });
}

/**
 * Preenche o select de tipo da nova instituição.
 */
function populateNewTypeSelect() {
  const select = document.getElementById('new-type-select');
  if (!select) return;

  const typesSet = new Set(DEFAULT_TYPES);
  institutions.forEach((inst) => {
    const t = (inst.Tipo || '').trim();
    if (t) typesSet.add(t);
  });

  select.innerHTML = '';
  Array.from(typesSet).forEach((type) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
}

/**
 * Renderiza lista de colunas dinâmicas (apenas nomes).
 */
function renderCustomColumns() {
  const container = document.getElementById('custom-columns-list');
  if (!container) return;

  if (customColumns.length === 0) {
    container.innerHTML = '<p class="muted">Nenhuma coluna extra cadastrada.</p>';
    return;
  }

  container.innerHTML = '';
  customColumns.forEach((column) => {
    const item = document.createElement('div');
    item.className = 'chip';
    item.textContent = column;
    container.appendChild(item);
  });
}

/**
 * Renderiza tabela principal de instituições.
 */
function renderTable() {
  const tbody = document.getElementById('institutions-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  institutions.forEach((inst, index) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${inst.Municipio || ''}</td>
      <td>${inst.Regiao || ''}</td>
      <td>${inst['Nome Inst.'] || ''}</td>
      <td>${inst.Tipo || ''}</td>
      <td>${inst.Endereco || ''}</td>
      <td>${inst.Telefone || ''}</td>
      <td>${inst['E-mail'] || ''}</td>
      <td><input type="number" min="0" data-index="${index}" data-field="Qt Profissionais" value="${Number(inst['Qt Profissionais'] || 0)}" /></td>
      <td><input type="number" min="0" data-index="${index}" data-field="Qt Estudantes Contemplados" value="${Number(inst['Qt Estudantes Contemplados'] || 0)}" /></td>
      ${customColumns
        .map(
          (column) =>
            `<td><input type="number" min="0" data-index="${index}" data-field="${column}" value="${Number(
              inst[column] || 0,
            )}" /></td>`,
        )
        .join('')}
      <td><button type="button" class="danger" data-action="delete" data-index="${index}">Excluir</button></td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Eventos principais do Admin.
 */
function bindEvents() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      sessionStorage.removeItem(sessionKey);
      window.location.reload();
    });
  }

  const addColumnForm = document.getElementById('new-column-form');
  if (addColumnForm) {
    addColumnForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('new-column-name');
      const name = input?.value.trim();
      if (!name) return;
      if (!customColumns.includes(name)) {
        customColumns.push(name);
        saveCustomColumns(customColumns);
        // também garante a coluna nas instituições existentes
        institutions = applyQuantityDefaults(institutions, customColumns);
        saveInstitutions(institutions);
        renderCustomColumns();
        renderTable();
      }
      if (input) input.value = '';
    });
  }

  const newInstForm = document.getElementById('new-institution-form');
  if (newInstForm) {
    newInstForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const municipio = document.getElementById('new-municipio');
      const regiao = document.getElementById('new-regiao');
      const nomeInst = document.getElementById('new-nome-inst');
      const tipo = document.getElementById('new-type-select');
      const endereco = document.getElementById('new-endereco');
      const telefone = document.getElementById('new-telefone');
      const email = document.getElementById('new-email');

      const newItem = {
        Municipio: municipio?.value.trim() || '',
        Regiao: regiao?.value.trim() || '',
        'Nome Inst.': nomeInst?.value.trim() || '',
        Tipo: tipo?.value.trim() || '',
        Endereco: endereco?.value.trim() || '',
        Telefone: telefone?.value.trim() || '',
        'E-mail': email?.value.trim() || '',
      };

      // Garante as colunas numéricas padrão e customizadas
      institutions.push(newItem);
      institutions = applyQuantityDefaults(institutions, customColumns);
      saveInstitutions(institutions);
      renderTable();

      newInstForm.reset();
      populateNewTypeSelect();
    });
  }

  // Atualização de campos numéricos + excluir linha
  const tbody = document.getElementById('institutions-body');
  if (tbody) {
    tbody.addEventListener('input', handleFieldUpdate);
    tbody.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute('data-action');
      if (action === 'delete') {
        const idx = Number(target.getAttribute('data-index'));
        if (Number.isInteger(idx) && idx >= 0 && idx < institutions.length) {
          institutions.splice(idx, 1);
          saveInstitutions(institutions);
          renderTable();
        }
      }
    });
  }
}

/**
 * Atualiza o objeto quando o usuário altera um input numérico/texto.
 */
function handleFieldUpdate(event) {
  const element = event.target;
  if (!(element instanceof HTMLInputElement)) return;

  const idx = Number(element.getAttribute('data-index'));
  const field = element.getAttribute('data-field');

  if (!field || !Number.isInteger(idx) || idx < 0 || idx >= institutions.length) {
    return;
  }

  institutions[idx][field] =
    element.type === 'number' ? Number(element.value || 0) : element.value;

  saveInstitutions(institutions);
}
