// Lógica do Painel Admin (admin.html) · Saeex-Naee

const credentials = { username: 'admin', password: 'certa2024' }; // ajuste se quiser
const sessionKey = 'saeex-naee-session-auth';

const TYPE_OPTIONS = ['Online', 'Presencial'];
const REGION_OPTIONS = [
  'Oeste',
  'Vale do Itajaí',
  'Norte',
  'Serra',
  'Grande Florianópolis',
  'Sul',
];

let institutions = [];
let customColumns = [];

(async function initAdmin() {
  customColumns = loadCustomColumns();
  const institutionsRaw = await loadInstitutions();
  institutions = applyQuantityDefaults(institutionsRaw, customColumns);

  handleAuth();
  populateNewTypeSelect();
  populateNewRegionSelect();
  renderCustomColumns();
  renderTable();
  bindEvents();
})();

/**
 * Login simples com overlay.
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
 * Select de tipo (Online / Presencial) no formulário de nova instituição.
 */
function populateNewTypeSelect() {
  const select = document.getElementById('new-type-select');
  if (!select) return;

  select.innerHTML = TYPE_OPTIONS.map(
    (t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`,
  ).join('');
}

/**
 * Select de região no formulário de nova instituição.
 */
function populateNewRegionSelect() {
  const select = document.getElementById('new-regiao');
  if (!select) return;

  select.innerHTML = REGION_OPTIONS.map(
    (r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`,
  ).join('');
}

/**
 * Render de colunas personalizadas.
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
 * Escape básico de HTML.
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Monta um <select> para Tipo ou Região na tabela.
 */
function buildSelect(fieldName, index, currentValue, options) {
  const opts = [...options];
  if (currentValue && !opts.includes(currentValue)) {
    opts.unshift(currentValue);
  }

  const optionsHtml = opts
    .map(
      (val) =>
        `<option value="${escapeHtml(val)}"${
          val === currentValue ? ' selected' : ''
        }>${escapeHtml(val)}</option>`,
    )
    .join('');

  return `<select data-index="${index}" data-field="${fieldName}">${optionsHtml}</select>`;
}

/**
 * Renderiza tabela principal.
 * Editáveis: Município, Nome da Instituição, Endereço, Telefone, E-mail, Tipo, Região.
 */
function renderTable() {
  const tbody = document.getElementById('institutions-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  institutions.forEach((inst, index) => {
    const municipio = inst.Municipio || '';
    const regiao = inst.Regiao || '';
    const nomeInst = inst['Nome Inst.'] || '';
    const tipo = inst.Tipo || '';
    const endereco = inst.Endereco || '';
    const telefone = inst.Telefone || '';
    const email = inst['E-mail'] || '';

    const tipoSelectHtml = buildSelect('Tipo', index, tipo, TYPE_OPTIONS);
    const regiaoSelectHtml = buildSelect('Regiao', index, regiao, REGION_OPTIONS);

    const rowHtml = `
      <td>
        <input
          type="text"
          data-index="${index}"
          data-field="Municipio"
          value="${escapeHtml(municipio)}"
        />
      </td>
      <td>
        ${regiaoSelectHtml}
      </td>
      <td>
        <input
          type="text"
          data-index="${index}"
          data-field="Nome Inst."
          value="${escapeHtml(nomeInst)}"
        />
      </td>
      <td>
        ${tipoSelectHtml}
      </td>
      <td>
        <input
          type="text"
          data-index="${index}"
          data-field="Endereco"
          value="${escapeHtml(endereco)}"
        />
      </td>
      <td>
        <input
          type="text"
          data-index="${index}"
          data-field="Telefone"
          value="${escapeHtml(telefone)}"
        />
      </td>
      <td>
        <input
          type="email"
          data-index="${index}"
          data-field="E-mail"
          value="${escapeHtml(email)}"
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          data-index="${index}"
          data-field="Qt Profissionais"
          value="${Number(inst['Qt Profissionais'] || 0)}"
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          data-index="${index}"
          data-field="Qt Estudantes Contemplados"
          value="${Number(inst['Qt Estudantes Contemplados'] || 0)}"
        />
      </td>
      ${customColumns
        .map(
          (column) => `
          <td>
            <input
              type="number"
              min="0"
              data-index="${index}"
              data-field="${escapeHtml(column)}"
              value="${Number(inst[column] || 0)}"
            />
          </td>`,
        )
        .join('')}
      <td>
        <button
          type="button"
          class="danger"
          data-action="delete"
          data-index="${index}"
        >
          Excluir
        </button>
      </td>
    `;

    const tr = document.createElement('tr');
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });
}

/**
 * Eventos gerais.
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

      institutions.push(newItem);
      institutions = applyQuantityDefaults(institutions, customColumns);
      saveInstitutions(institutions);
      renderTable();

      newInstForm.reset();
      populateNewTypeSelect();
      populateNewRegionSelect();
    });
  }

  const tbody = document.getElementById('institutions-body');
  if (tbody) {
    tbody.addEventListener('input', handleFieldUpdate);
    tbody.addEventListener('change', handleFieldUpdate);

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
 * Atualiza o objeto de dados ao editar inputs/selects.
 */
function handleFieldUpdate(event) {
  const element = event.target;
  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLSelectElement)
  ) {
    return;
  }

  const idx = Number(element.getAttribute('data-index'));
  const field = element.getAttribute('data-field');

  if (!field || !Number.isInteger(idx) || idx < 0 || idx >= institutions.length) {
    return;
  }

  if (element.type === 'number') {
    institutions[idx][field] = Number(element.value || 0);
  } else {
    institutions[idx][field] = element.value;
  }

  saveInstitutions(institutions);
}
