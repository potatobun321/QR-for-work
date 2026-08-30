/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: 6-DAY SMART ATTENDANCE & DEVICE LOCKING SYSTEM
 * ==============================================================================
 * 
 * CORE FEATURES:
 * 1. setupSheet()  : Automatically sets up headers, column width, and formatting on tab "Attendance".
 * 2. flushSheet()  : Wipes all student entries (clears row 2 onwards) to start completely fresh!
 * 3. doGet / doPost: Serves REST API for check-in, registration, and attendance logging.
 * 4. Device Locking: Binds Phone Number to unique Device ID to prevent proxy submissions.
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Replace EVERYTHING in Code.gs with this code.
 * 3. Select 'setupSheet' in the top dropdown and click 'Run'.
 * 4. Click 'Deploy' -> 'Manage deployments' -> Pencil (Edit) -> Version: New Version -> 'Deploy'.
 */

// 1. ONE-CLICK SHEET SETUP & FORMATTER
function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet(); // Formats whichever tab is currently open/active!

    try {
        sheet.setName("Attendance");
    } catch (e) {
        // Tab name is already "Attendance"
    }

    // 12 Master Columns
    var headers = [
        "Timestamp",
        "Phone Number",
        "Full Name",
        "Email ID",
        "Branch",
        "Device ID",
        "Day 1",
        "Day 2",
        "Day 3",
        "Day 4",
        "Day 5",
        "Day 6"
    ];

    // Write Headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format Header Styling (Dark Slate Header)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0F172A"); // Dark Slate
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontSize(11);
    sheet.setRowHeight(1, 36);
    headerRange.setHorizontalAlignment("center");

    // Freeze Header Row & Format Phone Column as Plain Text
    sheet.setFrozenRows(1);
    sheet.getRange("B:B").setNumberFormat("@");

    Logger.log("✅ Attendance sheet setup completed successfully on tab: " + sheet.getName());
}

// 2. ONE-CLICK DATA FLUSH / WIPER (Clears all student rows below header)
function flushSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance") || ss.getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow > 1) {
        // Clear contents from Row 2 to lastRow
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        Logger.log("🧹 Flushed " + (lastRow - 1) + " attendance entries from Google Sheet!");
    } else {
        Logger.log("ℹ️ Sheet is already clean. No entries to flush.");
    }
}

