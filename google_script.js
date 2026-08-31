/**
 * ==============================================================================
 * 6-DAY SIP ORIENTATION QR ATTENDANCE SYSTEM - GOOGLE APPS SCRIPT BACKEND
 * ==============================================================================
 * File: Code.gs / google_script.js
 * Target Sheet: "Attendance"
 * ==============================================================================
 */

function getAttendanceSheet(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.getActiveSheet();
        try { sheet.setName("Attendance"); } catch (e) {}
    }
    return sheet;
}

function unhideAllRows(sheet) {
    try {
        var maxRows = sheet.getMaxRows();
        if (maxRows > 0) {
            sheet.showRows(1, maxRows);
        }
        var filter = sheet.getFilter();
        if (filter) {
            filter.remove();
        }
    } catch(e) {}
}

function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getAttendanceSheet(ss);

    // Unhide any hidden rows
    unhideAllRows(sheet);

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
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontSize(11);
    sheet.setRowHeight(1, 36);
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Format Phone Number column as explicit text (@) to preserve leading zeros
    sheet.getRange("B:B").setNumberFormat("@");
}

function flushSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getAttendanceSheet(ss);
    unhideAllRows(sheet);
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        try {
            sheet.getRange(2, 7, lastRow - 1, 6).removeCheckboxes();
        } catch(e) {}
    }
}

function getFirstEmptyRow(sheet) {
    var maxRows = sheet.getMaxRows();
    var checkRows = Math.min(maxRows, 1000);
    if (checkRows <= 1) return 2;
    var data = sheet.getRange(1, 1, checkRows, 2).getValues();
    for (var i = 1; i < data.length; i++) {
        var timestampCell = String(data[i][0] || "").trim();
        var phoneCell = String(data[i][1] || "").trim();
        if (!timestampCell && !phoneCell) {
            return i + 1; // 1-indexed row
        }
    }
    return maxRows + 1;
}

function doGet(e) {
    try {
        var params = e ? e.parameter : {};
        var action = params.action;
        var phone = String(params.phone || "").trim().replace(/[^0-9]/g, "");
        var day = parseInt(params.day || "1", 10);
        var deviceId = (params.deviceId || "").trim();

        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = getAttendanceSheet(ss);

        if (action === "setup") { 
            setupSheet(); 
            return createJsonResponse({ status: "SUCCESS", message: "Sheet formatted successfully." }); 
        }
        
        if (action === "flush") { 
            flushSheet(); 
            return createJsonResponse({ status: "SUCCESS", message: "Sheet cleared successfully." }); 
        }

        unhideAllRows(sheet);
        var data = sheet.getDataRange().getValues();

        // 1. REGISTER NEW STUDENT OR UPDATE PROFILE
        if (action === "register") {
            var name = (params.name || "").trim();
            var email = (params.email || "").trim();
            var branch = (params.branch || "").trim();
            var existingRow = findUserRowByPhone(data, phone);
            
            var dayCols = [false, false, false, false, false, false];
            if (day >= 1 && day <= 6) {
                dayCols[day - 1] = true;
            }

            if (existingRow === -1) {
                // Find actual first empty row (Row 2, Row 3...) ignoring empty checkboxes
                var targetRow = getFirstEmptyRow(sheet);
                
                // Write data to target row
                var newRowData = [
                    new Date(), 
                    "'" + phone, 
                    name, 
                    email, 
                    branch, 
                    deviceId, 
                    dayCols[0], dayCols[1], dayCols[2], dayCols[3], dayCols[4], dayCols[5]
                ];
                
                sheet.getRange(targetRow, 1, 1, newRowData.length).setValues([newRowData]);
                
                // Ensure checkboxes exist on columns G to L for this row
                try {
                    sheet.getRange(targetRow, 7, 1, 6).insertCheckboxes();
                } catch(e) {}
            } else {
                // Existing User Record - Anti-Proxy Device Check
                var regDevId = String(data[existingRow - 1][5] || "").trim();
                if (deviceId && regDevId && deviceId !== regDevId) {
                    return createJsonResponse({ 
                        status: "DEVICE_MISMATCH", 
                        message: "Device locking security alert: This phone number is already registered to a different device." 
                    });
                }
                
                // Update profile details & set device ID if not previously set
                sheet.getRange(existingRow, 3).setValue(name);
                sheet.getRange(existingRow, 4).setValue(email);
                sheet.getRange(existingRow, 5).setValue(branch);
                if (deviceId) {
                    sheet.getRange(existingRow, 6).setValue(deviceId);
                }
                sheet.getRange(existingRow, 6 + day).setValue(true);
            }
            return createJsonResponse({ status: "SUCCESS", message: "Registration & attendance recorded." });
        }

        // 2. 1-TAP RECURRING ATTENDANCE MARKING
        if (action === "attend") {
            var userRowIndex = findUserRowByPhone(data, phone);
            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER", message: "User not found. Registration required." });
            }
            
            var regDevId = String(data[userRowIndex - 1][5] || "").trim();
            if (deviceId && regDevId && deviceId !== regDevId) {
                return createJsonResponse({ 
                    status: "DEVICE_MISMATCH", 
                    message: "Device mismatch! Proxy check-in blocked." 
                });
            }
            
            sheet.getRange(userRowIndex, 6 + day).setValue(true);
            return createJsonResponse({ status: "SUCCESS", message: "Attendance marked successfully!" });
        }

        // 3. CHECK USER STATUS & PROXY VERIFICATION
        if (action === "check" && phone) {
            var userRowIndex = findUserRowByPhone(data, phone);
            if (userRowIndex === -1) {
                return createJsonResponse({ status: "NEW_USER" });
            }
            
            var userData = data[userRowIndex - 1];
            var regDevId = String(userData[5] || "").trim();
            if (deviceId && regDevId && deviceId !== regDevId) {
                return createJsonResponse({ status: "DEVICE_MISMATCH", name: userData[2] });
            }
            
            var dayVal = userData[5 + day];
            var isSubmitted = (dayVal === true || String(dayVal).trim().toUpperCase() === "TRUE");
            if (isSubmitted) {
                return createJsonResponse({ status: "ALREADY_SUBMITTED", name: userData[2] });
            }
            
            return createJsonResponse({ 
                status: "READY_ONE_TAP", 
                name: userData[2], 
                email: userData[3], 
                branch: userData[4] 
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
    var targetPhone = String(phone).replace(/['"'\s]/g, "");
    for (var i = 1; i < data.length; i++) {
        var cellPhone = String(data[i][1] || "").trim().replace(/['"'\s]/g, "");
        if (cellPhone === targetPhone) {
            return i + 1; // 1-indexed sheet row
        }
    }
    return -1;
}

function createJsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
