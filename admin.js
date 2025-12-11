import { initialCreData } from './data/cre-data.js';
import { loadData, persistData } from './data/shared.js';

const state = {
  creData: loadData(initialCreData),
};

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

      persistData(state.creData);
    });
  });
}

document.addEventListener('DOMContentLoaded', renderAdminTable);
