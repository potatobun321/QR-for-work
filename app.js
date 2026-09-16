/**
 * ==============================================================================
 * VISHWAM SPEAKS - EVENT REGISTRATION PORTAL (app.js)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- STORAGE KEYS & CONSTANTS ---
  const STORAGE_KEYS = {
    API_URL: 'vishwam_registration_api_url',
    UPI_ID: 'vishwam_registration_upi_id',
    CURRENT_PHASE: 'vishwam_registration_phase',
    USER_REGISTRATION: 'vishwam_user_registration',
    FOLLOWED_INSTA: 'vishwam_followed_insta',
    CONNECTED_LINKEDIN: 'vishwam_connected_linkedin'
  };

  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzT1iHGKacgQ3EzfuycYp6X4AqknYB0H9UUH_InmSVLMNSWvvfnkQLQHvAzDdr9Kgzw/exec';
  const DEFAULT_UPI_ID = '9928767135@upi';
  const REGISTRATION_FEE = '2500';

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

  // --- STATE ---
  let activeApiUrl = SafeStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
  let activeUpiId = SafeStorage.getItem(STORAGE_KEYS.UPI_ID) || DEFAULT_UPI_ID;
  let currentPhase = parseInt(SafeStorage.getItem(STORAGE_KEYS.CURRENT_PHASE) || '1', 10);
  let activeRegistration = null;

  try {
    const rawReg = SafeStorage.getItem(STORAGE_KEYS.USER_REGISTRATION);
    if (rawReg) activeRegistration = JSON.parse(rawReg);
  } catch (e) {}

  // Selected file state for optional ID upload
  let selectedIdFile = {
    base64: null,
    name: null,
    type: null
  };

  // --- DOM REFERENCES ---
  const stepIndicator1 = document.getElementById('stepIndicator1');
  const stepIndicator2 = document.getElementById('stepIndicator2');
  const stepIndicator3 = document.getElementById('stepIndicator3');
  const stepIndicator4 = document.getElementById('stepIndicator4');
  const divider1 = document.getElementById('divider1');
  const divider2 = document.getElementById('divider2');
  const divider3 = document.getElementById('divider3');

  const phase1Card = document.getElementById('phase1Card');
  const phase2Card = document.getElementById('phase2Card');
  const phase3Card = document.getElementById('phase3Card');
  const phase4Card = document.getElementById('phase4Card');

  // Social Redirection & Gating
  const btnFollowInstagram = document.getElementById('btnFollowInstagram');
  const btnNextPhase2 = document.getElementById('btnNextPhase2');
  const instaLockNote = document.getElementById('instaLockNote');

  const btnFollowLinkedin = document.getElementById('btnFollowLinkedin');
  const btnNextPhase3 = document.getElementById('btnNextPhase3');
  const linkedinLockNote = document.getElementById('linkedinLockNote');

  const btnBackPhase1 = document.getElementById('btnBackPhase1');
  const btnBackPhase2 = document.getElementById('btnBackPhase2');

  // Registration Form
  const eventRegistrationForm = document.getElementById('eventRegistrationForm');
  const submitRegBtn = document.getElementById('submitRegBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');

  // Track cards & segment boxes
  const trackCardCouncil = document.getElementById('trackCardCouncil');
  const trackCardArt = document.getElementById('trackCardArt');
  const trackCardWorkshop = document.getElementById('trackCardWorkshop');
  const segmentCouncil = document.getElementById('segmentCouncil');
  const segmentArt = document.getElementById('segmentArt');
  const segmentWorkshop = document.getElementById('segmentWorkshop');

  // Optional ID File Picker Elements
  const fileDropzone = document.getElementById('fileDropzone');
  const idFileUpload = document.getElementById('id_file_upload');
  const dropzoneIdle = document.getElementById('dropzoneIdle');
  const fileSelectedBar = document.getElementById('fileSelectedBar');
  const fileSelectedName = document.getElementById('fileSelectedName');
  const filePreviewThumb = document.getElementById('filePreviewThumb');
  const btnClearFile = document.getElementById('btnClearFile');
  const idDocumentInput = document.getElementById('id_document');

  // Phase 4 Elements
  const phase4RegId = document.getElementById('phase4RegId');
  const btnCopyRegId = document.getElementById('btnCopyRegId');
  const btnCopyRegIdText = document.getElementById('btnCopyRegIdText');
  const phase4Name = document.getElementById('phase4Name');
  const phase4Phone = document.getElementById('phase4Phone');
  const phase4Track = document.getElementById('phase4Track');
  const btnUpiDeepLink = document.getElementById('btnUpiDeepLink');
  const dynamicQrContainer = document.getElementById('dynamicQrContainer');
  const displayUpiId = document.getElementById('displayUpiId');
  const btnCopyUpiId = document.getElementById('btnCopyUpiId');
  const btnCopyUpiIdText = document.getElementById('btnCopyUpiIdText');
  const btnQuickEditUpi = document.getElementById('btnQuickEditUpi');
  const instRegId = document.getElementById('instRegId');
  const phase4UtrInput = document.getElementById('phase4UtrInput');
  const btnSaveUtr = document.getElementById('btnSaveUtr');
  const btnSaveUtrText = document.getElementById('btnSaveUtrText');
  const utrUpdateStatus = document.getElementById('utrUpdateStatus');
  const btnRegisterNew = document.getElementById('btnRegisterNew');

  // Modal
  const apiConfigTrigger = document.getElementById('apiConfigTrigger');
  const configModal = document.getElementById('configModal');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const upiIdInput = document.getElementById('upiIdInput');
  const saveConfigBtn = document.getElementById('saveConfigBtn');

  // --- INITIALIZATION ---
  init();

  function init() {
    if (apiUrlInput) apiUrlInput.value = activeApiUrl;
    if (upiIdInput) upiIdInput.value = activeUpiId;
    
    setupSocialLocking();
    setupTrackSelectors();
    setupFileUpload();
    setupPhoneValidator();
    setupPhaseNavigation();
    setupFormSubmission();
    setupPhase4Interactions();
    setupModal();

    // If an active registration exists and current phase is 4, restore payment screen
    if (currentPhase === 4 && activeRegistration) {
      renderPaymentScreen(activeRegistration);
      setPhase(4);
    } else {
      if (currentPhase > 3) currentPhase = 3;
      setPhase(currentPhase);
    }
  }

  // --- SOCIAL GATING & LOCK/UNLOCK ENGINE ---
  function setupSocialLocking() {
    const hasFollowedInsta = SafeStorage.getItem(STORAGE_KEYS.FOLLOWED_INSTA) === 'true';
    const hasConnectedLinkedin = SafeStorage.getItem(STORAGE_KEYS.CONNECTED_LINKEDIN) === 'true';

    // Phase 1 Instagram state
    if (hasFollowedInsta && btnNextPhase2) {
      btnNextPhase2.disabled = false;
      btnNextPhase2.classList.remove('btn-locked');
      if (instaLockNote) {
        instaLockNote.textContent = 'Instagram link opened. Click below to continue.';
        instaLockNote.style.color = '#10B981';
      }
    } else if (btnNextPhase2) {
      btnNextPhase2.disabled = true;
      btnNextPhase2.classList.add('btn-locked');
    }

    if (btnFollowInstagram) {
      btnFollowInstagram.addEventListener('click', () => {
        SafeStorage.setItem(STORAGE_KEYS.FOLLOWED_INSTA, 'true');
        if (btnNextPhase2) {
          btnNextPhase2.disabled = false;
          btnNextPhase2.classList.remove('btn-locked');
        }
        if (instaLockNote) {
          instaLockNote.textContent = 'Instagram link opened. Click below to continue to LinkedIn.';
          instaLockNote.style.color = '#10B981';
        }
      });
    }

    // Phase 2 LinkedIn state
    if (hasConnectedLinkedin && btnNextPhase3) {
      btnNextPhase3.disabled = false;
      btnNextPhase3.classList.remove('btn-locked');
      if (linkedinLockNote) {
        linkedinLockNote.textContent = 'LinkedIn link opened. Click below to continue to registration.';
        linkedinLockNote.style.color = '#10B981';
      }
    } else if (btnNextPhase3) {
      btnNextPhase3.disabled = true;
      btnNextPhase3.classList.add('btn-locked');
    }

    if (btnFollowLinkedin) {
      btnFollowLinkedin.addEventListener('click', () => {
        SafeStorage.setItem(STORAGE_KEYS.CONNECTED_LINKEDIN, 'true');
        if (btnNextPhase3) {
          btnNextPhase3.disabled = false;
          btnNextPhase3.classList.remove('btn-locked');
        }
        if (linkedinLockNote) {
          linkedinLockNote.textContent = 'LinkedIn link opened. Click below to continue to registration.';
          linkedinLockNote.style.color = '#10B981';
        }
      });
    }
  }

  // --- OPTIONAL ID GALLERY / FILE DROPZONE ENGINE ---
  function setupFileUpload() {
    if (!fileDropzone || !idFileUpload) return;

    fileDropzone.addEventListener('click', (e) => {
      if (btnClearFile && (e.target === btnClearFile || btnClearFile.contains(e.target))) return;
      idFileUpload.click();
    });

    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.classList.add('dragover');
    });

    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.classList.remove('dragover');
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    });

    idFileUpload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);
      }
    });

    if (btnClearFile) {
      btnClearFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFile();
      });
    }
  }

  function processFile(file) {
    if (!file) return;

    // Max 5MB file size
    if (file.size > 5 * 1024 * 1024) {
      alert('File is larger than 5MB. Please choose a smaller image or paste a cloud link.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      selectedIdFile = {
        base64: event.target.result,
        name: file.name,
        type: file.type || 'image/jpeg'
      };

      if (dropzoneIdle) dropzoneIdle.style.display = 'none';
      if (fileSelectedBar) fileSelectedBar.style.display = 'flex';
      if (fileSelectedName) fileSelectedName.textContent = file.name;

      if (filePreviewThumb) {
        if (file.type && file.type.startsWith('image/')) {
          filePreviewThumb.src = event.target.result;
          filePreviewThumb.style.display = 'block';
        } else {
          filePreviewThumb.src = '';
          filePreviewThumb.style.display = 'none';
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function resetFile() {
    selectedIdFile = { base64: null, name: null, type: null };
    if (idFileUpload) idFileUpload.value = '';
    if (dropzoneIdle) dropzoneIdle.style.display = 'flex';
    if (fileSelectedBar) fileSelectedBar.style.display = 'none';
    if (fileSelectedName) fileSelectedName.textContent = '';
    if (filePreviewThumb) {
      filePreviewThumb.src = '';
      filePreviewThumb.style.display = 'none';
    }
  }

  // --- PHASE STEPPER NAVIGATION ENGINE ---
  function setPhase(phaseNum) {
    if (phaseNum < 1) phaseNum = 1;
    if (phaseNum > 4) phaseNum = 4;
    
    currentPhase = phaseNum;
    SafeStorage.setItem(STORAGE_KEYS.CURRENT_PHASE, phaseNum);

    // Hide all phase cards
    if (phase1Card) phase1Card.style.display = 'none';
    if (phase2Card) phase2Card.style.display = 'none';
    if (phase3Card) phase3Card.style.display = 'none';
    if (phase4Card) phase4Card.style.display = 'none';

    // Update Stepper Bar Indicators
    updateStepperUI(phaseNum);

    // Show target phase card
    if (phaseNum === 1 && phase1Card) {
      phase1Card.style.display = 'block';
    } else if (phaseNum === 2 && phase2Card) {
      phase2Card.style.display = 'block';
    } else if (phaseNum === 3 && phase3Card) {
      phase3Card.style.display = 'block';
    } else if (phaseNum === 4 && phase4Card) {
      phase4Card.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepperUI(phaseNum) {
    if (stepIndicator1) {
      stepIndicator1.classList.remove('active', 'completed');
      if (phaseNum === 1) stepIndicator1.classList.add('active');
      else if (phaseNum > 1) stepIndicator1.classList.add('completed');
    }

    if (divider1) {
      if (phaseNum > 1) divider1.classList.add('completed');
      else divider1.classList.remove('completed');
    }

    if (stepIndicator2) {
      stepIndicator2.classList.remove('active', 'completed');
      if (phaseNum === 2) stepIndicator2.classList.add('active');
      else if (phaseNum > 2) stepIndicator2.classList.add('completed');
    }

    if (divider2) {
      if (phaseNum > 2) divider2.classList.add('completed');
      else divider2.classList.remove('completed');
    }

    if (stepIndicator3) {
      stepIndicator3.classList.remove('active', 'completed');
      if (phaseNum === 3) stepIndicator3.classList.add('active');
      else if (phaseNum > 3) stepIndicator3.classList.add('completed');
    }

    if (divider3) {
      if (phaseNum > 3) divider3.classList.add('completed');
      else divider3.classList.remove('completed');
    }

    if (stepIndicator4) {
      stepIndicator4.classList.remove('active', 'completed');
      if (phaseNum === 4) stepIndicator4.classList.add('active');
    }
  }

  function setupPhaseNavigation() {
    if (btnNextPhase2) {
      btnNextPhase2.addEventListener('click', () => {
        if (!btnNextPhase2.disabled) setPhase(2);
      });
    }
    if (btnNextPhase3) {
      btnNextPhase3.addEventListener('click', () => {
        if (!btnNextPhase3.disabled) setPhase(3);
      });
    }
    if (btnBackPhase1) {
      btnBackPhase1.addEventListener('click', () => setPhase(1));
    }
    if (btnBackPhase2) {
      btnBackPhase2.addEventListener('click', () => setPhase(2));
    }

    if (stepIndicator1) {
      stepIndicator1.addEventListener('click', () => setPhase(1));
    }
    if (stepIndicator2) {
      stepIndicator2.addEventListener('click', () => {
        if (SafeStorage.getItem(STORAGE_KEYS.FOLLOWED_INSTA) === 'true') setPhase(2);
      });
    }
    if (stepIndicator3) {
      stepIndicator3.addEventListener('click', () => {
        if (SafeStorage.getItem(STORAGE_KEYS.CONNECTED_LINKEDIN) === 'true') setPhase(3);
      });
    }
    if (stepIndicator4) {
      stepIndicator4.addEventListener('click', () => {
        if (currentPhase === 4 || activeRegistration) setPhase(4);
      });
    }
  }

  // --- DYNAMIC TRACK SELECTORS ---
  function setupTrackSelectors() {
    const trackRadios = document.querySelectorAll('input[name="participation_type"]');

    trackRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateTrackSegments(e.target.value);
      });
    });

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
    [trackCardCouncil, trackCardArt, trackCardWorkshop].forEach(card => {
      if (card) card.classList.remove('active');
    });

    if (segmentCouncil) segmentCouncil.style.display = 'none';
    if (segmentArt) segmentArt.style.display = 'none';
    if (segmentWorkshop) segmentWorkshop.style.display = 'none';

    if (trackValue === 'Council') {
      if (trackCardCouncil) trackCardCouncil.classList.add('active');
      if (segmentCouncil) segmentCouncil.style.display = 'block';
    } else if (trackValue === 'Art Work') {
      if (trackCardArt) trackCardArt.classList.add('active');
      if (segmentArt) segmentArt.style.display = 'block';
    } else if (trackValue === 'Workshop') {
      if (trackCardWorkshop) trackCardWorkshop.classList.add('active');
      if (segmentWorkshop) segmentWorkshop.style.display = 'block';
    }
  }

  // --- REGISTRATION ID GENERATOR ---
  function generateRegistrationId() {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `JAI-26-${randNum}`;
  }

  // --- FORM SUBMISSION & BACKEND SYNC ---
  function setupFormSubmission() {
    if (eventRegistrationForm) {
      eventRegistrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(eventRegistrationForm);
        const payload = {};
        formData.forEach((value, key) => {
          payload[key] = value.trim();
        });

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

        // Track-specific fields fallback
        if (payload.art_specifications && (!payload.participation_mode || payload.participation_type === 'Art Work')) {
          payload.participation_mode = payload.art_specifications;
        }

        // Attach optional gallery file upload if selected
        if (selectedIdFile && selectedIdFile.base64) {
          payload.id_file_base64 = selectedIdFile.base64;
          payload.id_file_name = selectedIdFile.name;
          payload.id_file_type = selectedIdFile.type;
        }

        // Generate Registration ID
        const regId = generateRegistrationId();
        payload.registration_id = regId;
        payload.registration_fee = 'INR 2,500';
        payload.payment_confirmation = 'Pending';
        payload.action = 'register';
        payload.timestamp = new Date().toISOString();

        setLoading(true);

        try {
          if (activeApiUrl) {
            await sendToBackend(payload);
          }
        } catch (err) {
          console.warn('Background sync note:', err);
          if (activeApiUrl) fallbackIframeSubmission(payload);
        } finally {
          setLoading(false);
        }

        // Save local active registration
        activeRegistration = payload;
        SafeStorage.setItem(STORAGE_KEYS.USER_REGISTRATION, JSON.stringify(payload));

        // Render Phase 4 Payment & Verification UI
        renderPaymentScreen(payload);
        setPhase(4);
      });
    }
  }

  function setLoading(isLoading) {
    if (submitRegBtn) submitRegBtn.disabled = isLoading;
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
    if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
  }

  async function sendToBackend(payload) {
    // If payload contains base64 file, send via POST JSON to avoid URL length limits
    if (payload.id_file_base64) {
      try {
        await fetch(activeApiUrl, {
          method: 'POST',
          mode: 'no-cors',
          cache: 'no-cache',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return;
      } catch (e) {}
    }

    const queryString = new URLSearchParams(payload).toString();
    const requestUrl = `${activeApiUrl}?${queryString}`;

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
      if (key !== 'id_file_base64') { // Don't overflow iframe GET query
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payload[key];
        form.appendChild(input);
      }
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  // --- PHASE 4: RENDER PAYMENT & DESK VERIFICATION SCREEN ---
  function renderPaymentScreen(payload) {
    const regId = payload.registration_id || 'JAI-26-0000';

    if (phase4RegId) phase4RegId.textContent = regId;
    if (instRegId) instRegId.textContent = regId;
    if (phase4Name) phase4Name.textContent = payload.full_name || '--';
    if (phase4Phone) phase4Phone.textContent = payload.contact_number || '--';
    if (phase4Track) phase4Track.textContent = payload.participation_type || 'Council';

    if (displayUpiId) displayUpiId.textContent = activeUpiId;

    // Construct clean UPI Deep Link
    // Format: upi://pay?pa=VPA&pn=NAME&am=2500&cu=INR&tn=REG_ID
    const cleanUpi = activeUpiId.trim();
    const cleanPn = 'VISHWAM';
    const upiUri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanPn)}&am=${encodeURIComponent(REGISTRATION_FEE)}&cu=INR&tn=${encodeURIComponent(regId)}`;

    if (btnUpiDeepLink) {
      btnUpiDeepLink.href = upiUri;
    }

    // Render Dynamic QR Code
    if (dynamicQrContainer) {
      dynamicQrContainer.innerHTML = '';
      try {
        if (typeof QRCode !== 'undefined') {
          new QRCode(dynamicQrContainer, {
            text: upiUri,
            width: 190,
            height: 190,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        } else {
          const fallbackQr = document.createElement('img');
          fallbackQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${encodeURIComponent(upiUri)}`;
          fallbackQr.alt = 'UPI QR Code';
          fallbackQr.style.width = '190px';
          fallbackQr.style.height = '190px';
          dynamicQrContainer.appendChild(fallbackQr);
        }
      } catch (qrErr) {
        console.warn('QR render note:', qrErr);
      }
    }
  }

  // --- PHASE 4 INTERACTIVE CONTROLS ---
  function setupPhase4Interactions() {
    // Copy Registration ID
    if (btnCopyRegId) {
      btnCopyRegId.addEventListener('click', () => {
        const textToCopy = phase4RegId ? phase4RegId.textContent : '';
        copyToClipboard(textToCopy, btnCopyRegIdText, 'COPIED!', 'COPY ID');
      });
    }

    // Copy UPI ID
    if (btnCopyUpiId) {
      btnCopyUpiId.addEventListener('click', () => {
        const textToCopy = activeUpiId;
        copyToClipboard(textToCopy, btnCopyUpiIdText, 'COPIED!', 'COPY');
      });
    }

    // Quick Edit UPI Button
    if (btnQuickEditUpi && configModal && upiIdInput) {
      btnQuickEditUpi.addEventListener('click', () => {
        upiIdInput.value = activeUpiId;
        configModal.classList.add('active');
        setTimeout(() => upiIdInput.focus(), 150);
      });
    }

    // Save Optional UTR Reference
    if (btnSaveUtr && phase4UtrInput) {
      btnSaveUtr.addEventListener('click', async () => {
        const utrVal = phase4UtrInput.value.trim();
        if (!utrVal) {
          if (utrUpdateStatus) {
            utrUpdateStatus.style.color = '#FFA01A';
            utrUpdateStatus.textContent = 'Please enter your 12-digit UTR number.';
          }
          return;
        }

        if (btnSaveUtrText) btnSaveUtrText.textContent = 'SAVING...';
        btnSaveUtr.disabled = true;

        const updatePayload = {
          action: 'update_utr',
          registration_id: activeRegistration ? activeRegistration.registration_id : '',
          contact_number: activeRegistration ? activeRegistration.contact_number : '',
          utr_upi_transaction_id: utrVal
        };

        try {
          if (activeApiUrl) await sendToBackend(updatePayload);
          if (activeRegistration) {
            activeRegistration.utr_upi_transaction_id = utrVal;
            SafeStorage.setItem(STORAGE_KEYS.USER_REGISTRATION, JSON.stringify(activeRegistration));
          }
          if (utrUpdateStatus) {
            utrUpdateStatus.style.color = '#10B981';
            utrUpdateStatus.textContent = 'UTR recorded. Desk volunteer will verify your transaction.';
          }
        } catch (e) {
          if (utrUpdateStatus) {
            utrUpdateStatus.style.color = '#10B981';
            utrUpdateStatus.textContent = 'UTR recorded locally. Show this to the volunteer.';
          }
        } finally {
          if (btnSaveUtrText) btnSaveUtrText.textContent = 'SAVED';
          setTimeout(() => {
            if (btnSaveUtrText) btnSaveUtrText.textContent = 'UPDATE UTR';
            btnSaveUtr.disabled = false;
          }, 2500);
        }
      });
    }

    // Register Another Participant
    if (btnRegisterNew) {
      btnRegisterNew.addEventListener('click', () => {
        if (confirm('Start a new registration? The current screen will be cleared.')) {
          SafeStorage.removeItem(STORAGE_KEYS.USER_REGISTRATION);
          activeRegistration = null;
          resetFile();
          if (eventRegistrationForm) eventRegistrationForm.reset();
          if (phase4UtrInput) phase4UtrInput.value = '';
          if (utrUpdateStatus) utrUpdateStatus.textContent = '';
          setPhase(1);
        }
      });
    }
  }

  function copyToClipboard(text, textElement, copiedLabel, defaultLabel) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (textElement) textElement.textContent = copiedLabel;
        setTimeout(() => {
          if (textElement) textElement.textContent = defaultLabel;
        }, 2000);
      }).catch(() => {
        fallbackCopy(text, textElement, copiedLabel, defaultLabel);
      });
    } else {
      fallbackCopy(text, textElement, copiedLabel, defaultLabel);
    }
  }

  function fallbackCopy(text, textElement, copiedLabel, defaultLabel) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      if (textElement) textElement.textContent = copiedLabel;
      setTimeout(() => {
        if (textElement) textElement.textContent = defaultLabel;
      }, 2000);
    } catch (e) {}
    document.body.removeChild(tempInput);
  }

  // --- DYNAMIC REAL-TIME PHONE VALIDATOR ---
  function setupPhoneValidator() {
    const contactInput = document.getElementById('contact_number');
    const phoneIndicator = document.getElementById('phoneIndicator');
    if (!contactInput || !phoneIndicator) return;

    function validate() {
      const digits = contactInput.value.replace(/\D/g, '').slice(0, 10);
      if (contactInput.value !== digits) {
        contactInput.value = digits;
      }
      const len = digits.length;
      if (len === 0) {
        phoneIndicator.textContent = '';
        phoneIndicator.className = 'phone-indicator';
        contactInput.classList.remove('valid-field');
      } else if (len === 10) {
        phoneIndicator.textContent = '10/10 ✓ Valid';
        phoneIndicator.className = 'phone-indicator valid';
        contactInput.classList.add('valid-field');
      } else {
        phoneIndicator.textContent = `${len}/10 digits`;
        phoneIndicator.className = 'phone-indicator';
        contactInput.classList.remove('valid-field');
      }
    }

    contactInput.addEventListener('input', validate);
    contactInput.addEventListener('blur', validate);
    validate();
  }

  // --- SETTINGS MODAL ---
  function setupModal() {
    if (apiConfigTrigger && configModal) {
      apiConfigTrigger.addEventListener('click', () => {
        if (apiUrlInput) apiUrlInput.value = activeApiUrl;
        if (upiIdInput) upiIdInput.value = activeUpiId;
        configModal.classList.add('active');
      });
    }

    if (closeConfigModalBtn && configModal) {
      closeConfigModalBtn.addEventListener('click', () => {
        configModal.classList.remove('active');
      });
    }

    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        if (apiUrlInput) {
          activeApiUrl = apiUrlInput.value.trim();
          SafeStorage.setItem(STORAGE_KEYS.API_URL, activeApiUrl);
        }
        if (upiIdInput) {
          const val = upiIdInput.value.trim();
          if (val) {
            activeUpiId = val;
            SafeStorage.setItem(STORAGE_KEYS.UPI_ID, val);
          }
          if (displayUpiId) displayUpiId.textContent = activeUpiId;
          if (activeRegistration && currentPhase === 4) {
            renderPaymentScreen(activeRegistration);
          }
        }
        alert('Settings saved. The active UPI QR code and payment link have been updated.');
        configModal.classList.remove('active');
      });
    }
  }

});
