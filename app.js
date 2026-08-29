// Dynamic 6-Day Attendance & Fresher Warm-Up Logic (Blocky Vibrant Theme)

document.addEventListener("DOMContentLoaded", () => {
    const config = window.CONFIG;
    const daysData = window.DAYS_DATA;

    // Elements
    const badgeElement = document.getElementById("dayBadge");
    const stepperStepsElement = document.getElementById("stepperSteps");
    const iconElement = document.getElementById("heroIcon");
    const titleElement = document.getElementById("heroTitle");
    const quoteElement = document.getElementById("heroQuote");
    const scheduleListElement = document.getElementById("scheduleList");
    const energizerChipsElement = document.getElementById("energizerChips");
    const ctaButton = document.getElementById("ctaButton");
    const redirectOverlay = document.getElementById("redirectOverlay");

    let currentDayIndex = calculateActiveDayIndex();
    renderDayUI(currentDayIndex);

    // Calculate Active Day index (0 to 5)
    function calculateActiveDayIndex() {
        // 1. Check URL param '?day=X'
        const urlParams = new URLSearchParams(window.location.search);
        const paramDay = parseInt(urlParams.get("day"), 10);
        if (!isNaN(paramDay) && paramDay >= 1 && paramDay <= 6) {
            return paramDay - 1;
        }

        // 2. Calculate based on current date
        const now = new Date();
        const todayStr = formatDateStr(now);

        const foundIndex = daysData.findIndex(d => d.date === todayStr);
        if (foundIndex !== -1) {
            return foundIndex;
        }

        if (todayStr < config.startDate) return 0;
        if (todayStr > config.endDate) return 5;

        return 0;
    }

    function formatDateStr(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Render UI for specific day index (0 to 5)
    function renderDayUI(index) {
        const dayData = daysData[index];

        // Dynamic CSS Block Colors
        document.documentElement.style.setProperty('--day-bg', dayData.bgColor);
        document.documentElement.style.setProperty('--day-accent', dayData.accentColor);
        document.documentElement.style.setProperty('--day-secondary', dayData.secondaryBg);

        // Header & Hero Elements
        badgeElement.textContent = dayData.badge;
        iconElement.textContent = dayData.icon;
        titleElement.textContent = dayData.title;
        quoteElement.textContent = `"${dayData.quote}"`;

        // Render Stepper Bar
        renderStepper(index);

        // Schedule Highlights
        scheduleListElement.innerHTML = dayData.highlights.map(item => `
            <li class="schedule-item">
                <span class="schedule-bullet"></span>
                <span>${item}</span>
            </li>
        `).join("");

        // Energizer Vibe Chips
        energizerChipsElement.innerHTML = dayData.energizers.map((energizer, i) => `
            <button class="chip-btn ${i === 0 ? 'selected' : ''}" data-index="${i}">
                ${energizer}
            </button>
        `).join("");

        // Chip click listener
        const chips = energizerChipsElement.querySelectorAll(".chip-btn");
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                chips.forEach(c => c.classList.remove("selected"));
                chip.classList.add("selected");
            });
        });

        // CTA Button Text and Link Target
        ctaButton.innerHTML = `
            <span>${dayData.ctaText}</span>
        `;
        ctaButton.dataset.targetUrl = dayData.tallyUrl || config.defaultTallyUrl;
    }

    // Render Stepper Visual Pills
    function renderStepper(activeIndex) {
        stepperStepsElement.innerHTML = daysData.map((d, idx) => {
            let statusClass = "";
            if (idx === activeIndex) statusClass = "active";
            else if (idx < activeIndex) statusClass = "completed";

            return `
                <button class="step-item ${statusClass}" data-day-idx="${idx}" title="Preview Day ${d.day}">
                    <span class="step-label">D${d.day}</span>
                </button>
            `;
        }).join("");

        // Add event listener to allow manual day preview on pill click
        const stepItems = stepperStepsElement.querySelectorAll(".step-item");
        stepItems.forEach(item => {
            item.addEventListener("click", () => {
                const targetIdx = parseInt(item.dataset.dayIdx, 10);
                currentDayIndex = targetIdx;
                renderDayUI(targetIdx);
            });
        });
    }

    // CTA Redirection Handler
    ctaButton.addEventListener("click", (e) => {
        e.preventDefault();
        const targetUrl = ctaButton.dataset.targetUrl;

        // Activate Redirection Overlay
        redirectOverlay.classList.add("active");

        setTimeout(() => {
            window.location.href = targetUrl;
        }, 1100);
    });
});
