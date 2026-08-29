/**
 * Google Apps Script - Smart 6-Day Attendance System with Device Locking
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Paste this entire code into `Code.gs`.
 * 3. Run `setupSheet()` ONCE to automatically create & format headers in your sheet!
 * 4. Click 'Deploy' -> 'New deployment' -> Select type: 'Web app'.
 * 5. Set 'Execute as': 'Me', Set 'Who has access': 'Anyone'.
 * 6. Copy the Web App URL and paste it into `config.js` (`googleScriptUrl`).
 */

// 1. ONE-CLICK SHEET SETUP & FORMATTER
function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.insertSheet("Attendance");
    }

    // Define Master Headers
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
        "Day 6",
        "Last Vibe"
    ];

    // Set Header Values
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format Header Styling (Neo-brutalist / Clean Dark Header)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0F172A"); // Dark Slate
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontSize(11);
    headerRange.setHeight(36);
    headerRange.setHorizontalAlignment("center");

    // Freeze Header Row
    sheet.setFrozenRows(1);

    // Format Phone Column as Plain Text
    sheet.getRange("B:B").setNumberFormat("@");

    Logger.log("✅ Attendance sheet setup completed successfully!");
}

// 2. GET API: CHECK REGISTRATION & ATTENDANCE STATUS
function doGet(e) {
    try {
        var params = e.parameter;
        var action = params.action;
        var phone = (params.phone || "").trim();
        var day = parseInt(params.day || "1", 10);
        var deviceId = (params.deviceId || "").trim();

        if (action !== "check" || !phone) {
            return createJsonResponse({ status: "ERROR", message: "Invalid request parameters" });
        }

        var sheet = getAttendanceSheet();
        var data = sheet.getDataRange().getValues();

        // Find user by Phone Number (Column B, 0-indexed index 1)
        var userRowIndex = -1;
        var userData = null;

        for (var i = 1; i < data.length; i++) {
            var sheetPhone = String(data[i][1]).trim();
            if (sheetPhone === phone) {
                userRowIndex = i + 1; // 1-indexed row number
                userData = data[i];
                break;
            }
        }

        // Case 1: Phone not registered in database
        if (!userData) {
            return createJsonResponse({ status: "NEW_USER" });
        }

        var registeredName = userData[2];
        var registeredEmail = userData[3];
        var registeredBranch = userData[4];
        var registeredDeviceId = String(userData[5] || "").trim();

        // Case 2: Device ID Mismatch (Proxy Attendance Block)
        if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
            return createJsonResponse({
                status: "DEVICE_MISMATCH",
                name: registeredName,
                message: "This phone number is locked to a different smartphone device."
            });
        }

        // Day Column Index (Day 1 = Col G = index 6, Day 2 = Col H = index 7, etc.)
        var dayColIndex = 5 + day; // Day 1 = index 6
        var dayValue = String(userData[dayColIndex] || "").trim();

        // Case 3: Already Submitted Today
        if (dayValue === "✅" || dayValue === "PRESENT" || dayValue === "TRUE") {
            return createJsonResponse({
                status: "ALREADY_SUBMITTED",
                name: registeredName,
                day: day
            });
        }

        // Case 4: Registered & Ready for 1-Tap Attendance
        return createJsonResponse({
            status: "READY_ONE_TAP",
            name: registeredName,
            email: registeredEmail,
            branch: registeredBranch,
            day: day
        });

    } catch (err) {
        return createJsonResponse({ status: "ERROR", message: err.toString() });
    }
}

// 3. POST API: REGISTER NEW USER OR MARK DAILY ATTENDANCE
function doPost(e) {
    try {
        var postData = {};
        if (e.postData && e.postData.contents) {
            postData = JSON.parse(e.postData.contents);
        } else {
            postData = e.parameter;
        }

        var action = postData.action;
        var phone = (postData.phone || "").trim();
        var day = parseInt(postData.day || "1", 10);
        var deviceId = (postData.deviceId || "").trim();

        var sheet = getAttendanceSheet();
        var data = sheet.getDataRange().getValues();

        // Action A: Register New User (Day 1 or Late Joiner)
        if (action === "register") {
            var name = (postData.name || "").trim();
            var email = (postData.email || "").trim();
            var branch = (postData.branch || "").trim();
            var vibe = postData.vibe || "Ready";

            if (!phone || !name || !email || !branch) {
                return createJsonResponse({ status: "ERROR", message: "Missing required fields" });
            }

            // Check if phone already exists
            var existingRow = -1;
            for (var i = 1; i < data.length; i++) {
                if (String(data[i][1]).trim() === phone) {
                    existingRow = i + 1;
                    break;
                }
            }

            var dayCols = ["", "", "", "", "", ""];
            dayCols[day - 1] = "✅";

            if (existingRow === -1) {
                // Append new row
                var newRow = [
                    new Date(),
                    "'" + phone, // Force text
                    name,
                    email,
                    branch,
                    deviceId,
                    dayCols[0],
                    dayCols[1],
                    dayCols[2],
                    dayCols[3],
                    dayCols[4],
                    dayCols[5],
                    vibe
                ];
                sheet.appendRow(newRow);
            } else {
                // Update existing row registration details & lock device ID
                sheet.getRange(existingRow, 3).setValue(name);
                sheet.getRange(existingRow, 4).setValue(email);
                sheet.getRange(existingRow, 5).setValue(branch);
                sheet.getRange(existingRow, 6).setValue(deviceId);
                sheet.getRange(existingRow, 5 + day + 1).setValue("✅");
                sheet.getRange(existingRow, 13).setValue(vibe);
            }

            return createJsonResponse({ status: "SUCCESS", message: "Registration & Attendance completed!" });
        }

        // Action B: Mark 1-Tap Attendance (Returning User)
        if (action === "attend") {
            var vibe = postData.vibe || "Ready";

            var userRowIndex = -1;
            var registeredDeviceId = "";

            for (var i = 1; i < data.length; i++) {
                if (String(data[i][1]).trim() === phone) {
                    userRowIndex = i + 1;
                    registeredDeviceId = String(data[i][5] || "").trim();
                    break;
                }
            }

            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER", message: "User not registered yet" });
            }

            // Verify Device ID
            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({ status: "DEVICE_MISMATCH", message: "Proxy attendance blocked!" });
            }

            // Update Day Column (Day 1 = Col G = 7th column in Sheet)
            var targetCol = 6 + day;
            sheet.getRange(userRowIndex, targetCol).setValue("✅");
            sheet.getRange(userRowIndex, 13).setValue(vibe);

            return createJsonResponse({ status: "SUCCESS", message: "Attendance marked successfully!" });
        }

        return createJsonResponse({ status: "ERROR", message: "Unknown action" });

    } catch (err) {
        return createJsonResponse({ status: "ERROR", message: err.toString() });
    }
}

// HELPER: GET SHEET
function getAttendanceSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        setupSheet();
        sheet = ss.getSheetByName("Attendance");
    }
    return sheet;
}

// HELPER: CORS JSON RESPONSE
function createJsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
