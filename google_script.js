/**
 * Google Apps Script - Smart 6-Day Attendance System with Device Locking
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Replace EVERYTHING in `Code.gs` with this code.
 * 3. Select `setupSheet` in the top dropdown and click 'Run'.
 * 4. Click 'Deploy' -> 'Manage deployments' -> Edit (Pencil icon) -> Version: New Version -> 'Deploy'.
 */

// 1. ONE-CLICK SHEET SETUP & FORMATTER
function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet(); // Formats active tab!
    
    try {
        sheet.setName("Attendance");
    } catch(e) {}

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

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0F172A"); // Dark Slate
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontSize(11);
    sheet.setRowHeight(1, 36);
    headerRange.setHorizontalAlignment("center");

    sheet.setFrozenRows(1);
    sheet.getRange("B:B").setNumberFormat("@");

    Logger.log("✅ Attendance sheet setup completed successfully on tab: " + sheet.getName());
}

// 2. GET API: HANDLES CHECK, REGISTER, ATTEND, & SETUP (100% Mobile GET Delivery!)
function doGet(e) {
    try {
        var params = e ? e.parameter : {};
        var action = params.action;
        var phone = (params.phone || "").trim();
        var day = parseInt(params.day || "1", 10);
        var deviceId = (params.deviceId || "").trim();

        // Action 1: Auto-Setup Sheet
        if (action === "setup") {
            setupSheet();
            return createJsonResponse({ status: "SUCCESS", message: "Sheet setup completed!" });
        }

        var sheet = getAttendanceSheet();
        var data = sheet.getDataRange().getValues();

        // Action 2: Register New User
        if (action === "register") {
            var name = (params.name || "").trim();
            var email = (params.email || "").trim();
            var branch = (params.branch || "").trim();

            if (!phone || !name) {
                return createJsonResponse({ status: "ERROR", message: "Missing required fields" });
            }

            var existingRow = -1;
            for (var i = 1; i < data.length; i++) {
                var sheetPhone = String(data[i][1]).trim().replace(/['"'\s]/g, "");
                if (sheetPhone === phone.replace(/['"'\s]/g, "")) {
                    existingRow = i + 1;
                    break;
                }
            }

            var dayCols = ["", "", "", "", "", ""];
            dayCols[day - 1] = "✅";

            if (existingRow === -1) {
                var newRow = [
                    new Date(),
                    "'" + phone,
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
                sheet.getRange(existingRow, 3).setValue(name);
                sheet.getRange(existingRow, 4).setValue(email);
                sheet.getRange(existingRow, 5).setValue(branch);
                sheet.getRange(existingRow, 6).setValue(deviceId);
                sheet.getRange(existingRow, 5 + day).setValue("✅");
            }

            return createJsonResponse({ status: "SUCCESS", message: "Registered & Marked!" });
        }

        // Action 3: Mark 1-Tap Attendance
        if (action === "attend") {
            var userRowIndex = -1;
            var registeredDeviceId = "";

            for (var i = 1; i < data.length; i++) {
                var sheetPhone = String(data[i][1]).trim().replace(/['"'\s]/g, "");
                if (sheetPhone === phone.replace(/['"'\s]/g, "")) {
                    userRowIndex = i + 1;
                    registeredDeviceId = String(data[i][5] || "").trim();
                    break;
                }
            }

            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER" });
            }

            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({ status: "DEVICE_MISMATCH" });
            }

            var targetCol = 6 + day;
            sheet.getRange(userRowIndex, targetCol).setValue("✅");

            return createJsonResponse({ status: "SUCCESS", message: "Attendance Marked!" });
        }

        // Action 4: Check Registration & Day Status
        if (action === "check" && phone) {
            var userData = null;
            for (var i = 1; i < data.length; i++) {
                var sheetPhone = String(data[i][1]).trim().replace(/['"'\s]/g, "");
                if (sheetPhone === phone.replace(/['"'\s]/g, "")) {
                    userData = data[i];
                    break;
                }
            }

            if (!userData) {
                return createJsonResponse({ status: "NEW_USER" });
            }

            var registeredName = userData[2];
            var registeredEmail = userData[3];
            var registeredBranch = userData[4];
            var registeredDeviceId = String(userData[5] || "").trim();

            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({
                    status: "DEVICE_MISMATCH",
                    name: registeredName,
                    message: "Device mismatch locked."
                });
            }

            var dayColIndex = 5 + day; // Day 1 = index 6 (Col G)
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

// 3. POST API FALLBACK
function doPost(e) {
    return doGet(e);
}

// HELPER: GET SHEET
function getAttendanceSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.getActiveSheet();
        try { sheet.setName("Attendance"); } catch(e) {}
    }
    return sheet;
}

// HELPER: CORS JSON RESPONSE
function createJsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
