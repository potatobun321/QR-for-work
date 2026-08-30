/**
 * ==============================================================================
 * STUDENT INDUCTION PROGRAM - FRONTEND LOGIC (app.js)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- CONFIGURATION & CONSTANTS ---
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxAkqAEFdImcBK84eDabGiCf4WSocQELZUPIQRt1Nw68yJBDmuc4SyMfLs_3ZVWLPdm/exec';
  const STORAGE_KEYS = {
    DEVICE_ID: 'qr_attendance_device_id',
    USER_PROFILE: 'qr_attendance_user_profile',
    API_URL: 'qr_attendance_api_url',
    ATTENDANCE_LOG: 'qr_attendance_logged_days'
  };

  const DAY_THEMES = {
    1: { name: 'Day 1', date: 'Aug 31', fullDate: '2026-08-31', color: '#FFDE59' }, // Electric Yellow
    2: { name: 'Day 2', date: 'Sep 01', fullDate: '2026-09-01', color: '#FF66C4' }, // Hot Pink
    3: { name: 'Day 3', date: 'Sep 02', fullDate: '2026-09-02', color: '#00F0FF' }, // Electric Cyan
    4: { name: 'Day 4', date: 'Sep 03', fullDate: '2026-09-03', color: '#70E000' }, // Lime Green
    5: { name: 'Day 5', date: 'Sep 04', fullDate: '2026-09-04', color: '#FF914D' }, // Bright Orange
    6: { name: 'Day 6', date: 'Sep 05', fullDate: '2026-09-05', color: '#B57EDC' }  // Vibrant Violet
  };

  // --- STATE VARIABLES ---
  let currentDeviceId = getOrCreateDeviceId();
  let currentActiveDay = calculateActiveDay();
  let currentUserProfile = loadUserProfile();
  let activeApiUrl = localStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
  let secretClickCount = 0;
  let secretClickTimer = null;

  // --- DOM ELEMENT REFERENCES ---
  const appHeaderTitleEl = document.getElementById('appHeaderTitle');
  const appDaySubtitleEl = document.getElementById('appDaySubtitle');
  const activeDayTextBadgeEl = document.getElementById('activeDayTextBadge');
  const stepperBarEl = document.getElementById('stepperBar');
  
  const timeLockBox = document.getElementById('timeLockBox');
  const timeLockTitle = document.getElementById('timeLockTitle');
  const timeLockMsg = document.getElementById('timeLockMsg');

  const registrationCard = document.getElementById('registrationCard');
  const attendanceForm = document.getElementById('attendanceForm');
  const formActionInput = document.getElementById('formActionInput');
  const formDayInput = document.getElementById('formDayInput');
  const formDeviceIdInput = document.getElementById('formDeviceIdInput');
  
  const inputName = document.getElementById('inputName');
  const inputPhone = document.getElementById('inputPhone');
  const inputEmail = document.getElementById('inputEmail');
  const selectBranch = document.getElementById('selectBranch');
  
  const submitRegBtn = document.getElementById('submitRegBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');

  const oneTapCard = document.getElementById('oneTapCard');
  const welcomeNameText = document.getElementById('welcomeNameText');
  const welcomePhoneText = document.getElementById('welcomePhoneText');
  const welcomeBranchText = document.getElementById('welcomeBranchText');
  const oneTapSubmitBtn = document.getElementById('oneTapSubmitBtn');
  const oneTapSpinner = document.getElementById('oneTapSpinner');
  const oneTapBtnText = document.getElementById('oneTapBtnText');
  const switchUserBtn = document.getElementById('switchUserBtn');

  const statusSuccessCard = document.getElementById('statusSuccessCard');
  const successTitle = document.getElementById('successTitle');
  const successMsg = document.getElementById('successMsg');
  const successDoneBtn = document.getElementById('successDoneBtn');

  const statusMismatchCard = document.getElementById('statusMismatchCard');
  const mismatchMsg = document.getElementById('mismatchMsg');
  const mismatchDismissBtn = document.getElementById('mismatchDismissBtn');

  const statusAlreadySubmittedCard = document.getElementById('statusAlreadySubmittedCard');
  const alreadySubmittedMsg = document.getElementById('alreadySubmittedMsg');
  const alreadySubmittedDismissBtn = document.getElementById('alreadySubmittedDismissBtn');

  const configModal = document.getElementById('configModal');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const saveApiUrlBtn = document.getElementById('saveApiUrlBtn');
  const resetStorageBtn = document.getElementById('resetStorageBtn');
  const appFooter = document.getElementById('appFooter');

  // --- INITIALIZATION ---
  initApp();

  function initApp() {
    if (formDeviceIdInput) {
      formDeviceIdInput.value = currentDeviceId;
    }

    if (apiUrlInput) {
      apiUrlInput.value = activeApiUrl;
    }

    setDayTheme(currentActiveDay);
    setupEventListeners();
    evaluateUserFlow();
  }

  // --- DEVICE LOCKING LOGIC (SILENT IN BACKGROUND) ---
  function getOrCreateDeviceId() {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      const randomUuid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      id = `dev_${randomUuid}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  }

  // --- DAY CALCULATOR & TIME-LOCK ENGINE ---
  function calculateActiveDay() {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const date = today.getDate();

    if (month === 8 && date >= 31) return 1;
    if (month === 9) {
      if (date === 1) return 2;
      if (date === 2) return 3;
      if (date === 3) return 4;
      if (date === 4) return 5;
      if (date >= 5) return 6;
    }
    return 1;
  }

  // Check if attendance is unlocked for selected day & 9:30 AM time condition
  function isAttendanceUnlocked(dayNum) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDate = String(now.getDate()).padStart(2, '0');
    const todayYMD = `${currentYear}-${currentMonth}-${currentDate}`;

    const targetDayInfo = DAY_THEMES[dayNum];
    if (!targetDayInfo) return { unlocked: true };

    const targetYMD = targetDayInfo.fullDate;

    // 1. Future Date Check
    if (targetYMD > todayYMD) {
      return { 
        unlocked: false, 
        reason: `Attendance for ${targetDayInfo.name} unlocks at 9:30 AM on ${targetDayInfo.date}.` 
      };
    }

    // 2. Same Day 9:30 AM Check
    if (targetYMD === todayYMD) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      // Unlock after 9:30 AM (9 * 60 + 30 = 570 mins)
      const currentMinutes = hours * 60 + minutes;
      if (currentMinutes < 570) {
        return { 
          unlocked: false, 
          reason: `Orientation starts at 9:30 AM today! Registration unlocks at 9:30 AM.` 
        };
      }
    }

    // Past Days or Current Day after 9:30 AM -> Unlocked!
    return { unlocked: true };
  }

  function setDayTheme(dayNum) {
    currentActiveDay = dayNum;
    const theme = DAY_THEMES[dayNum] || DAY_THEMES[1];

    document.documentElement.style.setProperty('--theme-accent', theme.color);

    if (appDaySubtitleEl) {
      appDaySubtitleEl.textContent = `⚡ ${theme.name.toUpperCase()} ATTENDANCE (${theme.date})`;
    }
    if (activeDayTextBadgeEl) {
      activeDayTextBadgeEl.textContent = `${theme.name.toUpperCase()} OF 6`;
    }
    if (formDayInput) {
      formDayInput.value = dayNum;
    }
    if (btnText) {
      btnText.textContent = `MARK ${theme.name.toUpperCase()} ATTENDANCE →`;
    }
    if (oneTapBtnText) {
      oneTapBtnText.textContent = `MARK ${theme.name.toUpperCase()} ATTENDANCE →`;
    }

    const stepButtons = stepperBarEl ? stepperBarEl.querySelectorAll('.step-btn') : [];
    stepButtons.forEach(btn => {
      const bDay = parseInt(btn.getAttribute('data-day'), 10);
      if (bDay === dayNum) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    evaluateUserFlow();
  }

  // --- USER PROFILE STORAGE ---
  function loadUserProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveUserProfile(profile) {
    currentUserProfile = profile;
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  // --- USER FLOW CONTROL ---
  function evaluateUserFlow() {
    hideAllStatusCards();

    // 1. Time-Lock Check (Must be >= 9:30 AM on event day)
    const lockStatus = isAttendanceUnlocked(currentActiveDay);
    if (!lockStatus.unlocked) {
      showTimeLockCard(lockStatus.reason);
      return;
    } else {
      if (timeLockBox) timeLockBox.style.display = 'none';
    }

    // 2. Already Submitted Check
    const loggedDays = getLoggedDays();
    if (currentUserProfile && loggedDays[currentActiveDay]) {
      showStatusCard('alreadySubmitted', 'ALREADY MARKED', `You have already submitted attendance for ${DAY_THEMES[currentActiveDay].name}.`);
      return;
    }

    // 3. Flow Selector (1-Tap vs Registration Form)
    if (currentUserProfile && currentUserProfile.phone) {
      showOneTapCard();
    } else {
      showRegistrationForm();
    }
  }

  function showTimeLockCard(reason) {
    registrationCard.style.display = 'none';
    oneTapCard.style.display = 'none';
    hideAllStatusCards();
    if (timeLockBox) {
      timeLockBox.style.display = 'block';
      if (timeLockMsg) timeLockMsg.textContent = reason;
    }
  }

  function showRegistrationForm() {
    if (timeLockBox) timeLockBox.style.display = 'none';
    registrationCard.style.display = 'block';
    oneTapCard.style.display = 'none';
    hideAllStatusCards();

    if (currentUserProfile) {
      if (inputName) inputName.value = currentUserProfile.name || '';
      if (inputPhone) inputPhone.value = currentUserProfile.phone || '';
      if (inputEmail) inputEmail.value = currentUserProfile.email || '';
      if (selectBranch) selectBranch.value = currentUserProfile.branch || '';
    }
  }

  function showOneTapCard() {
    if (timeLockBox) timeLockBox.style.display = 'none';
    registrationCard.style.display = 'none';
    oneTapCard.style.display = 'block';
    hideAllStatusCards();

    if (welcomeNameText) welcomeNameText.textContent = `Welcome back, ${currentUserProfile.name || 'Student'}! 👋`;
    if (welcomePhoneText) welcomePhoneText.textContent = `📱 Phone: ${currentUserProfile.phone || '--'}`;
    if (welcomeBranchText) welcomeBranchText.textContent = `🎓 Branch: ${currentUserProfile.branch || '--'}`;
  }

  function hideAllStatusCards() {
    if (statusSuccessCard) statusSuccessCard.style.display = 'none';
    if (statusMismatchCard) statusMismatchCard.style.display = 'none';
    if (statusAlreadySubmittedCard) statusAlreadySubmittedCard.style.display = 'none';
  }

  function showStatusCard(type, title, message) {
    if (timeLockBox) timeLockBox.style.display = 'none';
    registrationCard.style.display = 'none';
    oneTapCard.style.display = 'none';
    hideAllStatusCards();

    if (type === 'success') {
      if (successTitle) successTitle.textContent = title || 'ATTENDANCE MARKED!';
      if (successMsg) successMsg.textContent = message || 'Attendance successfully saved.';
      if (statusSuccessCard) statusSuccessCard.style.display = 'block';
    } else if (type === 'mismatch') {
      if (mismatchMsg) mismatchMsg.textContent = message || 'Device mismatch detected.';
      if (statusMismatchCard) statusMismatchCard.style.display = 'block';
    } else if (type === 'alreadySubmitted') {
      if (alreadySubmittedMsg) alreadySubmittedMsg.textContent = message || 'You have already marked attendance for today.';
      if (statusAlreadySubmittedCard) statusAlreadySubmittedCard.style.display = 'block';
    }
  }

  // --- ATTENDANCE SUBMISSION HANDLING ---
  function setupEventListeners() {
    // 1. Stepper Bar Clicks
    if (stepperBarEl) {
      stepperBarEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.step-btn');
        if (btn) {
          const dayNum = parseInt(btn.getAttribute('data-day'), 10);
          setDayTheme(dayNum);
        }
      });
    }

    // 2. Registration Form Submit
    if (attendanceForm) {
      attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = inputPhone.value.trim().replace(/[^0-9]/g, '');
        const name = inputName.value.trim();
        const email = inputEmail.value.trim();
        const branch = selectBranch.value;

        if (phone.length !== 10) {
          alert('Please enter a valid 10-digit mobile number.');
          return;
        }

        const profile = { name, phone, email, branch };
        setLoadingState(true, 'reg');

        await processAttendanceSubmission({
          action: 'register',
          phone: phone,
          name: name,
          email: email,
          branch: branch,
          day: currentActiveDay,
          deviceId: currentDeviceId
        }, profile);

        setLoadingState(false, 'reg');
      });
    }

    // 3. 1-Tap Button Click
    if (oneTapSubmitBtn) {
      oneTapSubmitBtn.addEventListener('click', async () => {
        if (!currentUserProfile || !currentUserProfile.phone) {
          showRegistrationForm();
          return;
        }

        setLoadingState(true, 'oneTap');

        await processAttendanceSubmission({
          action: 'attend',
          phone: currentUserProfile.phone,
          name: currentUserProfile.name,
          email: currentUserProfile.email,
          branch: currentUserProfile.branch,
          day: currentActiveDay,
          deviceId: currentDeviceId
        }, currentUserProfile);

        setLoadingState(false, 'oneTap');
      });
    }

    // 4. Switch Account Button
    if (switchUserBtn) {
      switchUserBtn.addEventListener('click', () => {
        if (confirm('Switching user will clear the currently active profile on this device. Continue?')) {
          localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
          currentUserProfile = null;
          showRegistrationForm();
        }
      });
    }

    // 5. Dismiss Status Buttons
    if (successDoneBtn) {
      successDoneBtn.addEventListener('click', () => {
        evaluateUserFlow();
      });
    }
    if (mismatchDismissBtn) {
      mismatchDismissBtn.addEventListener('click', () => {
        showRegistrationForm();
      });
    }
    if (alreadySubmittedDismissBtn) {
      alreadySubmittedDismissBtn.addEventListener('click', () => {
        evaluateUserFlow();
      });
    }

    // 6. Secret Admin Modal Trigger (5 fast clicks on Header Title or Footer)
    const triggerSecretAdmin = () => {
      secretClickCount++;
      clearTimeout(secretClickTimer);
      secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 2000);
      if (secretClickCount >= 5) {
        secretClickCount = 0;
        configModal.classList.add('active');
      }
    };

    if (appHeaderTitleEl) appHeaderTitleEl.addEventListener('click', triggerSecretAdmin);
    if (appFooter) appFooter.addEventListener('click', triggerSecretAdmin);

    if (closeConfigModalBtn) {
      closeConfigModalBtn.addEventListener('click', () => {
        configModal.classList.remove('active');
      });
    }
    if (saveApiUrlBtn) {
      saveApiUrlBtn.addEventListener('click', () => {
        const val = apiUrlInput.value.trim();
        activeApiUrl = val;
        localStorage.setItem(STORAGE_KEYS.API_URL, val);
        alert('API Web App URL saved successfully!');
        configModal.classList.remove('active');
      });
    }
    if (resetStorageBtn) {
      resetStorageBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset local storage? This clears your device profile for testing.')) {
          localStorage.clear();
          location.reload();
        }
      });
    }
  }

  // --- API BACKEND COMMUNICATOR ---
  async function processAttendanceSubmission(params, profile) {
    if (!activeApiUrl) {
      configModal.classList.add('active');
      alert('Please configure your Google Apps Script Web App URL first!');
      return;
    }

    try {
      const queryString = new URLSearchParams(params).toString();
      const requestUrl = `${activeApiUrl}?${queryString}`;

      // 1. Try no-cors fetch (Zero CORS blocking on all browsers)
      await fetch(requestUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache'
      });

      // 2. Trigger Image ping to guarantee request transmission
      const imgPing = new Image();
      imgPing.src = requestUrl;

      saveUserProfile(profile);
      markDayAsLogged(params.day);
      showStatusCard('success', 'ATTENDANCE MARKED!', `Your attendance for ${DAY_THEMES[params.day].name} has been recorded successfully.`);

    } catch (err) {
      console.warn('Network error, triggering iframe fallback:', err);
      fallbackIframeSubmission(params, profile);
    }
  }

  function fallbackIframeSubmission(params, profile) {
    const form = document.createElement('form');
    form.action = activeApiUrl;
    form.method = 'GET';
    form.target = 'hidden_iframe';

    for (const key in params) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = params[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setTimeout(() => {
      saveUserProfile(profile);
      markDayAsLogged(params.day);
      showStatusCard('success', 'ATTENDANCE SUBMITTED!', `Your attendance for ${DAY_THEMES[params.day].name} has been recorded.`);
    }, 1200);
  }

  // --- HELPER UTILITIES ---
  function setLoadingState(isLoading, mode) {
    if (mode === 'reg') {
      submitRegBtn.disabled = isLoading;
      if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
      if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
    } else if (mode === 'oneTap') {
      oneTapSubmitBtn.disabled = isLoading;
      if (oneTapSpinner) oneTapSpinner.style.display = isLoading ? 'inline-block' : 'none';
      if (oneTapBtnText) oneTapBtnText.style.display = isLoading ? 'none' : 'inline-block';
    }
  }

  function getLoggedDays() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_LOG);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function markDayAsLogged(dayNum) {
    const logged = getLoggedDays();
    logged[dayNum] = true;
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOG, JSON.stringify(logged));
  }

});
