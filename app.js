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

  const SCHEDULE_DATA = {
    1: {
      title: 'DAY 1 SCHEDULE (CONCLUDED)',
      date: 'Monday, Aug 31 • Induction Inauguration',
      sessions: [
        { time: '10:00 AM - 11:30 AM', title: 'Grand Inauguration & Welcome Address', speaker: 'Hon\'ble Dignitaries & Management' },
        { time: '11:30 AM - 01:00 PM', title: 'Campus Orientation & Code of Conduct', speaker: 'Dean of Student Welfare' },
        { time: '02:00 PM - 04:00 PM', title: 'Department Tour & Interaction', speaker: 'Heads of Departments' }
      ]
    },
    2: {
      title: 'DAY 2 SCHEDULE',
      date: 'Tuesday, Sep 01 • Orientation Agenda',
      sessions: [
        { time: '09:00 AM - 10:00 AM', title: 'Yoga and Ayurveda', speaker: 'Shri Hemraj Gurjar' },
        { time: '10:00 AM - 11:00 AM', title: 'Journey of Becoming an Entrepreneur', speaker: 'Dr. Anil Salecha, Entrepreneur' },
        { time: '11:00 AM - 12:00 PM', title: 'Shaping Futures: From Campus to Career', speaker: 'Shri Suresh Choudhary' },
        { time: '12:00 PM - 01:00 PM', title: 'Contemporary Youth Discourse', speaker: 'Dr. Amit Jhalani, Assistant Professor, SKIT Jaipur' },
        { time: '01:00 PM', title: 'Fun Activities and Games', speaker: 'Student Induction Committee' }
      ]
    },
    3: {
      title: 'DAY 3 SCHEDULE (UPCOMING)',
      date: 'Wednesday, Sep 02 • Technical Workshops',
      sessions: [
        { time: '09:30 AM - 11:00 AM', title: 'Emerging Technologies & AI Landscape', speaker: 'Industry Guest Speaker' },
        { time: '11:15 AM - 01:00 PM', title: 'Hands-on Labs & Coding Foundations', speaker: 'Faculty Mentors' },
        { time: '02:00 PM - 04:00 PM', title: 'Team Building & Creative Challenges', speaker: 'Student Clubs' }
      ]
    },
    4: {
      title: 'DAY 4 SCHEDULE (UPCOMING)',
      date: 'Thursday, Sep 03 • Innovation & Research',
      sessions: [
        { time: '09:30 AM - 11:30 AM', title: 'Design Thinking & Project Ideation', speaker: 'Innovation Cell' },
        { time: '12:00 PM - 01:30 PM', title: 'Library & Online Research Tools Walkthrough', speaker: 'Central Library Staff' },
        { time: '02:30 PM - 04:00 PM', title: 'Cultural Rehearsals & Jam Sessions', speaker: 'Cultural Society' }
      ]
    },
    5: {
      title: 'DAY 5 SCHEDULE (UPCOMING)',
      date: 'Friday, Sep 04 • Health, Sports & Well-being',
      sessions: [
        { time: '09:30 AM - 11:00 AM', title: 'Mental Wellness & Stress Management', speaker: 'Counseling Cell' },
        { time: '11:30 AM - 01:30 PM', title: 'Inter-Department Sports & Fun Matches', speaker: 'Sports Directorate' },
        { time: '02:30 PM - 04:00 PM', title: 'Clubs & Societies Expo', speaker: 'Student Council' }
      ]
    },
    6: {
      title: 'DAY 6 SCHEDULE (UPCOMING)',
      date: 'Saturday, Sep 05 • Valedictory & Fest',
      sessions: [
        { time: '10:00 AM - 12:00 PM', title: 'Open Mic Performances & Talent Showcase', speaker: 'Freshers & Student Stars' },
        { time: '12:30 PM - 02:00 PM', title: 'Valedictory Ceremony & Prize Distribution', speaker: 'Chief Guests & Director' },
        { time: '02:30 PM - 05:00 PM', title: 'Celebration & Induction DJ / Musical Jam', speaker: 'Music Club' }
      ]
    }
  };

  // --- SAFE STORAGE WRAPPER (Prevents crashes in iOS Safari Private Browsing / WebViews) ---
  const memoryStore = {};
  const SafeStorage = {
    getItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        }
      } catch (e) {
        console.warn('localStorage read blocked (Safari/Private Mode):', e);
      }
      return memoryStore[key] || null;
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('localStorage write blocked (Safari/Private Mode):', e);
      }
      memoryStore[key] = String(value);
    },
    removeItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
      delete memoryStore[key];
    },
    clear: () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
      } catch (e) {}
      for (const k in memoryStore) delete memoryStore[k];
    }
  };

  // --- STATE VARIABLES ---
  let currentDeviceId = getOrCreateDeviceId();
  let currentActiveDay = calculateActiveDay();
  let currentUserProfile = loadUserProfile();
  let activeApiUrl = SafeStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
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

  const dayNoticeBox = document.getElementById('dayNoticeBox');
  const dayNoticeTag = document.getElementById('dayNoticeTag');
  const dayNoticeTitle = document.getElementById('dayNoticeTitle');
  const dayNoticeMsg = document.getElementById('dayNoticeMsg');

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

  const toggleBranchFixBtn = document.getElementById('toggleBranchFixBtn');
  const branchFixForm = document.getElementById('branchFixForm');
  const updateBranchSelect = document.getElementById('updateBranchSelect');
  const saveBranchUpdateBtn = document.getElementById('saveBranchUpdateBtn');
  const branchFixSpinner = document.getElementById('branchFixSpinner');
  const branchFixBtnText = document.getElementById('branchFixBtnText');

  const scheduleCardTitle = document.getElementById('scheduleCardTitle');
  const scheduleCardDate = document.getElementById('scheduleCardDate');
  const scheduleTimeline = document.getElementById('scheduleTimeline');

  const feedbackForm = document.getElementById('feedbackForm');
  const feedbackCategory = document.getElementById('feedbackCategory');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const toggleOptionalBtn = document.getElementById('toggleOptionalBtn');
  const optionalFields = document.getElementById('optionalFields');
  const feedbackName = document.getElementById('feedbackName');
  const feedbackBranch = document.getElementById('feedbackBranch');
  const feedbackPhone = document.getElementById('feedbackPhone');
  const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
  const feedbackSpinner = document.getElementById('feedbackSpinner');
  const feedbackBtnText = document.getElementById('feedbackBtnText');
  const feedbackSuccessBanner = document.getElementById('feedbackSuccessBanner');

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
    let id = SafeStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      const randomUuid = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      id = `dev_${randomUuid}`;
      SafeStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
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
    return 2;
  }

  // Check if attendance is unlocked for selected day & 9:30 AM - 11:30 AM window
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
        reason: `Attendance for ${targetDayInfo.name} unlocks on ${targetDayInfo.date}.` 
      };
    }

    // 2. Same Day 8:45 AM - 11:30 AM Time Window Check
    if (targetYMD === todayYMD) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      // Before 8:45 AM (8 * 60 + 45 = 525 mins)
      if (currentMinutes < 525) {
        return { 
          unlocked: false, 
          reason: `Attendance unlocks at 8:45 AM today.` 
        };
      }

      // After 11:30 AM (11 * 60 + 30 = 690 mins)
      if (currentMinutes > 690) {
        return { 
          unlocked: false, 
          reason: `Attendance window for today closed at 11:30 AM. You can submit feedback below.` 
        };
      }
    }

    return { unlocked: true };
  }

  function setDayTheme(dayNum) {
    currentActiveDay = dayNum;
    const theme = DAY_THEMES[dayNum] || DAY_THEMES[1];

    document.documentElement.style.setProperty('--theme-accent', theme.color);

    if (appDaySubtitleEl) {
      appDaySubtitleEl.textContent = `${theme.name.toUpperCase()} ATTENDANCE (${theme.date})`;
    }
    if (activeDayTextBadgeEl) {
      activeDayTextBadgeEl.textContent = `${theme.name.toUpperCase()} OF 6`;
    }
    if (formDayInput) {
      formDayInput.value = dayNum;
    }
    if (btnText) {
      btnText.textContent = `MARK ${theme.name.toUpperCase()} ATTENDANCE`;
    }
    if (oneTapBtnText) {
      oneTapBtnText.textContent = `MARK ${theme.name.toUpperCase()} ATTENDANCE`;
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

    renderSchedule(dayNum);
    evaluateUserFlow();
  }

  // --- SCHEDULE RENDERER ---
  function renderSchedule(dayNum) {
    const data = SCHEDULE_DATA[dayNum] || SCHEDULE_DATA[2];
    if (scheduleCardTitle) scheduleCardTitle.textContent = data.title;
    if (scheduleCardDate) scheduleCardDate.textContent = data.date;

    if (scheduleTimeline) {
      scheduleTimeline.innerHTML = '';
      data.sessions.forEach(sess => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
          <span class="timeline-time-badge">${sess.time}</span>
          <div class="timeline-title">${sess.title}</div>
          <div class="timeline-speaker">${sess.speaker}</div>
        `;
        scheduleTimeline.appendChild(item);
      });
    }
  }

  // --- USER PROFILE STORAGE ---
  function loadUserProfile() {
    try {
      const data = SafeStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveUserProfile(profile) {
    currentUserProfile = profile;
    SafeStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  // --- USER FLOW CONTROL ---
  function evaluateUserFlow() {
    hideAllStatusCards();
    if (dayNoticeBox) dayNoticeBox.style.display = 'none';

    const activeCalendarDay = calculateActiveDay();
    const scheduleCardEl = document.getElementById('scheduleCard');
    const feedbackCardEl = document.getElementById('feedbackCard');

    // 1. HARDLOCK CHECK: Previous Concluded Days (e.g. Day 1 when today is Day 2)
    if (currentActiveDay < activeCalendarDay) {
      registrationCard.style.display = 'none';
      oneTapCard.style.display = 'none';
      if (timeLockBox) timeLockBox.style.display = 'none';
      if (scheduleCardEl) scheduleCardEl.style.display = 'none';
      if (feedbackCardEl) feedbackCardEl.style.display = 'none';

      if (dayNoticeBox) {
        dayNoticeBox.style.display = 'block';
        if (dayNoticeTag) dayNoticeTag.textContent = 'DAY CONCLUDED';
        if (dayNoticeTitle) dayNoticeTitle.textContent = `${DAY_THEMES[currentActiveDay].name.toUpperCase()} CONCLUDED`;
        if (dayNoticeMsg) dayNoticeMsg.textContent = `Attendance and sessions for ${DAY_THEMES[currentActiveDay].name} (${DAY_THEMES[currentActiveDay].date}) have ended. Please select Day ${activeCalendarDay} to check-in for today.`;
      }
      return;
    }

    // 2. HARDLOCK CHECK: Future Upcoming Days (e.g. Days 3-6)
    if (currentActiveDay > activeCalendarDay) {
      registrationCard.style.display = 'none';
      oneTapCard.style.display = 'none';
      if (timeLockBox) timeLockBox.style.display = 'none';
      if (scheduleCardEl) scheduleCardEl.style.display = 'none';
      if (feedbackCardEl) feedbackCardEl.style.display = 'none';

      if (dayNoticeBox) {
        dayNoticeBox.style.display = 'block';
        if (dayNoticeTag) dayNoticeTag.textContent = 'LOCKED';
        if (dayNoticeTitle) dayNoticeTitle.textContent = `${DAY_THEMES[currentActiveDay].name.toUpperCase()} LOCKED`;
        if (dayNoticeMsg) dayNoticeMsg.textContent = `This session will be accessible on ${DAY_THEMES[currentActiveDay].date} during event hours.`;
      }
      return;
    }

    // Only show schedule and feedback on today's active day
    if (scheduleCardEl) scheduleCardEl.style.display = 'block';
    if (feedbackCardEl) feedbackCardEl.style.display = 'block';

    // 3. Active Calendar Day Time-Lock Check (9:30 AM - 11:30 AM)
    const lockStatus = isAttendanceUnlocked(currentActiveDay);
    if (!lockStatus.unlocked) {
      showTimeLockCard(lockStatus.reason);
      return;
    } else {
      if (timeLockBox) timeLockBox.style.display = 'none';
    }

    // 4. Already Submitted Check
    const loggedDays = getLoggedDays();
    if (currentUserProfile && loggedDays[currentActiveDay]) {
      showStatusCard('alreadySubmitted', 'ALREADY MARKED TODAY', `Your attendance for ${DAY_THEMES[currentActiveDay].name} (${DAY_THEMES[currentActiveDay].date}) has already been recorded.`);
      return;
    }

    // 5. Flow Selector (1-Tap vs Registration Form)
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

    if (welcomeNameText) welcomeNameText.textContent = `Welcome back, ${currentUserProfile.name || 'Student'}!`;
    if (welcomePhoneText) welcomePhoneText.textContent = `Phone: ${currentUserProfile.phone || '--'}`;
    if (welcomeBranchText) welcomeBranchText.textContent = `Branch: ${currentUserProfile.branch || '--'}`;
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
        
        let phone = inputPhone.value.trim().replace(/[^0-9]/g, '');
        if (phone.length > 10 && (phone.startsWith('91') || phone.startsWith('0'))) {
          phone = phone.slice(-10);
        }
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

    // 4. Branch Correction (Biomedical Fix)
    if (toggleBranchFixBtn && branchFixForm) {
      toggleBranchFixBtn.addEventListener('click', () => {
        const isHidden = branchFixForm.style.display === 'none' || !branchFixForm.style.display;
        branchFixForm.style.display = isHidden ? 'block' : 'none';
        if (isHidden && currentUserProfile && currentUserProfile.branch) {
          if (updateBranchSelect) updateBranchSelect.value = currentUserProfile.branch;
        }
      });
    }

    if (saveBranchUpdateBtn) {
      saveBranchUpdateBtn.addEventListener('click', async () => {
        if (!currentUserProfile || !currentUserProfile.phone) return;

        const newBranch = updateBranchSelect.value;
        if (!newBranch) return;

        // UI loading state
        saveBranchUpdateBtn.disabled = true;
        if (branchFixSpinner) branchFixSpinner.style.display = 'inline-block';
        if (branchFixBtnText) branchFixBtnText.style.display = 'none';

        try {
          currentUserProfile.branch = newBranch;
          saveUserProfile(currentUserProfile);

          if (welcomeBranchText) {
            welcomeBranchText.textContent = `Branch: ${newBranch}`;
          }

          // Sync with backend Google Apps Script
          sendToBackend({
            action: 'update_branch',
            phone: currentUserProfile.phone,
            branch: newBranch,
            deviceId: currentDeviceId
          });

          alert(`Branch successfully updated to ${newBranch}!`);
          if (branchFixForm) branchFixForm.style.display = 'none';
        } catch (err) {
          console.warn('Branch update failed:', err);
          alert('Could not update branch to server. Please check internet connection.');
        } finally {
          saveBranchUpdateBtn.disabled = false;
          if (branchFixSpinner) branchFixSpinner.style.display = 'none';
          if (branchFixBtnText) branchFixBtnText.style.display = 'inline-block';
        }
      });
    }

    // 5. Feedback Form Submit & Optional Toggle
    if (toggleOptionalBtn && optionalFields) {
      toggleOptionalBtn.addEventListener('click', () => {
        const isHidden = optionalFields.style.display === 'none' || !optionalFields.style.display;
        optionalFields.style.display = isHidden ? 'block' : 'none';
        toggleOptionalBtn.textContent = isHidden ? '- Hide Contact Details' : '+ Add Contact Details (Optional, for follow-up)';
      });
    }

    if (feedbackForm) {
      feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = feedbackCategory ? feedbackCategory.value : 'General';
        const message = feedbackMessage ? feedbackMessage.value.trim() : '';
        const name = feedbackName ? feedbackName.value.trim() : '';
        const branch = feedbackBranch ? feedbackBranch.value : '';
        const phone = feedbackPhone ? feedbackPhone.value.trim().replace(/[^0-9]/g, '') : '';

        if (!message) {
          alert('Please write a message before submitting.');
          return;
        }

        // Loading state
        submitFeedbackBtn.disabled = true;
        if (feedbackSpinner) feedbackSpinner.style.display = 'inline-block';
        if (feedbackBtnText) feedbackBtnText.style.display = 'none';

        try {
          sendToBackend({
            action: 'feedback',
            category: category,
            message: message,
            name: name || 'Anonymous',
            branch: branch || '--',
            phone: phone || '--',
            deviceId: currentDeviceId
          });

          // Reset form
          feedbackMessage.value = '';
          if (feedbackSuccessBanner) {
            feedbackSuccessBanner.style.display = 'block';
            setTimeout(() => {
              feedbackSuccessBanner.style.display = 'none';
            }, 5000);
          }
        } catch (err) {
          console.warn('Feedback submission error:', err);
          alert('Feedback submitted.');
        } finally {
          submitFeedbackBtn.disabled = false;
          if (feedbackSpinner) feedbackSpinner.style.display = 'none';
          if (feedbackBtnText) feedbackBtnText.style.display = 'inline-block';
        }
      });
    }

    // 5. Dismiss Status Buttons
    if (mismatchDismissBtn) {
      mismatchDismissBtn.addEventListener('click', () => {
        showRegistrationForm();
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
        SafeStorage.setItem(STORAGE_KEYS.API_URL, val);
        alert('API Web App URL saved successfully!');
        configModal.classList.remove('active');
      });
    }
    if (resetStorageBtn) {
      resetStorageBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset local storage? This clears your device profile for testing.')) {
          SafeStorage.clear();
          location.reload();
        }
      });
    }
  }

  // --- MULTI-TIER RESILIENT BACKEND SENDER (Immune to iOS Safari CORS / WebKit 302 blocking) ---
  function sendToBackend(params) {
    if (!activeApiUrl) return;
    try {
      const queryString = new URLSearchParams(params).toString();
      const requestUrl = `${activeApiUrl}?${queryString}`;

      // 1. Image Beacon (Bypasses all cross-origin redirect / CORS restrictions on iOS Safari)
      const img = new Image();
      img.src = requestUrl;

      // 2. Asynchronous fetch (no-cors)
      try {
        fetch(requestUrl, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache'
        }).catch(() => {});
      } catch (e) {}

      // 3. navigator.sendBeacon fallback
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(requestUrl);
        }
      } catch (e) {}
    } catch (err) {
      console.warn('sendToBackend error:', err);
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
      // Send immediately via resilient multi-tier beacon
      sendToBackend(params);

      // Save local device profile & mark day logged
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
      const data = SafeStorage.getItem(STORAGE_KEYS.ATTENDANCE_LOG);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function markDayAsLogged(dayNum) {
    const logged = getLoggedDays();
    logged[dayNum] = true;
    SafeStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOG, JSON.stringify(logged));
  }

});
