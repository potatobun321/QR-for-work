/**
 * ==============================================================================
 * VISHWAM | HAIFA HOUSE REGISTRATION PORTAL (app.js)
 * ==============================================================================
 * Streamlined 4-Phase Architecture:
 * - Phase 1: Instagram Community Connect (@vishwamspeaks)
 * - Phase 2: LinkedIn Community Connect (Vishwam Speaks)
 * - Phase 3: Haifa House Registration Form
 * - Phase 4: Instant Digital Free Entry Pass & Venue Confirmation
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- STORAGE KEYS & CONSTANTS ---
  const STORAGE_KEYS = {
    API_URL: 'vishwam_haifa_api_url',
    CURRENT_PHASE: 'vishwam_haifa_phase',
    USER_REGISTRATION: 'vishwam_haifa_registration',
    FOLLOWED_INSTA: 'vishwam_haifa_followed_insta',
    CONNECTED_LINKEDIN: 'vishwam_haifa_connected_linkedin'
  };

  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzT1iHGKacgQ3EzfuycYp6X4AqknYB0H9UUH_InmSVLMNSWvvfnkQLQHvAzDdr9Kgzw/exec';

  // --- SAFE STORAGE WRAPPER ---
  const memoryStore = {};
  const SafeStorage = {
    getItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        }
      } catch (e) { }
      return memoryStore[key] || null;
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) { }
      memoryStore[key] = String(value);
    },
    removeItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) { }
      delete memoryStore[key];
    }
  };

  // --- APPLICATION STATE ---
  let activeApiUrl = SafeStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
  let currentPhase = parseInt(SafeStorage.getItem(STORAGE_KEYS.CURRENT_PHASE) || '1', 10);
  let activeRegistration = null;
  let isSubmitting = false;

  try {
    const rawReg = SafeStorage.getItem(STORAGE_KEYS.USER_REGISTRATION);
    if (rawReg) activeRegistration = JSON.parse(rawReg);
  } catch (e) {
    activeRegistration = null;
  }

  // --- DOM REFERENCES ---
  // Stepper Indicators
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

  // Phase 1: Instagram
  const btnFollowInstagram = document.getElementById('btnFollowInstagram');
  const btnNextPhase2 = document.getElementById('btnNextPhase2');
  const instaLockNote = document.getElementById('instaLockNote');

  // Phase 2: LinkedIn
  const btnFollowLinkedin = document.getElementById('btnFollowLinkedin');
  const btnBackPhase1 = document.getElementById('btnBackPhase1');
  const btnNextPhase3 = document.getElementById('btnNextPhase3');
  const linkedinLockNote = document.getElementById('linkedinLockNote');

  // Phase 3: Registration Form
  const btnBackPhase2 = document.getElementById('btnBackPhase2');
  const eventRegistrationForm = document.getElementById('eventRegistrationForm');
  const submitRegBtn = document.getElementById('submitRegBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');
  const contactNumberInput = document.getElementById('contact_number');
  const phoneIndicator = document.getElementById('phoneIndicator');

  // Phase 4: Entry Pass Elements
  const passHeaderName = document.getElementById('passHeaderName');
  const passRegId = document.getElementById('passRegId');
  const passName = document.getElementById('passName');
  const passPhone = document.getElementById('passPhone');
  const passCollege = document.getElementById('passCollege');
  const passCity = document.getElementById('passCity');
  const passInstRegId = document.getElementById('passInstRegId');
  const btnCopyPassId = document.getElementById('btnCopyPassId');
  const btnCopyPassIdText = document.getElementById('btnCopyPassIdText');
  const btnEditFromPass = document.getElementById('btnEditFromPass');

  // Settings Modal
  const apiConfigTrigger = document.getElementById('apiConfigTrigger');
  const configModal = document.getElementById('configModal');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const saveConfigBtn = document.getElementById('saveConfigBtn');

  // --- INITIALIZATION ---
  function init() {
    setupSocialVerification();
    setupPhoneValidation();
    setupFormSubmission();
    setupPassActions();
    setupSettingsModal();

    // Check if user already registered previously
    if (activeRegistration && activeRegistration.registration_id) {
      renderEntryPass(activeRegistration);
      goToPhase(4);
    } else {
      goToPhase(currentPhase || 1);
    }
  }

  // --- STEPPER & PHASE CONTROLLER ---
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

    // Update Stepper Bar
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

  // --- SOCIAL VERIFICATION FLOW ---
  function setupSocialVerification() {
    let hasClickedInsta = SafeStorage.getItem(STORAGE_KEYS.FOLLOWED_INSTA) === 'true';
    let hasClickedLinkedin = SafeStorage.getItem(STORAGE_KEYS.CONNECTED_LINKEDIN) === 'true';

    function checkInstaState() {
      if (hasClickedInsta) {
        if (btnNextPhase2) btnNextPhase2.disabled = false;
        if (instaLockNote) {
          instaLockNote.textContent = '✓ Instagram step completed! You may proceed.';
          instaLockNote.style.color = 'var(--success-emerald)';
        }
      }
    }

    function checkLinkedinState() {
      if (hasClickedLinkedin) {
        if (btnNextPhase3) btnNextPhase3.disabled = false;
        if (linkedinLockNote) {
          linkedinLockNote.textContent = '✓ LinkedIn step completed! You may proceed to registration.';
          linkedinLockNote.style.color = 'var(--success-emerald)';
        }
      }
    }

    checkInstaState();
    checkLinkedinState();

    if (btnFollowInstagram) {
      btnFollowInstagram.addEventListener('click', () => {
        hasClickedInsta = true;
        SafeStorage.setItem(STORAGE_KEYS.FOLLOWED_INSTA, 'true');
        setTimeout(checkInstaState, 600);
      });
    }

    if (btnNextPhase2) {
      btnNextPhase2.addEventListener('click', () => {
        goToPhase(2);
      });
    }

    if (btnBackPhase1) {
      btnBackPhase1.addEventListener('click', () => {
        goToPhase(1);
      });
    }

    if (btnFollowLinkedin) {
      btnFollowLinkedin.addEventListener('click', () => {
        hasClickedLinkedin = true;
        SafeStorage.setItem(STORAGE_KEYS.CONNECTED_LINKEDIN, 'true');
        setTimeout(checkLinkedinState, 600);
      });
    }

    if (btnNextPhase3) {
      btnNextPhase3.addEventListener('click', () => {
        goToPhase(3);
      });
    }

    if (btnBackPhase2) {
      btnBackPhase2.addEventListener('click', () => {
        goToPhase(2);
      });
    }
  }

  // --- PHONE VALIDATION ---
  function setupPhoneValidation() {
    if (!contactNumberInput || !phoneIndicator) return;

    contactNumberInput.addEventListener('input', (e) => {
      // Remove any non-numeric characters
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

  // --- FORM SUBMISSION & PASS GENERATION ---
  function generateRegistrationId() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `HAIFA-26-${randomNum}`;
  }

  function setupFormSubmission() {
    if (!eventRegistrationForm) return;

    eventRegistrationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (isSubmitting) return;

      const phone = contactNumberInput ? contactNumberInput.value.trim() : '';
      if (phone.length !== 10) {
        alert('Please enter a valid 10-digit WhatsApp contact number.');
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
        gender: formData.get('gender')?.toString().trim() || '',
        age: formData.get('age')?.toString().trim() || '',
        college_university: formData.get('college_university')?.toString().trim() || '',
        current_college_year_or_class: formData.get('current_college_year_or_class')?.toString().trim() || '',
        city_state: formData.get('city_state')?.toString().trim() || '',
        referral_source: formData.get('referral_source')?.toString().trim() || 'Instagram',
        shakti_referral_code: formData.get('shakti_referral_code')?.toString().trim() || '',
        timestamp: new Date().toISOString()
      };

      // Set Loading State
      isSubmitting = true;
      if (submitRegBtn) submitRegBtn.disabled = true;
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      if (btnText) btnText.textContent = 'GENERATING PASS...';

      // Save locally immediately
      activeRegistration = payload;
      SafeStorage.setItem(STORAGE_KEYS.USER_REGISTRATION, JSON.stringify(payload));

      try {
        // Send data to Google Apps Script
        await sendToGoogleSheet(payload);
      } catch (err) {
        console.warn('Network sync notice (pass saved locally):', err);
      } finally {
        // Render pass and transition to Phase 4
        renderEntryPass(payload);
        goToPhase(4);

        // Reset submit button state
        isSubmitting = false;
        if (submitRegBtn) submitRegBtn.disabled = false;
        if (btnSpinner) btnSpinner.style.display = 'none';
        if (btnText) btnText.textContent = 'CONFIRM & GET FREE ENTRY PASS';
      }
    });
  }

  // --- GOOGLE APPS SCRIPT SUBMISSION ---
  async function sendToGoogleSheet(payload) {
    if (!activeApiUrl || !activeApiUrl.startsWith('http')) {
      return;
    }

    try {
      // POST with text/plain body to avoid CORS preflight triggers
      await fetch(activeApiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Fallback: form POST via hidden iframe
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
      console.error('Iframe submission fallback error:', e);
    }
  }

  // --- DIGITAL ENTRY PASS RENDERING ---
  function renderEntryPass(regData) {
    if (!regData) return;

    const firstName = (regData.full_name || 'Delegate').split(' ')[0];
    if (passHeaderName) passHeaderName.textContent = firstName;
    if (passRegId) passRegId.textContent = regData.registration_id || 'HAIFA-26-0000';
    if (passInstRegId) passInstRegId.textContent = regData.registration_id || 'HAIFA-26-0000';

    if (passName) passName.textContent = regData.full_name || '--';
    if (passPhone) passPhone.textContent = regData.contact_number || '--';
    if (passCollege) passCollege.textContent = regData.college_university || '--';
    if (passCity) passCity.textContent = regData.city_state || '--';
  }

  // --- PASS ACTIONS ---
  function setupPassActions() {
    if (btnCopyPassId && passRegId) {
      btnCopyPassId.addEventListener('click', () => {
        const idText = passRegId.textContent.trim();
        navigator.clipboard.writeText(idText).then(() => {
          if (btnCopyPassIdText) btnCopyPassIdText.textContent = 'COPIED!';
          setTimeout(() => {
            if (btnCopyPassIdText) btnCopyPassIdText.textContent = 'COPY ID';
          }, 2000);
        }).catch(() => {
          // Fallback
          const temp = document.createElement('textarea');
          temp.value = idText;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          if (btnCopyPassIdText) btnCopyPassIdText.textContent = 'COPIED!';
          setTimeout(() => {
            if (btnCopyPassIdText) btnCopyPassIdText.textContent = 'COPY ID';
          }, 2000);
        });
      });
    }

    if (btnEditFromPass) {
      btnEditFromPass.addEventListener('click', () => {
        // Pre-fill form if registration exists
        if (activeRegistration && eventRegistrationForm) {
          for (const key in activeRegistration) {
            const input = eventRegistrationForm.elements[key];
            if (input) input.value = activeRegistration[key];
          }
        }
        goToPhase(3);
      });
    }
  }

  // --- CONFIG / SETTINGS MODAL ---
  function setupSettingsModal() {
    if (apiConfigTrigger && configModal) {
      apiConfigTrigger.addEventListener('click', () => {
        if (apiUrlInput) apiUrlInput.value = activeApiUrl;
        configModal.classList.add('active');
      });
    }

    if (closeConfigModalBtn && configModal) {
      closeConfigModalBtn.addEventListener('click', () => {
        configModal.classList.remove('active');
      });
    }

    if (configModal) {
      configModal.addEventListener('click', (e) => {
        if (e.target === configModal) configModal.classList.remove('active');
      });
    }

    if (saveConfigBtn && apiUrlInput) {
      saveConfigBtn.addEventListener('click', () => {
        const newUrl = apiUrlInput.value.trim();
        if (newUrl) {
          activeApiUrl = newUrl;
          SafeStorage.setItem(STORAGE_KEYS.API_URL, newUrl);
          alert('Settings updated successfully!');
          if (configModal) configModal.classList.remove('active');
        }
      });
    }
  }

  // Start the application
  init();
});
