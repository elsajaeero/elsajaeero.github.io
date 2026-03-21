let currentLang = 'fi';
let translations = {};

// Phase 2 state — preserved across phase transitions
let phase2Data = {};

// --- Translation system ---

async function loadTranslations(lang) {
  const response = await fetch(`lang/${lang}.json`);
  translations = await response.json();
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = translations[el.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = translations[el.dataset.i18nPlaceholder];
  });
}

document.querySelectorAll('.lang-toggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.documentElement.lang = currentLang;
    loadTranslations(currentLang);
  });
});

// --- Phase 1: Name Lists ---

function setupNameList(listId, firstRemovable) {
  const list = document.getElementById(listId);

  list.addEventListener('input', (e) => {
    if (e.target.type !== 'text') return;
    const rows = list.querySelectorAll('.name-row');
    const lastRow = rows[rows.length - 1];
    const lastInput = lastRow.querySelector('input[type="text"]');

    // Auto-expand: if last input has text, add a new row
    if (lastInput.value.trim() !== '' && e.target === lastInput) {
      addNameRow(list, true);
    }

    updateRemoveButtons(list, firstRemovable);
    updateContinueButton();
  });

  list.addEventListener('click', (e) => {
    if (!e.target.classList.contains('remove-name-btn')) return;
    const row = e.target.closest('.name-row');
    row.remove();
    updateRemoveButtons(list, firstRemovable);
    updateContinueButton();
  });
}

function addNameRow(list, removable) {
  const row = document.createElement('div');
  row.className = 'name-row';
  row.innerHTML = `
    <input type="text" data-i18n-placeholder="name_placeholder" placeholder="${translations.name_placeholder || 'Nimi'}">
    ${removable ? '<button type="button" class="remove-name-btn">✕</button>' : ''}
  `;
  list.appendChild(row);
}

function updateRemoveButtons(list, firstRemovable) {
  const rows = list.querySelectorAll('.name-row');
  rows.forEach((row, index) => {
    const btn = row.querySelector('.remove-name-btn');
    if (!btn) return;

    const input = row.querySelector('input[type="text"]');
    const isLast = index === rows.length - 1;
    const isEmpty = input.value.trim() === '';

    if (!firstRemovable && index === 0) {
      // First row in attending list — never show remove
      btn.style.display = 'none';
    } else if (isLast && isEmpty) {
      // Last empty row — hide remove
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }
  });
}

function getNames(listId) {
  const list = document.getElementById(listId);
  const inputs = list.querySelectorAll('input[type="text"]');
  return Array.from(inputs)
    .map(input => input.value.trim())
    .filter(name => name !== '');
}

function updateContinueButton() {
  const attending = getNames('attending-list');
  const notAttending = getNames('not-attending-list');
  document.getElementById('continue-btn').disabled =
    attending.length === 0 && notAttending.length === 0;
}

setupNameList('attending-list', false);
setupNameList('not-attending-list', true);

// --- Phase Navigation ---

document.getElementById('continue-btn').addEventListener('click', () => {
  const attendingNames = getNames('attending-list');
  const notAttendingNames = getNames('not-attending-list');

  if (attendingNames.length === 0 && notAttendingNames.length > 0) {
    // Only not-attending names — skip Phase 2, submit directly
    submitData([], notAttendingNames);
    return;
  }

  // Show Phase 2
  showPhase2(attendingNames);
});

function showPhase(showId, hideId) {
  document.getElementById(hideId).style.display = 'none';
  const target = document.getElementById(showId);
  target.style.display = '';
  // Re-trigger fade animation
  target.style.animation = 'none';
  target.offsetHeight; // force reflow
  target.style.animation = '';
}

function showPhase2(names) {
  showPhase('phase-2', 'phase-1');
  buildPersonDetails(names);
  applyTranslations();
}

function showPhase1() {
  showPhase('phase-1', 'phase-2');
}

document.getElementById('back-btn').addEventListener('click', () => {
  // Save Phase 2 state before going back
  savePhase2State();
  showPhase1();
});

// --- Phase 2: Person Details ---

