/**
 * GOOGLE APPS SCRIPT: 6-DAY SMART ATTENDANCE & DEVICE LOCKING SYSTEM
 * 
 * TARGET SPREADSHEET ID: 1LcB4PB6Cus1uHnlezYYKzx5UVFkVFGLaBFRdZ9KOpc0
 */

var SPREADSHEET_ID = "1LcB4PB6Cus1uHnlezYYKzx5UVFkVFGLaBFRdZ9KOpc0";

// HELPER: GET SPREADSHEET BY ID OR ACTIVE
function getSpreadsheet() {
    try {
        return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
        return SpreadsheetApp.getActiveSpreadsheet();
    }
}

// 1. ONE-CLICK SHEET SETUP & FORMATTER
function setupSheet() {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("Attendance") || ss.getActiveSheet();

    try {
        sheet.setName("Attendance");
    } catch (e) {}

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

    // Insert Techy Checkboxes in Columns G to L (Day 1 - Day 6)
    var dayRange = sheet.getRange("G2:L1000");
    try {
        dayRange.insertCheckboxes();
    } catch(e) {}

    Logger.log("✅ Attendance sheet setup completed with Checkboxes on tab: " + sheet.getName());
}

// 2. ONE-CLICK DATA FLUSH / WIPER (Clears all student rows below header)
function flushSheet() {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("Attendance") || ss.getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        try {
            sheet.getRange("G2:L1000").insertCheckboxes();
        } catch(e) {}
        Logger.log("🧹 Flushed attendance entries from Google Sheet!");
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

        if (action === "setup") {
            setupSheet();
            return createJsonResponse({ status: "SUCCESS", message: "Sheet setup completed with checkboxes!" });
        }

        if (action === "flush") {
            flushSheet();
            return createJsonResponse({ status: "SUCCESS", message: "All attendance records flushed!" });
        }

        var sheet = getAttendanceSheet();
        var data = sheet.getDataRange().getValues();

        if (action === "register") {
            var name = (params.name || "").trim();
            var email = (params.email || "").trim();
            var branch = (params.branch || "").trim();

            if (!phone || !name) {
                return createJsonResponse({ status: "ERROR", message: "Name and Phone are required." });
            }

            var existingRow = findUserRowByPhone(data, phone);
            var dayCols = [false, false, false, false, false, false];
            dayCols[day - 1] = true;

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
                var registeredDeviceId = String(data[existingRow - 1][5] || "").trim();
                if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                    return createJsonResponse({ status: "DEVICE_MISMATCH", message: "Proxy attendance blocked." });
                }

                sheet.getRange(existingRow, 3).setValue(name);
                sheet.getRange(existingRow, 4).setValue(email);
                sheet.getRange(existingRow, 5).setValue(branch);
                sheet.getRange(existingRow, 6).setValue(deviceId);
                sheet.getRange(existingRow, 6 + day).setValue(true); // Col 7 = Day 1
            }

            return createJsonResponse({ status: "SUCCESS", message: "Registration & Attendance logged!" });
        }

        if (action === "attend") {
            var userRowIndex = findUserRowByPhone(data, phone);

            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER", message: "User not registered yet." });
            }

            var registeredDeviceId = String(data[userRowIndex - 1][5] || "").trim();

            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({ status: "DEVICE_MISMATCH", message: "Proxy attendance blocked!" });
            }

            var targetCol = 6 + day; // Col 7 = Day 1
            sheet.getRange(userRowIndex, targetCol).setValue(true);

            return createJsonResponse({ status: "SUCCESS", message: "Attendance marked successfully!" });
        }

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

            if (deviceId && registeredDeviceId && deviceId !== registeredDeviceId) {
                return createJsonResponse({
                    status: "DEVICE_MISMATCH",
                    name: registeredName,
                    message: "Phone number is locked to another smartphone device."
                });
            }

            var dayColIndex = 5 + day;
            var dayValue = userData[dayColIndex];

            if (dayValue === true || String(dayValue).trim().toUpperCase() === "TRUE" || String(dayValue).trim() === "✅") {
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

function doPost(e) {
    return doGet(e);
}

function findUserRowByPhone(data, phone) {
    if (!phone) return -1;
    var targetPhone = phone.replace(/['"'\s]/g, "");

    for (var i = 1; i < data.length; i++) {
        var sheetPhone = String(data[i][1] || "").trim().replace(/['"'\s]/g, "");
        if (sheetPhone === targetPhone) {
            return i + 1;
        }
    }
    return -1;
}

function sanitizePhone(phoneStr) {
    return String(phoneStr || "").trim().replace(/[^0-9]/g, "");
}

function getAttendanceSheet() {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.getActiveSheet();
        try {
            sheet.setName("Attendance");
        } catch (e) {}
    }
    return sheet;
}

function createJsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
