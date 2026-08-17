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

function setupNameList(listId, addBtnId) {
  const list = document.getElementById(listId);

  document.getElementById(addBtnId).addEventListener('click', () => {
    const row = addNameRow(list);
    row.querySelector('input[type="text"]').focus();
  });

  list.addEventListener('input', (e) => {
    if (e.target.type !== 'text') return;
    updateContinueButton();
  });

  list.addEventListener('click', (e) => {
    if (!e.target.classList.contains('remove-name-btn')) return;
    e.target.closest('.name-row').remove();
    updateContinueButton();
  });
}

function addNameRow(list) {
  const row = document.createElement('div');
  row.className = 'name-row';
  row.innerHTML = `
    <input type="text" data-i18n-placeholder="name_placeholder" placeholder="${translations.name_placeholder || 'Nimi'}">
    <button type="button" class="remove-name-btn">✕</button>
  `;
  list.appendChild(row);
  return row;
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

setupNameList('attending-list', 'add-attending-btn');
setupNameList('not-attending-list', 'add-not-attending-btn');

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
      speech: section.querySelector('.speech-checkbox').checked
    };
  });
}

// --- Submission ---

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHcskig-ev24MU7OyRaCk23EhnTpb3PIDdGiSiM6_DCz5gsnCbG3-orcR3wnJPiJBz/exec';

async function submitData(attendingNames, notAttendingNames) {
  // Direct Phase 1 submission (only not-attending names) uses the Continue
  // button and its own error element, since Phase 2 is never shown
  const isDirect = attendingNames.length === 0;
  const btn = document.getElementById(isDirect ? 'continue-btn' : 'submit-btn');
  const idleText = isDirect
    ? (translations.continue || 'Jatka')
    : (translations.submit || 'Lähetä');
  const errorMsg = document.getElementById(isDirect ? 'error-message-phase1' : 'error-message');

  btn.disabled = true;
  btn.textContent = translations.submitting || 'Lähetetään...';
  errorMsg.style.display = 'none';

  const submissionGroup = crypto.randomUUID();

  const guests = [];

  // Attending guests with details
  attendingNames.forEach((name, index) => {
    const section = document.querySelector(`.person-section[data-person-index="${index}"]`);
    const busRadio = section?.querySelector(`input[name="bus-${index}"]:checked`);
    const dietaryCheckbox = section?.querySelector('.dietary-checkbox');
    const dietaryInput = section?.querySelector('.dietary-input');
    const speechCheckbox = section?.querySelector('.speech-checkbox');
    guests.push({
      name,
      attending: 'Yes',
      bus: busRadio ? busRadio.value : 'none',
      dietary_restrictions: dietaryCheckbox?.checked ? (dietaryInput?.value.trim() || '') : '',
      speech: speechCheckbox?.checked ? 'Yes' : 'No',
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
      submission_group: submissionGroup
    });
  });

  try {
    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify({ guests }));

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.status !== 'ok') throw new Error(`Unexpected response: ${JSON.stringify(result)}`);

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
    errorMsg.style.display = '';
    btn.disabled = false;
    btn.textContent = idleText;
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