function buildPersonDetails(names) {
  const container = document.getElementById('person-details');
  container.innerHTML = '';

  names.forEach((name, index) => {
    const section = document.createElement('div');
    section.className = 'person-section';
    section.dataset.personIndex = index;

    // Restore saved state if going back and forth
    const saved = phase2Data[name] || {};

    section.innerHTML = `
      <h3>${escapeHtml(name)}</h3>

      <p class="section-heading"><strong data-i18n="bus_label">${translations.bus_label || 'Kuljetus'}</strong></p>
      <p class="section-desc" data-i18n="bus_desc">${translations.bus_desc || ''}</p>
      <div class="radio-group" data-person="${index}">
        <label>
          <input type="radio" name="bus-${index}" value="both" ${saved.bus === 'both' ? 'checked' : ''}>
          <span>
            <strong data-i18n="bus_both">${translations.bus_both || ''}</strong>
            <span class="radio-desc" data-i18n="bus_both_desc">${translations.bus_both_desc || ''}</span>
          </span>
        </label>
        <label>
          <input type="radio" name="bus-${index}" value="one_way" ${saved.bus === 'one_way' ? 'checked' : ''}>
          <span>
            <strong data-i18n="bus_one_way">${translations.bus_one_way || ''}</strong>
            <span class="radio-desc" data-i18n="bus_one_way_desc">${translations.bus_one_way_desc || ''}</span>
          </span>
        </label>
        <label>
          <input type="radio" name="bus-${index}" value="none" ${saved.bus === 'none' ? 'checked' : ''}>
          <strong data-i18n="bus_none">${translations.bus_none || ''}</strong>
        </label>
      </div>

      <label class="checkbox-label dietary-gate">
        <input type="checkbox" class="dietary-checkbox" ${saved.hasDietary ? 'checked' : ''}>
        <span>
          <strong data-i18n="dietary_checkbox">${translations.dietary_checkbox || 'Ruokavaliorajoitteet'}</strong>
          <span class="checkbox-desc" data-i18n="dietary_desc">${translations.dietary_desc || ''}</span>
        </span>
      </label>
      <div class="dietary-text" style="${saved.hasDietary ? '' : 'display: none;'}">
        <textarea class="dietary-input" rows="1">${escapeHtml(saved.dietaryText || '')}</textarea>
      </div>

      <label class="checkbox-label">
        <input type="checkbox" class="baby-chair-checkbox" ${saved.babyChair ? 'checked' : ''}>
        <strong data-i18n="baby_chair">${translations.baby_chair || 'Tarvitsee syöttötuolin'}</strong>
      </label>

      <label class="checkbox-label">
        <input type="checkbox" class="speech-checkbox" ${saved.speech ? 'checked' : ''}>
        <strong data-i18n="speech">${translations.speech || 'Haluaisin pitää puheen'}</strong>
      </label>

    `;

    container.appendChild(section);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-grow textareas
document.getElementById('person-details').addEventListener('input', (e) => {
  if (e.target.classList.contains('dietary-input')) {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }
});

// Event delegation on #person-details — registered once, not per buildPersonDetails call
document.getElementById('person-details').addEventListener('change', (e) => {
  // Dietary checkbox gate
  if (e.target.classList.contains('dietary-checkbox')) {
    const textDiv = e.target.closest('.person-section').querySelector('.dietary-text');
    textDiv.style.display = e.target.checked ? '' : 'none';
  }

  // Clear bus validation error on selection
  if (e.target.type === 'radio' && e.target.name.startsWith('bus-')) {
    e.target.closest('.radio-group').classList.remove('invalid');
  }
});

function savePhase2State() {
  const sections = document.querySelectorAll('.person-section');
  const names = getNames('attending-list');

  sections.forEach((section, index) => {
    const name = names[index];
    if (!name) return;

    const busRadio = section.querySelector(`input[name="bus-${index}"]:checked`);
    phase2Data[name] = {
      bus: busRadio ? busRadio.value : null,
      hasDietary: section.querySelector('.dietary-checkbox').checked,
      dietaryText: section.querySelector('.dietary-input')?.value || '',
      speech: section.querySelector('.speech-checkbox').checked,
      babyChair: section.querySelector('.baby-chair-checkbox').checked
    };
  });
}

// --- Submission ---

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHcskig-ev24MU7OyRaCk23EhnTpb3PIDdGiSiM6_DCz5gsnCbG3-orcR3wnJPiJBz/exec';

async function submitData(attendingNames, notAttendingNames) {
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-message');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = translations.submitting || 'Lähetetään...';
  }
  if (errorMsg) errorMsg.style.display = 'none';

  const submissionGroup = crypto.randomUUID();

  const guests = [];

  // Attending guests with details
  attendingNames.forEach((name, index) => {
    const section = document.querySelector(`.person-section[data-person-index="${index}"]`);
    const busRadio = section?.querySelector(`input[name="bus-${index}"]:checked`);
    const dietaryCheckbox = section?.querySelector('.dietary-checkbox');
    const dietaryInput = section?.querySelector('.dietary-input');
    const speechCheckbox = section?.querySelector('.speech-checkbox');
    const babyChairCheckbox = section?.querySelector('.baby-chair-checkbox');
    guests.push({
      name,
      attending: 'Yes',
      bus: busRadio ? busRadio.value : 'none',
      dietary_restrictions: dietaryCheckbox?.checked ? (dietaryInput?.value.trim() || '') : '',
      speech: speechCheckbox?.checked ? 'Yes' : 'No',
      baby_chair: babyChairCheckbox?.checked ? 'Yes' : 'No',
      submission_group: submissionGroup
    });
  });

  // Not-attending guests
  notAttendingNames.forEach(name => {
    guests.push({
      name,
      attending: 'No',
      bus: '',
      dietary_restrictions: '',
      speech: '',
      baby_chair: '',
      submission_group: submissionGroup
    });
  });

  try {
    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify({ guests }));

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    });

    // Show confirmation
    document.getElementById('phase-1').style.display = 'none';
    document.getElementById('phase-2').style.display = 'none';
    const thankYou = document.getElementById('thank-you');
    thankYou.style.display = '';
    thankYou.style.animation = 'none';
    thankYou.offsetHeight;
    thankYou.style.animation = '';
  } catch (error) {
    console.error('Submission failed:', error);
    if (errorMsg) errorMsg.style.display = '';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = translations.submit || 'Lähetä';
    }
  }
}

// Form submit handler (Phase 2)
document.getElementById('rsvp-form').addEventListener('submit', (e) => {
  e.preventDefault();

  // Validate: all bus rides must be selected
  const radioGroups = document.querySelectorAll('.radio-group');
  let valid = true;
  radioGroups.forEach(group => {
    const personIndex = group.dataset.person;
    const selected = group.querySelector(`input[name="bus-${personIndex}"]:checked`);
    if (!selected) {
      group.classList.add('invalid');
      valid = false;
    } else {
      group.classList.remove('invalid');
    }
  });

  if (!valid) return;

  const attendingNames = getNames('attending-list');
  const notAttendingNames = getNames('not-attending-list');
  submitData(attendingNames, notAttendingNames);
});

// --- Init ---

loadTranslations(currentLang);