// 3. GET REST API: HANDLES CHECK, REGISTER, ATTEND, SETUP & FLUSH
function doGet(e) {
    try {
        var params = e ? e.parameter : {};
        var action = params.action;
        var phone = sanitizePhone(params.phone);
        var day = parseInt(params.day || "1", 10);
        var deviceId = (params.deviceId || "").trim();

        // Admin Action A: Remote Sheet Setup
        if (action === "setup") {
            setupSheet();
            return createJsonResponse({ status: "SUCCESS", message: "Sheet setup completed!" });
        }

        // Admin Action B: Remote Sheet Data Flush
        if (action === "flush") {
            flushSheet();
            return createJsonResponse({ status: "SUCCESS", message: "All attendance records flushed!" });
        }

        var sheet = getAttendanceSheet();
        var data = sheet.getDataRange().getValues();

        // Action 1: Register New User (Day 1 or Late Joiners)
        if (action === "register") {
            var name = (params.name || "").trim();
            var email = (params.email || "").trim();
            var branch = (params.branch || "").trim();

            if (!phone || !name) {
                return createJsonResponse({ status: "ERROR", message: "Name and Phone are required." });
            }

            var existingRow = findUserRowByPhone(data, phone);
            var dayCols = ["", "", "", "", "", ""];
            dayCols[day - 1] = "✅";

            if (existingRow === -1) {
                // New User Registration
                var newRow = [
                    new Date(),
                    "'" + phone, // Plain text phone
                    name,
                    email,
                    branch,
                    deviceId,
                    dayCols[0],
                    dayCols[1],
                    dayCols[2],
                    dayCols[3],
                    dayCols[4],
                    dayCols[5]
                ];
                sheet.appendRow(newRow);
            } else {
                // User Exists - Check Device Binding
                var registeredDeviceId = String(data[existingRow - 1][5] || "").trim();
                if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                    return createJsonResponse({ status: "DEVICE_MISMATCH", message: "Proxy attendance blocked." });
                }

                // Update details & mark Day X = ✅
                sheet.getRange(existingRow, 3).setValue(name);
                sheet.getRange(existingRow, 4).setValue(email);
                sheet.getRange(existingRow, 5).setValue(branch);
                sheet.getRange(existingRow, 6).setValue(deviceId);
                sheet.getRange(existingRow, 5 + day).setValue("✅");
            }

            return createJsonResponse({ status: "SUCCESS", message: "Registration & Attendance logged!" });
        }

        // Action 2: Mark 1-Tap Attendance (Returning Device)
        if (action === "attend") {
            var userRowIndex = findUserRowByPhone(data, phone);

            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER", message: "User not registered yet." });
            }

            var registeredDeviceId = String(data[userRowIndex - 1][5] || "").trim();

            // ANTI-PROXY DEVICE CHECK
            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({ status: "DEVICE_MISMATCH", message: "Proxy attendance blocked!" });
            }

            // Mark Day X Column = ✅ (Day 1 = Col G / Column Index 7)
            var targetCol = 6 + day;
            sheet.getRange(userRowIndex, targetCol).setValue("✅");

            return createJsonResponse({ status: "SUCCESS", message: "Attendance marked successfully!" });
        }

        // Action 3: Check Registration & Device Status
        if (action === "check" && phone) {
            var userRowIndex = findUserRowByPhone(data, phone);

            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER" });
            }

            var userData = data[userRowIndex - 1];
            var registeredName = userData[2];
            var registeredEmail = userData[3];
            var registeredBranch = userData[4];
            var registeredDeviceId = String(userData[5] || "").trim();

            // ANTI-PROXY CHECK
            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({
                    status: "DEVICE_MISMATCH",
                    name: registeredName,
                    message: "Phone number is locked to another smartphone device."
                });
            }

            var dayColIndex = 5 + day; // Day 1 = Col G (Index 6)
            var dayValue = String(userData[dayColIndex] || "").trim();

            if (dayValue === "✅" || dayValue === "PRESENT" || dayValue === "TRUE") {
                return createJsonResponse({
                    status: "ALREADY_SUBMITTED",
                    name: registeredName,
                    day: day
                });
            }

            return createJsonResponse({
                status: "READY_ONE_TAP",
                name: registeredName,
                email: registeredEmail,
                branch: registeredBranch,
                day: day
            });
        }

        return createJsonResponse({ status: "READY_NEW_USER" });

    } catch (err) {
        return createJsonResponse({ status: "ERROR", message: err.toString() });
    }
}

// 4. POST REST API FALLBACK
function doPost(e) {
    return doGet(e);
}

// HELPER: FIND USER ROW INDEX BY PHONE
function findUserRowByPhone(data, phone) {
    if (!phone) return -1;
    var targetPhone = phone.replace(/['"'\s]/g, "");

    for (var i = 1; i < data.length; i++) {
        var sheetPhone = String(data[i][1] || "").trim().replace(/['"'\s]/g, "");
        if (sheetPhone === targetPhone) {
            return i + 1; // 1-indexed row index
        }
    }
    return -1;
}

// HELPER: SANITIZE PHONE
function sanitizePhone(phoneStr) {
    return String(phoneStr || "").trim().replace(/[^0-9]/g, "");
}

// HELPER: GET OR CREATE ATTENDANCE SHEET
function getAttendanceSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.getActiveSheet();
        try {
            sheet.setName("Attendance");
        } catch (e) {}
    }
    return sheet;
}

// HELPER: CORS JSON RESPONSE
function createJsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
