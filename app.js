// Smart 6-Day Attendance Logic with Interactive Schedule Preview & Attendance Barrier

document.addEventListener("DOMContentLoaded", () => {
    const config = window.CONFIG;
    const daysData = window.DAYS_DATA;

    // Check URL params for reset parameter (?reset=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("reset") === "true") {
        localStorage.removeItem("qr_user_phone");
        localStorage.removeItem("qr_user_name");
        localStorage.removeItem("qr_user_email");
        localStorage.removeItem("qr_user_branch");
        for (let d = 1; d <= 6; d++) {
            localStorage.removeItem(`qr_attended_day_${d}`);
        }
        console.log("🧹 Pre-registered local records flushed!");
    }

    const isPreviewMode = urlParams.get("preview") === "true" || urlParams.get("override") === "true";

    // Elements
    const badgeElement = document.getElementById("dayBadge");
    const stepperStepsElement = document.getElementById("stepperSteps");
    const iconElement = document.getElementById("heroIcon");
    const titleElement = document.getElementById("heroTitle");
    const scheduleListElement = document.getElementById("scheduleList");

    // Action Cards
    const registrationFormCard = document.getElementById("registrationFormCard");
    const regForm = document.getElementById("regForm");
    const regPhoneInput = document.getElementById("regPhone");
    const regNameInput = document.getElementById("regName");
    const regEmailInput = document.getElementById("regEmail");
    const regBranchInput = document.getElementById("regBranch");

    const recurringCheckInCard = document.getElementById("recurringCheckInCard");
    const userNameGreeting = document.getElementById("userNameGreeting");
    const userMetaDetails = document.getElementById("userMetaDetails");
    const oneTapAttendBtn = document.getElementById("oneTapAttendBtn");
    const oneTapBtnText = document.getElementById("oneTapBtnText");

    const alreadySubmittedCard = document.getElementById("alreadySubmittedCard");
    const alreadySubmittedDesc = document.getElementById("alreadySubmittedDesc");

    const deviceMismatchCard = document.getElementById("deviceMismatchCard");
    const dayLockedCard = document.getElementById("dayLockedCard");
    const lockedDayTitle = document.getElementById("lockedDayTitle");
    const lockedDayDesc = document.getElementById("lockedDayDesc");
    const lockedCtaBtnText = document.getElementById("lockedCtaBtnText");
    const returnTodayBtn = document.getElementById("returnTodayBtn");

    const redirectOverlay = document.getElementById("redirectOverlay");
    const redirectStatusText = document.getElementById("redirectStatusText");
    const redirectStatusSubtext = document.getElementById("redirectStatusSubtext");

    // State Variables
    let deviceId = getOrCreateDeviceId();
    let realTodayIndex = calculateRealTodayIndex();
    let selectedDayIndex = getRequestedDayIndex(realTodayIndex);

    // Initialize UI
    renderDayUI(selectedDayIndex);
    checkUserAttendanceState();

    // 1. Device ID Generator (Stored in LocalStorage)
    function getOrCreateDeviceId() {
        let id = localStorage.getItem("qr_attendance_device_id");
        if (!id) {
            if (typeof crypto !== "undefined" && crypto.randomUUID) {
                id = "dev_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
            } else {
                id = "dev_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
            }
            localStorage.setItem("qr_attendance_device_id", id);
        }
        return id;
    }

    // 2. Real Today Index Calculation based on Date
    function calculateRealTodayIndex() {
        const now = new Date();
        const todayStr = formatDateStr(now);
        const foundIndex = daysData.findIndex(d => d.date === todayStr);

        if (foundIndex !== -1) return foundIndex;
        if (todayStr < config.startDate) return 0;
        if (todayStr > config.endDate) return 5;
        return 0;
    }

    function getRequestedDayIndex(realIndex) {
        const paramDay = parseInt(urlParams.get("day"), 10);
        if (!isNaN(paramDay) && paramDay >= 1 && paramDay <= 6) {
            return paramDay - 1;
        }
        return realIndex;
    }

    function formatDateStr(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // 3. Render Day UI & Theme Block Colors
    function renderDayUI(index) {
        const dayData = daysData[index];

        document.documentElement.style.setProperty('--day-bg', dayData.bgColor);
        document.documentElement.style.setProperty('--day-accent', dayData.accentColor);
        document.documentElement.style.setProperty('--day-secondary', dayData.secondaryBg);

        badgeElement.textContent = dayData.badge;
        iconElement.textContent = dayData.icon;
        titleElement.textContent = dayData.title;

        renderStepper(index);

        scheduleListElement.innerHTML = dayData.highlights.map(item => `
            <li class="schedule-item">
                <span class="schedule-bullet"></span>
                <span>${item}</span>
            </li>
        `).join("");

        oneTapBtnText.textContent = `MARK DAY ${dayData.day} ATTENDANCE →`;
    }

    // 4. Render Stepper Timeline Bar
    function renderStepper(activeIndex) {
        stepperStepsElement.innerHTML = daysData.map((d, idx) => {
            let statusClass = "";
            let isFutureLocked = idx > realTodayIndex && !isPreviewMode;

            if (idx === activeIndex) statusClass = "active";
            else if (idx < activeIndex) statusClass = "completed";
            if (isFutureLocked) statusClass += " locked";

            const labelText = isFutureLocked ? `🔒 D${d.day}` : `D${d.day}`;

            return `
                <button class="step-item ${statusClass}" data-day-idx="${idx}" title="${isFutureLocked ? `Explore Day ${d.day} Schedule (Attendance Locked)` : `View Day ${d.day}`}">
                    <span class="step-label">${labelText}</span>
                </button>
            `;
        }).join("");

        const stepItems = stepperStepsElement.querySelectorAll(".step-item");
        stepItems.forEach(item => {
            item.addEventListener("click", () => {
                const targetIdx = parseInt(item.dataset.dayIdx, 10);
                selectedDayIndex = targetIdx;
                renderDayUI(targetIdx);
                checkUserAttendanceState();
            });
        });
    }

    // 5. User Attendance & Day Attendance Barrier Check
    async function checkUserAttendanceState() {
        const dayNumber = selectedDayIndex + 1;
        const dayData = daysData[selectedDayIndex];

        // FUTURE DAY ATTENDANCE LOCKED BARRIER
        if (selectedDayIndex > realTodayIndex && !isPreviewMode) {
            showCard(dayLockedCard);
            lockedDayTitle.textContent = `🔒 Day ${dayNumber} Attendance Locked`;
            lockedDayDesc.textContent = `Attendance for Day ${dayNumber} opens on ${dayData.displayDate}, 2026. You can explore today's schedule above, but check-in is disabled until the scheduled date.`;
            lockedCtaBtnText.textContent = `ATTENDANCE OPENS ON ${dayData.displayDate.toUpperCase()} 🔒`;
            return;
        }

        const cachedPhone = localStorage.getItem("qr_user_phone");
        const cachedName = localStorage.getItem("qr_user_name");
        const cachedBranch = localStorage.getItem("qr_user_branch");

        // Local Storage Check for same day
        const dayAttendanceKey = `qr_attended_day_${dayNumber}`;
        if (localStorage.getItem(dayAttendanceKey) === "true") {
            showCard(alreadySubmittedCard);
            alreadySubmittedDesc.textContent = `You have already logged your Day ${dayNumber} attendance!`;
            return;
        }

        // Google Apps Script API Check
        if (config.googleScriptUrl && cachedPhone) {
            try {
                const checkUrl = `${config.googleScriptUrl}?action=check&phone=${encodeURIComponent(cachedPhone)}&day=${dayNumber}&deviceId=${encodeURIComponent(deviceId)}`;
                const res = await fetch(checkUrl);
                const data = await res.json();

                if (data.status === "ALREADY_SUBMITTED") {
                    localStorage.setItem(dayAttendanceKey, "true");
                    showCard(alreadySubmittedCard);
                    alreadySubmittedDesc.textContent = `Attendance for ${data.name || 'you'} on Day ${dayNumber} is already recorded in Google Sheets.`;
                    return;
                }

                if (data.status === "DEVICE_MISMATCH") {
                    showCard(deviceMismatchCard);
                    return;
                }

                if (data.status === "READY_ONE_TAP") {
                    userNameGreeting.textContent = `Welcome back, ${data.name || cachedName}!`;
                    userMetaDetails.textContent = `${data.branch || cachedBranch || 'Fresher'} • 🔒 Device Locked`;
                    showCard(recurringCheckInCard);
                    return;
                }

                if (data.status === "NEW_USER") {
                    showCard(registrationFormCard);
                    return;
                }
            } catch (err) {
                console.warn("Google Script API check failed, falling back to local state:", err);
            }
        }

        // Local Fallback Check
        if (cachedPhone && cachedName) {
            userNameGreeting.textContent = `Welcome back, ${cachedName}!`;
            userMetaDetails.textContent = `${cachedBranch || 'Fresher'} • 🔒 Device Locked`;
            showCard(recurringCheckInCard);
        } else {
            showCard(registrationFormCard);
        }
    }

    // Return to Today's Active Session Handler
    returnTodayBtn.addEventListener("click", () => {
        selectedDayIndex = realTodayIndex;
        renderDayUI(realTodayIndex);
        checkUserAttendanceState();
    });

    // Helper: Show specific card and hide others
    function showCard(targetCard) {
        registrationFormCard.classList.add("hidden");
        recurringCheckInCard.classList.add("hidden");
        alreadySubmittedCard.classList.add("hidden");
        deviceMismatchCard.classList.add("hidden");
        dayLockedCard.classList.add("hidden");

        if (targetCard) {
            targetCard.classList.remove("hidden");
        }
    }

    // 6. Registration Form Submission
    regForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = regNameInput.value.trim();
        const phone = regPhoneInput.value.trim();
        const email = regEmailInput.value.trim();
        const branch = regBranchInput.value;
        const dayNumber = selectedDayIndex + 1;

        if (!name || !phone || !email || !branch) {
            alert("Please fill out all fields.");
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        localStorage.setItem("qr_user_phone", phone);
        localStorage.setItem("qr_user_name", name);
        localStorage.setItem("qr_user_email", email);
        localStorage.setItem("qr_user_branch", branch);

        showOverlay("Registering & Logging Attendance...", "Connecting to Google Sheets");

        if (config.googleScriptUrl) {
            try {
                const payload = {
                    action: "register",
                    name: name,
                    phone: phone,
                    email: email,
                    branch: branch,
                    deviceId: deviceId,
                    day: dayNumber
                };

                await fetch(config.googleScriptUrl, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error("Error pushing to Google Script:", err);
            }
        }

        localStorage.setItem(`qr_attended_day_${dayNumber}`, "true");

        setTimeout(() => {
            hideOverlay();
            showCard(alreadySubmittedCard);
            alreadySubmittedDesc.textContent = `Registration complete! Your Day ${dayNumber} attendance has been logged.`;
        }, 1200);
    });

    // 7. 1-Tap Attendance Submission
    oneTapAttendBtn.addEventListener("click", async () => {
        const phone = localStorage.getItem("qr_user_phone");
        const dayNumber = selectedDayIndex + 1;

        if (!phone) {
            showCard(registrationFormCard);
            return;
        }

        showOverlay(`Logging Day ${dayNumber} Attendance...`, "Verifying Device & Updating Google Sheet");

        if (config.googleScriptUrl) {
            try {
                const payload = {
                    action: "attend",
                    phone: phone,
                    deviceId: deviceId,
                    day: dayNumber
                };

                await fetch(config.googleScriptUrl, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error("Error submitting 1-tap attendance:", err);
            }
        }

        localStorage.setItem(`qr_attended_day_${dayNumber}`, "true");

        setTimeout(() => {
            hideOverlay();
            showCard(alreadySubmittedCard);
            alreadySubmittedDesc.textContent = `Success! Your Day ${dayNumber} attendance has been marked.`;
        }, 1200);
    });

    function showOverlay(title, subtitle) {
        redirectStatusText.textContent = title;
        redirectStatusSubtext.textContent = subtitle;
        redirectOverlay.classList.add("active");
    }

    function hideOverlay() {
        redirectOverlay.classList.remove("active");
    }
});
