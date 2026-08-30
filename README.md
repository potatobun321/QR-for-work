# ⚡ 6-Day SIP Orientation Digital QR Attendance Portal

A mobile-first, high-contrast **Neo-Brutalist 6-Day Student Induction Program (SIP) QR Attendance System** featuring **Anti-Proxy Smartphone Device Locking** and **Google Sheets Backend Sync**.

![Live Demo Target](https://img.shields.io/badge/Live_GitHub_Pages-https%3A%2F%2Fpotatobun321.github.io%2FQR--for--work%2F-ffde59?style=for-the-badge&logo=github)

---

## 🌟 Key Features

1. **⚡ Neo-Brutalist Vibrant Aesthetic**:
   - High-contrast blocky styling with chunky 4px solid borders and hard offset box-shadows.
   - Dynamic 6-Day color themes per event date (Electric Yellow, Hot Pink, Electric Cyan, Lime Green, Bright Orange, Vibrant Violet).

2. **🔒 Anti-Proxy Smartphone Device Locking**:
   - Generates a unique UUID fingerprint (`dev_...`) stored in the student's browser `localStorage`.
   - Binds the 10-digit mobile number (Primary Key) to the device ID on Google Sheets upon Day 1 registration.
   - Blocks proxy attendance attempts from another smartphone with a **`PROXY CHECK-IN BLOCKED`** security alert.

3. **📝 1-Tap Quick Check-In (Days 2 to 6)**:
   - Returning students are greeted by name (*"Welcome back, Rahul Sharma!"*) with a single-tap button to mark daily attendance.

4. **📊 Google Sheets Backend (`google_script.js`)**:
   - Automatically structures a 12-column `Attendance` master sheet with frozen headers, formatted phone text columns, and interactive checkboxes for Days 1 through 6.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Google Sheets & Apps Script Setup

1. Open your target [Google Sheet](https://sheets.google.com).
2. Click on **Extensions** ➔ **Apps Script**.
3. Clear any existing code in `Code.gs` and paste the full contents of [google_script.js](google_script.js).
4. Click **Save** (💾).
5. Select `setupSheet` from the function dropdown at the top and click **Run**.
   - *This creates the `Attendance` sheet tab with 12 formatted master columns and Day 1–6 checkboxes.*

### 2. Deploy Web App URL

1. Click **Deploy** (top right) ➔ **New deployment**.
2. Select type: **Web app** (click cog icon next to Select type if needed).
3. Configuration:
   - **Description**: `SIP Attendance API v1`
   - **Execute as**: `Me (your_email@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**, authorize permissions when prompted, and **copy the Web App URL** (ends in `/exec`).

### 3. Connect Front-End to Google Apps Script

1. Open the live web app link: [https://potatobun321.github.io/QR-for-work/](https://potatobun321.github.io/QR-for-work/).
2. Click the **⚙️ API URL** button in the top header.
3. Paste your copied Google Apps Script Web App URL and click **SAVE API URL**.
4. Test a registration to verify entries populate live into your Google Sheet!

---

## 📁 Repository Structure

```text
├── index.html          # Neo-Brutalist HTML5 layout with device badge, stepper, and forms
├── style.css           # Neo-Brutalist CSS design system & dynamic day themes
├── app.js              # State engine, anti-proxy device locking, & API connector
├── google_script.js    # Complete Google Apps Script backend code (Code.gs)
└── README.md           # Project documentation & setup instructions
```

---

## 🎨 6-Day Theme Palette

| Day | Date | Color Accent | Hex Code |
|---|---|---|---|
| **Day 1** | Aug 31 | Electric Yellow | `#FFDE59` |
| **Day 2** | Sep 01 | Hot Pink | `#FF66C4` |
| **Day 3** | Sep 02 | Electric Cyan | `#00F0FF` |
| **Day 4** | Sep 03 | Lime Green | `#70E000` |
| **Day 5** | Sep 04 | Bright Orange | `#FF914D` |
| **Day 6** | Sep 05 | Vibrant Violet | `#B57EDC` |
