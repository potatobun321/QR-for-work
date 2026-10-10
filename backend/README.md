# Backend Setup Guide (Google Apps Script)

This project uses Google Sheets as a free, scalable database via Google Apps Script.

---

## Setup Instructions

### Step 1: Create a Google Sheet
1. Open Google Sheets (sheets.new) and create a new blank spreadsheet.
2. Name the spreadsheet (for example, "Event Attendance Database").

### Step 2: Add the Backend Code
1. In the Google Sheet menu, click **Extensions** -> **Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Open `backend/Code.gs`, copy the entire contents, and paste them into the Apps Script editor.
4. Save the file (Ctrl + S or click the Save icon).

### Step 3: Run Initial Setup
1. In the function dropdown on the toolbar, select `setupSheet`.
2. Click **Run**.
3. Authorize the script when prompted by Google:
   - Click **Review permissions** -> select your Google account.
   - Click **Advanced** -> click **Go to Untitled project (unsafe)** -> click **Allow**.
4. Check your Google Sheet tab. The sheet will now display styled headers, a frozen top row, and attendance checkboxes.

### Step 4: Deploy as a Web App
1. In Apps Script, click the blue **Deploy** button (top right) -> **New deployment**.
2. Click the gear icon (**Select type**) -> choose **Web app**.
3. Set the deployment fields:
   - **Description:** `Production v1`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone` (Required so frontend form submissions can reach the sheet)
4. Click **Deploy**.
5. Copy the generated **Web App URL** (format: `https://script.google.com/macros/s/.../exec`).

### Step 5: Connect to the Frontend
Paste the Web App URL into either:
- The in-app **Settings and Theme** modal (located in the webpage footer), or
- `config.js` as the value for `defaultApiUrl`.

---

## API Capabilities

The backend handles the following request types:
- `POST` / `GET` with `action="register"`: Creates or updates participant records.
- `POST` / `GET` with `action="attend"`: Toggles daily attendance checkboxes.
- `POST` / `GET` with `action="check"`: Validates whether a phone number or device is already registered.
- `GET` with `action="setup"`: Initializes sheet columns and formatting.
- `GET` with `action="flush"`: Clears data rows while preserving headers.
