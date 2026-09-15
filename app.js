/**
 * ==============================================================================
 * VISHWAM SPEAKS - EVENT REGISTRATION PORTAL (app.js)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- STORAGE KEYS & CONSTANTS ---
  const STORAGE_KEYS = {
    API_URL: 'vishwam_registration_api_url',
    CURRENT_PHASE: 'vishwam_registration_phase',
    USER_REGISTRATION: 'vishwam_user_registration'
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
    }
  };

  // --- STATE ---
  let activeApiUrl = SafeStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
  let currentPhase = parseInt(SafeStorage.getItem(STORAGE_KEYS.CURRENT_PHASE) || '1', 10);

  // --- DOM REFERENCES ---
  const stepIndicator1 = document.getElementById('stepIndicator1');
  const stepIndicator2 = document.getElementById('stepIndicator2');
  const stepIndicator3 = document.getElementById('stepIndicator3');
  const divider1 = document.getElementById('divider1');
  const divider2 = document.getElementById('divider2');

  const phase1Card = document.getElementById('phase1Card');
  const phase2Card = document.getElementById('phase2Card');
  const phase3Card = document.getElementById('phase3Card');
  const statusSuccessCard = document.getElementById('statusSuccessCard');

  const btnNextPhase2 = document.getElementById('btnNextPhase2');
  const btnNextPhase3 = document.getElementById('btnNextPhase3');
  const btnBackPhase1 = document.getElementById('btnBackPhase1');
  const btnBackPhase2 = document.getElementById('btnBackPhase2');

  const eventRegistrationForm = document.getElementById('eventRegistrationForm');
  const submitRegBtn = document.getElementById('submitRegBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');
  const btnRegisterNew = document.getElementById('btnRegisterNew');

  // Track cards & segment boxes
  const trackCardCouncil = document.getElementById('trackCardCouncil');
  const trackCardArt = document.getElementById('trackCardArt');
  const trackCardWorkshop = document.getElementById('trackCardWorkshop');
  const segmentCouncil = document.getElementById('segmentCouncil');
  const segmentArt = document.getElementById('segmentArt');
  const segmentWorkshop = document.getElementById('segmentWorkshop');

  // Modal
  const apiConfigTrigger = document.getElementById('apiConfigTrigger');
  const configModal = document.getElementById('configModal');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const saveApiUrlBtn = document.getElementById('saveApiUrlBtn');

  // --- INITIALIZATION ---
  init();

  function init() {
    if (apiUrlInput) apiUrlInput.value = activeApiUrl;
    
    setupTrackSelectors();
    setupPhaseNavigation();
    setupFormSubmission();
    setupModal();
    
    // Set initial phase screen
    setPhase(currentPhase);
  }

  // --- PHASE STEPPER NAVIGATION ENGINE ---
  function setPhase(phaseNum) {
    if (phaseNum < 1) phaseNum = 1;
    if (phaseNum > 3) phaseNum = 3;
    
    currentPhase = phaseNum;
    SafeStorage.setItem(STORAGE_KEYS.CURRENT_PHASE, phaseNum);

    // Hide all phase cards & status card
    phase1Card.style.display = 'none';
    phase2Card.style.display = 'none';
    phase3Card.style.display = 'none';
    statusSuccessCard.style.display = 'none';

    // Update Stepper Bar Indicators
    updateStepperUI(phaseNum);

    // Show target phase card
    if (phaseNum === 1) {
      phase1Card.style.display = 'block';
    } else if (phaseNum === 2) {
      phase2Card.style.display = 'block';
    } else if (phaseNum === 3) {
      phase3Card.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepperUI(phaseNum) {
    // Phase 1
    stepIndicator1.classList.remove('active', 'completed');
    if (phaseNum === 1) {
      stepIndicator1.classList.add('active');
    } else if (phaseNum > 1) {
      stepIndicator1.classList.add('completed');
    }

    // Divider 1
    if (divider1) {
      if (phaseNum > 1) divider1.classList.add('completed');
      else divider1.classList.remove('completed');
    }

    // Phase 2
    stepIndicator2.classList.remove('active', 'completed');
    if (phaseNum === 2) {
      stepIndicator2.classList.add('active');
    } else if (phaseNum > 2) {
      stepIndicator2.classList.add('completed');
    } else if (phaseNum < 2) {
      stepIndicator2.classList.remove('active', 'completed');
    }

    // Divider 2
    if (divider2) {
      if (phaseNum > 2) divider2.classList.add('completed');
      else divider2.classList.remove('completed');
    }

    // Phase 3
    stepIndicator3.classList.remove('active', 'completed');
    if (phaseNum === 3) {
      stepIndicator3.classList.add('active');
    }
  }

  function setupPhaseNavigation() {
    if (btnNextPhase2) {
      btnNextPhase2.addEventListener('click', () => setPhase(2));
    }
    if (btnNextPhase3) {
      btnNextPhase3.addEventListener('click', () => setPhase(3));
    }
    if (btnBackPhase1) {
      btnBackPhase1.addEventListener('click', () => setPhase(1));
    }
    if (btnBackPhase2) {
      btnBackPhase2.addEventListener('click', () => setPhase(2));
    }

    // Allow clicking on completed stepper items to jump back
    if (stepIndicator1) {
      stepIndicator1.addEventListener('click', () => setPhase(1));
    }
    if (stepIndicator2) {
      stepIndicator2.addEventListener('click', () => {
        if (currentPhase >= 2) setPhase(2);
      });
    }
    if (stepIndicator3) {
      stepIndicator3.addEventListener('click', () => {
        if (currentPhase >= 3) setPhase(3);
      });
    }
  }

  // --- DYNAMIC TRACK SEGMENTATION ENGINE ---
  function setupTrackSelectors() {
    const trackRadios = document.querySelectorAll('input[name="participation_type"]');

    trackRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        updateTrackSegments(selectedValue);
      });
    });

    // Also support clicking directly on track cards
    [trackCardCouncil, trackCardArt, trackCardWorkshop].forEach(card => {
      if (card) {
        card.addEventListener('click', () => {
          const radio = card.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            updateTrackSegments(radio.value);
          }
        });
      }
    });
  }

  function updateTrackSegments(trackValue) {
    // Remove active styles from all track cards
    [trackCardCouncil, trackCardArt, trackCardWorkshop].forEach(card => {
      if (card) card.classList.remove('active');
    });

    // Hide all dynamic segment boxes
    segmentCouncil.style.display = 'none';
    segmentArt.style.display = 'none';
    segmentWorkshop.style.display = 'none';

    if (trackValue === 'Council') {
      if (trackCardCouncil) trackCardCouncil.classList.add('active');
      segmentCouncil.style.display = 'block';
    } else if (trackValue === 'Art Work') {
      if (trackCardArt) trackCardArt.classList.add('active');
      segmentArt.style.display = 'block';
    } else if (trackValue === 'Workshop') {
      if (trackCardWorkshop) trackCardWorkshop.classList.add('active');
      segmentWorkshop.style.display = 'block';
    }
  }

  // --- FORM SUBMISSION & BACKEND SYNC ---
  function setupFormSubmission() {
    if (eventRegistrationForm) {
      eventRegistrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!activeApiUrl) {
          configModal.classList.add('active');
          alert('Please enter your Google Apps Script Web App URL first!');
          return;
        }

        const formData = new FormData(eventRegistrationForm);
        const payload = {};
        formData.forEach((value, key) => {
          payload[key] = value.trim();
        });

        // Additional track fallbacks if not filled
        payload.action = 'register';
        payload.timestamp = new Date().toISOString();

        if (payload.art_participation_mode && (!payload.participation_mode || payload.participation_type === 'Art Work')) {
          payload.participation_mode = payload.art_participation_mode;
        }

        // Phone number validation
        let phone = (payload.contact_number || '').replace(/[^0-9]/g, '');
        if (phone.length > 10 && (phone.startsWith('91') || phone.startsWith('0'))) {
          phone = phone.slice(-10);
        }
        if (phone.length !== 10) {
          alert('Please enter a valid 10-digit mobile phone number.');
          return;
        }
        payload.contact_number = phone;

        // UTR Validation
        if (!payload.utr_upi_transaction_id) {
          alert('Please enter a valid UTR / UPI Transaction ID.');
          return;
        }

        setLoading(true);

        try {
          await sendToBackend(payload);
          
          // Save local profile
          SafeStorage.setItem(STORAGE_KEYS.USER_REGISTRATION, JSON.stringify(payload));
          
          showSuccessScreen(payload);
        } catch (err) {
          console.warn('Backend submission error:', err);
          fallbackIframeSubmission(payload);
          showSuccessScreen(payload);
        } finally {
          setLoading(false);
        }
      });
    }

    if (btnRegisterNew) {
      btnRegisterNew.addEventListener('click', () => {
        if (eventRegistrationForm) eventRegistrationForm.reset();
        setPhase(1);
      });
    }
  }

  function setLoading(isLoading) {
    if (submitRegBtn) submitRegBtn.disabled = isLoading;
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
  }

  async function sendToBackend(payload) {
    const queryString = new URLSearchParams(payload).toString();
    const requestUrl = `${activeApiUrl}?${queryString}`;

    // Multi-tier resilient dispatch (Image beacon + fetch no-cors + sendBeacon)
    const img = new Image();
    img.src = requestUrl;

    try {
      await fetch(requestUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache'
      });
    } catch (e) {}

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(requestUrl);
      }
    } catch (e) {}
  }

  function fallbackIframeSubmission(payload) {
    const form = document.createElement('form');
    form.action = activeApiUrl;
    form.method = 'GET';
    form.target = 'hidden_iframe';

    for (const key in payload) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = payload[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  function showSuccessScreen(payload) {
    phase1Card.style.display = 'none';
    phase2Card.style.display = 'none';
    phase3Card.style.display = 'none';
    statusSuccessCard.style.display = 'block';

    const summaryBox = document.getElementById('userSummaryBox');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <strong>Participant:</strong> ${payload.full_name || 'Participant'}<br>
        <strong>Email:</strong> ${payload.email_address || '--'}<br>
        <strong>Track:</strong> ${payload.participation_type || 'Council'}<br>
        <strong>UTR Ref:</strong> ${payload.utr_upi_transaction_id || '--'}<br>
        <strong>Status:</strong> Confirmation Pending Verification
      `;
    }

    // Mark stepper complete
    stepIndicator3.classList.add('completed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- API CONFIG MODAL ---
  function setupModal() {
    if (apiConfigTrigger && configModal) {
      apiConfigTrigger.addEventListener('click', () => {
        configModal.classList.add('active');
      });
    }

    if (closeConfigModalBtn && configModal) {
      closeConfigModalBtn.addEventListener('click', () => {
        configModal.classList.remove('active');
      });
    }

    if (saveApiUrlBtn && apiUrlInput) {
      saveApiUrlBtn.addEventListener('click', () => {
        const val = apiUrlInput.value.trim();
        activeApiUrl = val;
        SafeStorage.setItem(STORAGE_KEYS.API_URL, val);
        alert('API Web App URL saved successfully!');
        configModal.classList.remove('active');
      });
    }
  }

});
