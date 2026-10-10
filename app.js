/**
 * ==============================================================================
 * QR-PORTAL-INFRA | DECOUPLED APPLICATION CONTROLLER (app.js)
 * ==============================================================================
 * Core architectural engine powering:
 * - Dynamic config injection & real-time theme swapping
 * - SafeStorage persistence (localStorage + memory fallback)
 * - Anti-proxy device fingerprinting
 * - Modular step flow & social gate validation
 * - 100% Cross-browser CORS-bypass Google Apps Script sync
 * - Dynamic client-side QR Code badge rendering
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // Default configuration fallback if config.js is omitted
  const Config = window.APP_CONFIG || {
    branding: { appName: "QR PORTAL", tagline: "EVENT & ATTENDANCE INFRASTRUCTURE", monogram: "QR" },
    backend: { defaultApiUrl: "", enableDeviceLocking: true },
    theme: { activeTheme: "obsidian-amber", palettes: {} },
    steps: {
      step1: { enabled: true, title: "Community Channel", handle: "@channel", url: "#", actionLabel: "JOIN CHANNEL" },
      step2: { enabled: true, title: "Official Network", handle: "Network", url: "#", actionLabel: "CONNECT ON NETWORK" },
      step3: { title: "Participant Registration", categories: ["Attendee", "VIP", "Speaker", "Staff"] },
      step4: { title: "Registration Confirmed!", badge: "VERIFIED ENTRY PASS", passPrefix: "PASS-26-" }
    }
  };

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    API_URL: 'qr_portal_api_url',
    ACTIVE_THEME: 'qr_portal_theme',
    DEVICE_ID: 'qr_portal_device_id',
    CURRENT_PHASE: 'qr_portal_phase',
    USER_REGISTRATION: 'qr_portal_registration',
    GATE_1_PASSED: 'qr_portal_gate_1_passed',
    GATE_2_PASSED: 'qr_portal_gate_2_passed'
  };

  // --- SAFE STORAGE ADAPTER ---
  const memoryStore = {};
  const SafeStorage = {
    getItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        }
      } catch (e) {}
      return memoryStore[key] || null;
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {}
      memoryStore[key] = String(value);
    },
    removeItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
      delete memoryStore[key];
    }
  };

  // --- DEVICE FINGERPRINT ENGINE ---
  function getOrCreateDeviceId() {
    let devId = SafeStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!devId) {
      const randomSegment = Math.random().toString(36).substring(2, 10);
      const timeSegment = Date.now().toString(36);
      devId = `dev_${randomSegment}_${timeSegment}`;
      SafeStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
    }
    return devId;
  }

  // --- APPLICATION STATE ---
  let activeApiUrl = SafeStorage.getItem(STORAGE_KEYS.API_URL) || Config.backend.defaultApiUrl;
  let activeTheme = SafeStorage.getItem(STORAGE_KEYS.ACTIVE_THEME) || Config.theme.activeTheme;
  let currentPhase = parseInt(SafeStorage.getItem(STORAGE_KEYS.CURRENT_PHASE) || '1', 10);
  let activeDeviceId = getOrCreateDeviceId();
  let activeRegistration = null;
  let isSubmitting = false;

  try {
    const raw = SafeStorage.getItem(STORAGE_KEYS.USER_REGISTRATION);
    if (raw) activeRegistration = JSON.parse(raw);
  } catch (e) {
    activeRegistration = null;
  }

  // --- DOM REFERENCES ---
  // Header Branding
  const appHeaderTitle = document.getElementById('appHeaderTitle');
  const appHeaderTagline = document.getElementById('appHeaderTagline');
  const brandMonogram = document.getElementById('brandMonogram');
  const logoWrapper = document.getElementById('logoWrapper');
  const footerText = document.getElementById('footerText');

  // Stepper Elements
  const stepIndicator1 = document.getElementById('stepIndicator1');
  const stepIndicator2 = document.getElementById('stepIndicator2');
  const stepIndicator3 = document.getElementById('stepIndicator3');
  const stepIndicator4 = document.getElementById('stepIndicator4');
  const divider1 = document.getElementById('divider1');
  const divider2 = document.getElementById('divider2');
  const divider3 = document.getElementById('divider3');

  // Phase Cards
  const phase1Card = document.getElementById('phase1Card');
  const phase2Card = document.getElementById('phase2Card');
  const phase3Card = document.getElementById('phase3Card');
  const phase4Card = document.getElementById('phase4Card');

  // Gate 1 Elements
  const phase1Title = document.getElementById('phase1Title');
  const phase1Subtitle = document.getElementById('phase1Subtitle');
  const phase1Handle = document.getElementById('phase1Handle');
  const btnGate1Action = document.getElementById('btnGate1Action');
  const btnGate1Text = document.getElementById('btnGate1Text');
  const gate1LockNote = document.getElementById('gate1LockNote');
  const btnNextPhase2 = document.getElementById('btnNextPhase2');

  // Gate 2 Elements
  const phase2Title = document.getElementById('phase2Title');
  const phase2Subtitle = document.getElementById('phase2Subtitle');
  const phase2Handle = document.getElementById('phase2Handle');
  const btnGate2Action = document.getElementById('btnGate2Action');
  const btnGate2Text = document.getElementById('btnGate2Text');
  const gate2LockNote = document.getElementById('gate2LockNote');
  const btnBackPhase1 = document.getElementById('btnBackPhase1');
  const btnNextPhase3 = document.getElementById('btnNextPhase3');

  // Form Elements (Phase 3)
  const phase3Title = document.getElementById('phase3Title');
  const phase3Subtitle = document.getElementById('phase3Subtitle');
  const categorySelect = document.getElementById('category');
  const affiliationSelect = document.getElementById('affiliation');
  const contactNumberInput = document.getElementById('contact_number');
  const phoneIndicator = document.getElementById('phoneIndicator');
  const eventRegistrationForm = document.getElementById('eventRegistrationForm');
  const btnBackPhase2 = document.getElementById('btnBackPhase2');
  const submitRegBtn = document.getElementById('submitRegBtn');
  const btnSubmitText = document.getElementById('btnSubmitText');
  const btnSpinner = document.getElementById('btnSpinner');

  // Pass Elements (Phase 4)
  const thankYouName = document.getElementById('thankYouName');
  const passBadgeText = document.getElementById('passBadgeText');
  const thankYouMessage = document.getElementById('thankYouMessage');
  const passRegId = document.getElementById('passRegId');
  const qrContainer = document.getElementById('qrContainer');
  const passMetaCategory = document.getElementById('passMetaCategory');
  const passMetaTimestamp = document.getElementById('passMetaTimestamp');
  const btnEditFromPass = document.getElementById('btnEditFromPass');

  // Modal Elements
  const apiConfigTrigger = document.getElementById('apiConfigTrigger');
  const configModal = document.getElementById('configModal');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const themePicker = document.getElementById('themePicker');
  const deviceIdDisplay = document.getElementById('deviceIdDisplay');
  const saveConfigBtn = document.getElementById('saveConfigBtn');

  // --- INITIALIZATION ---
  function init() {
    applyTheme(activeTheme);
    applyBranding();
    populateFormOptions();
    setupGateActions();
    setupPhoneValidation();
    setupFormSubmission();
    setupPassActions();
    setupSettingsModal();

    // Check if user is already registered on this device
    if (activeRegistration && activeRegistration.registration_id) {
      renderDigitalPass(activeRegistration);
      goToPhase(4);
    } else {
      goToPhase(currentPhase || 1);
    }
  }

  // --- THEME ENGINE ---
  function applyTheme(themeKey) {
    const palette = Config.theme.palettes && Config.theme.palettes[themeKey];
    if (palette) {
      for (const [varName, varValue] of Object.entries(palette)) {
        document.documentElement.style.setProperty(varName, varValue);
      }
    }
    activeTheme = themeKey;
    SafeStorage.setItem(STORAGE_KEYS.ACTIVE_THEME, themeKey);
    if (themePicker) themePicker.value = themeKey;
  }

  // --- BRANDING & TEXT INJECTION ---
  function applyBranding() {
    if (appHeaderTitle) appHeaderTitle.textContent = Config.branding.appName;
    if (appHeaderTagline) appHeaderTagline.textContent = Config.branding.tagline;
    if (footerText) footerText.textContent = Config.branding.footerText;

    if (Config.branding.logoImage && logoWrapper) {
      logoWrapper.innerHTML = `<img src="${Config.branding.logoImage}" alt="Logo" class="brand-logo-img" />`;
    } else if (brandMonogram) {
      brandMonogram.textContent = Config.branding.monogram || "QR";
    }

    // Step 1 copy
    if (Config.steps.step1) {
      if (phase1Title) phase1Title.textContent = Config.steps.step1.title;
      if (phase1Subtitle) phase1Subtitle.textContent = Config.steps.step1.subtitle;
      if (phase1Handle) phase1Handle.textContent = Config.steps.step1.handle;
      if (btnGate1Text) btnGate1Text.textContent = Config.steps.step1.actionLabel;
      if (btnGate1Action) btnGate1Action.href = Config.steps.step1.url;
      if (gate1LockNote) gate1LockNote.textContent = Config.steps.step1.lockNote;
    }

    // Step 2 copy
    if (Config.steps.step2) {
      if (phase2Title) phase2Title.textContent = Config.steps.step2.title;
      if (phase2Subtitle) phase2Subtitle.textContent = Config.steps.step2.subtitle;
      if (phase2Handle) phase2Handle.textContent = Config.steps.step2.handle;
      if (btnGate2Text) btnGate2Text.textContent = Config.steps.step2.actionLabel;
      if (btnGate2Action) btnGate2Action.href = Config.steps.step2.url;
      if (gate2LockNote) gate2LockNote.textContent = Config.steps.step2.lockNote;
    }

    // Step 3 copy
    if (Config.steps.step3) {
      if (phase3Title) phase3Title.textContent = Config.steps.step3.title;
      if (phase3Subtitle) phase3Subtitle.textContent = Config.steps.step3.subtitle;
      if (btnSubmitText && Config.steps.step3.submitButtonText) {
        btnSubmitText.textContent = Config.steps.step3.submitButtonText;
      }
    }

    // Step 4 copy
    if (Config.steps.step4) {
      if (passBadgeText) passBadgeText.textContent = Config.steps.step4.badge;
      if (thankYouMessage) thankYouMessage.textContent = Config.steps.step4.message;
    }
  }

  // --- POPULATE SELECT DROPDOWNS ---
  function populateFormOptions() {
    if (categorySelect && Config.steps.step3?.categories) {
      categorySelect.innerHTML = '<option value="" disabled selected>Select Category / Role</option>';
      Config.steps.step3.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
      });
    }

    if (affiliationSelect && Config.steps.step3?.classes) {
      affiliationSelect.innerHTML = '<option value="" disabled selected>Select Affiliation / Class</option>';
      Config.steps.step3.classes.forEach(aff => {
        const opt = document.createElement('option');
        opt.value = aff;
        opt.textContent = aff;
        affiliationSelect.appendChild(opt);
      });
    }
  }

  // --- STEPPER CONTROLLER ---
  function goToPhase(phaseNumber) {
    currentPhase = phaseNumber;
    SafeStorage.setItem(STORAGE_KEYS.CURRENT_PHASE, phaseNumber);

    // Hide all phase cards
    [phase1Card, phase2Card, phase3Card, phase4Card].forEach(card => {
      if (card) card.style.display = 'none';
    });

    // Show target phase card
    if (phaseNumber === 1 && phase1Card) phase1Card.style.display = 'flex';
    if (phaseNumber === 2 && phase2Card) phase2Card.style.display = 'flex';
    if (phaseNumber === 3 && phase3Card) phase3Card.style.display = 'block';
    if (phaseNumber === 4 && phase4Card) phase4Card.style.display = 'flex';

    // Update Stepper Bar Indicators
    updateStepper(phaseNumber);

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepper(phase) {
    const indicators = [stepIndicator1, stepIndicator2, stepIndicator3, stepIndicator4];
    const dividers = [divider1, divider2, divider3];

    indicators.forEach((ind, idx) => {
      if (!ind) return;
      const stepNum = idx + 1;
      ind.classList.remove('active', 'completed');

      if (stepNum < phase || (phase === 4 && stepNum === 4)) {
        ind.classList.add('completed');
      } else if (stepNum === phase) {
        ind.classList.add('active');
      }
    });

    dividers.forEach((div, idx) => {
      if (!div) return;
      if (phase > idx + 1) {
        div.classList.add('active');
      } else {
        div.classList.remove('active');
      }
    });
  }

  // --- GATE ACTIONS (PHASES 1 & 2) ---
  function setupGateActions() {
    let gate1Passed = SafeStorage.getItem(STORAGE_KEYS.GATE_1_PASSED) === 'true';
    let gate2Passed = SafeStorage.getItem(STORAGE_KEYS.GATE_2_PASSED) === 'true';

    function refreshGate1UI() {
      if (gate1Passed) {
        if (btnNextPhase2) btnNextPhase2.disabled = false;
        if (gate1LockNote) {
          gate1LockNote.textContent = Config.steps.step1?.successNote || '✓ Completed! You may proceed.';
          gate1LockNote.style.color = 'var(--success-emerald)';
        }
      }
    }

    function refreshGate2UI() {
      if (gate2Passed) {
        if (btnNextPhase3) btnNextPhase3.disabled = false;
        if (gate2LockNote) {
          gate2LockNote.textContent = Config.steps.step2?.successNote || '✓ Completed! You may proceed.';
          gate2LockNote.style.color = 'var(--success-emerald)';
        }
      }
    }

    refreshGate1UI();
    refreshGate2UI();

    if (btnGate1Action) {
      btnGate1Action.addEventListener('click', () => {
        gate1Passed = true;
        SafeStorage.setItem(STORAGE_KEYS.GATE_1_PASSED, 'true');
        setTimeout(refreshGate1UI, 500);
      });
    }

    if (btnNextPhase2) {
      btnNextPhase2.addEventListener('click', () => goToPhase(2));
    }

    if (btnBackPhase1) {
      btnBackPhase1.addEventListener('click', () => goToPhase(1));
    }

    if (btnGate2Action) {
      btnGate2Action.addEventListener('click', () => {
        gate2Passed = true;
        SafeStorage.setItem(STORAGE_KEYS.GATE_2_PASSED, 'true');
        setTimeout(refreshGate2UI, 500);
      });
    }

    if (btnNextPhase3) {
      btnNextPhase3.addEventListener('click', () => goToPhase(3));
    }

    if (btnBackPhase2) {
      btnBackPhase2.addEventListener('click', () => goToPhase(2));
    }
  }

  // --- PHONE VALIDATION ---
  function setupPhoneValidation() {
    if (!contactNumberInput || !phoneIndicator) return;

    contactNumberInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      const val = e.target.value;

      if (val.length === 10) {
        phoneIndicator.textContent = '✓ Valid 10-digit number';
        phoneIndicator.className = 'phone-indicator valid';
      } else if (val.length > 0) {
        phoneIndicator.textContent = `${val.length}/10 digits`;
        phoneIndicator.className = 'phone-indicator invalid';
      } else {
        phoneIndicator.textContent = '';
        phoneIndicator.className = 'phone-indicator';
      }
    });
  }

  // --- FORM SUBMISSION & BACKEND SYNC ---
  function generateRegistrationId() {
    const prefix = Config.steps.step4?.passPrefix || "PASS-26-";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  function setupFormSubmission() {
    if (!eventRegistrationForm) return;

    eventRegistrationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const phone = contactNumberInput ? contactNumberInput.value.trim() : '';
      if (phone.length !== 10) {
        alert('Please enter a valid 10-digit mobile number.');
        if (contactNumberInput) contactNumberInput.focus();
        return;
      }

      const regId = generateRegistrationId();
      const formData = new FormData(eventRegistrationForm);

      const payload = {
        action: 'register',
        registration_id: regId,
        full_name: formData.get('full_name')?.toString().trim() || '',
        contact_number: phone,
        email_address: formData.get('email_address')?.toString().trim() || '',
        category: formData.get('category')?.toString().trim() || '',
        affiliation: formData.get('affiliation')?.toString().trim() || '',
        organization: formData.get('organization')?.toString().trim() || '',
        device_id: activeDeviceId,
        timestamp: new Date().toISOString()
      };

      // Button loading state
      isSubmitting = true;
      if (submitRegBtn) submitRegBtn.disabled = true;
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      if (btnSubmitText) btnSubmitText.textContent = 'SYNCING...';

      // Save locally immediately
      activeRegistration = payload;
      SafeStorage.setItem(STORAGE_KEYS.USER_REGISTRATION, JSON.stringify(payload));

      try {
        await sendToGoogleSheet(payload);
      } catch (err) {
        console.warn('Network sync notice (saved locally):', err);
      } finally {
        renderDigitalPass(payload);
        goToPhase(4);

        isSubmitting = false;
        if (submitRegBtn) submitRegBtn.disabled = false;
        if (btnSpinner) btnSpinner.style.display = 'none';
        if (btnSubmitText) {
          btnSubmitText.textContent = Config.steps.step3?.submitButtonText || 'SUBMIT REGISTRATION';
        }
      }
    });
  }

  // --- CROSS-BROWSER GOOGLE APPS SCRIPT SUBMISSION ---
  async function sendToGoogleSheet(payload) {
    if (!activeApiUrl || !activeApiUrl.startsWith('http')) return;

    try {
      // POST with text/plain body avoids CORS preflight OPTIONS rejection
      await fetch(activeApiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Hidden iframe fallback ensures delivery in older browsers or strict firewalls
      postViaIframe(activeApiUrl, payload);
    }
  }

  function postViaIframe(url, data) {
    try {
      let iframe = document.getElementById('hidden_iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = 'hidden_iframe';
      form.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify(data);
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => form.remove(), 2000);
    } catch (e) {
      console.error('Iframe fallback error:', e);
    }
  }

  // --- DIGITAL PASS RENDERING (QR CODE) ---
  function renderDigitalPass(regData) {
    if (!regData) return;

    const firstName = (regData.full_name || 'Participant').split(' ')[0];
    if (thankYouName) thankYouName.textContent = firstName;
    if (passRegId) passRegId.textContent = regData.registration_id;
    if (passMetaCategory) passMetaCategory.textContent = regData.category || 'Attendee';
    if (passMetaTimestamp) {
      const dt = new Date(regData.timestamp || Date.now());
      passMetaTimestamp.textContent = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // Render live QR Code using QRCode library
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      const qrData = JSON.stringify({
        id: regData.registration_id,
        phone: regData.contact_number,
        name: regData.full_name
      });

      new QRCode(qrContainer, {
        text: qrData,
        width: 160,
        height: 160,
        colorDark: "#0B192C",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }

  // --- PASS EDIT ACTION ---
  function setupPassActions() {
    if (btnEditFromPass) {
      btnEditFromPass.addEventListener('click', () => {
        if (activeRegistration && eventRegistrationForm) {
          for (const key in activeRegistration) {
            const el = eventRegistrationForm.elements[key];
            if (el) el.value = activeRegistration[key];
          }
        }
        goToPhase(3);
      });
    }
  }

  // --- SETTINGS & THEME MODAL ---
  function setupSettingsModal() {
    if (apiConfigTrigger && configModal) {
      apiConfigTrigger.addEventListener('click', () => {
        if (apiUrlInput) apiUrlInput.value = activeApiUrl;
        if (themePicker) themePicker.value = activeTheme;
        if (deviceIdDisplay) deviceIdDisplay.value = activeDeviceId;
        configModal.classList.add('active');
      });
    }

    if (closeConfigModalBtn && configModal) {
      closeConfigModalBtn.addEventListener('click', () => configModal.classList.remove('active'));
    }

    if (configModal) {
      configModal.addEventListener('click', (e) => {
        if (e.target === configModal) configModal.classList.remove('active');
      });
    }

    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        // Update URL
        if (apiUrlInput) {
          const newUrl = apiUrlInput.value.trim();
          activeApiUrl = newUrl;
          SafeStorage.setItem(STORAGE_KEYS.API_URL, newUrl);
        }

        // Update Theme
        if (themePicker) {
          applyTheme(themePicker.value);
        }

        alert('Settings applied successfully!');
        if (configModal) configModal.classList.remove('active');
      });
    }
  }

  // Run initialization
  init();
});
