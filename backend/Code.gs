/**
 * ==============================================================================
 * QR-PORTAL-INFRA | UNIVERSAL GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Fully decoupled, self-healing backend for Event Registration, QR Attendance,
 * and Community Portals.
 *
 * FEATURES:
 * 1. Self-Healing Schema: Automatically maps incoming form payloads to Row 1 headers.
 * 2. Multi-Mode Support:
 *    - "register": Handles participant registration with deduplication by Phone or ID.
 *    - "attend": Toggles daily attendance checkboxes (Day 1..Day N) with device locking.
 *    - "check": Checks if a phone/device is already registered or checked in.
 * 3. Anti-Proxy Device Locking: Verifies Device ID against registered phone.
 * 4. Setup & Flush Tools: Built-in setupSheet() formats headers and checkboxes with 1 click.
 * ==============================================================================
 */

// Target Master Sheet Tab Name (can be overridden via query param 'sheet')
var DEFAULT_SHEET_NAME = "Registrations";

// Master Default Headers (12 Columns - adaptable to any event)
var DEFAULT_HEADERS = [
  "Timestamp",        // Col A (1) - Date & Time
  "Registration ID",  // Col B (2) - Unique Ticket / Reg ID
  "Phone Number",     // Col C (3) - Primary Key (@ format)
  "Full Name",        // Col D (4) - Participant Name
  "Email Address",    // Col E (5) - Contact Email
  "Category / Branch",// Col F (6) - Category, Track, or Department
  "Device ID",        // Col G (7) - Unique Device UUID (Anti-proxy)
  "Status",           // Col H (8) - Status / Notes
  "Day 1",            // Col I (9) - Attendance Day 1 Checkbox
  "Day 2",            // Col J (10) - Attendance Day 2 Checkbox
  "Day 3",            // Col K (11) - Attendance Day 3 Checkbox
  "Day 4"             // Col L (12) - Attendance Day 4 Checkbox
];

/**
 * Helper to get or create target worksheet tab.
 */
function getWorksheet(ss, sheetName) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = sheetName || DEFAULT_SHEET_NAME;
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.getActiveSheet();
    try { sheet.setName(name); } catch (e) {}
  }
  return sheet;
}

/**
 * Run this function in the Apps Script Editor once to format Row 1 headers.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getWorksheet(ss);
  
  sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length).setValues([DEFAULT_HEADERS]);
  var headerRange = sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0F172A");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontSize(11);
  sheet.setRowHeight(1, 38);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setFrozenRows(1);

  // Format Text columns (@) so phone numbers and IDs don't drop leading zeroes or format as scientific notation
  sheet.getRange("B:B").setNumberFormat("@");
  sheet.getRange("C:C").setNumberFormat("@");
  sheet.getRange("G:G").setNumberFormat("@");

  // Insert checkboxes for Day attendance columns
  try {
    sheet.getRange("I2:L1000").insertCheckboxes();
  } catch(e) {}

  return "Sheet initialized successfully.";
}

/**
 * Flush all data rows (keeps header row intact).
 */
function flushSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getWorksheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    try { sheet.getRange("I2:L1000").insertCheckboxes(); } catch(e) {}
  }
  return "Data rows flushed.";
}

/**
 * GET Handler (Supports API polling, webhooks, setup calls)
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * POST Handler (Supports JSON payloads and hidden iframe fallbacks)
 */
function doPost(e) {
  return handleRequest(e);
}

function normalizeKey(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Unified Request Handler
 */
function handleRequest(e) {
  try {
    var params = {};

    // 1. Query parameters
    if (e && e.parameter) {
      for (var key in e.parameter) {
        params[key] = e.parameter[key];
      }
    }

    // 2. Post body (JSON or Form URL-encoded string)
    if (e && e.postData && e.postData.contents) {
      try {
        var json = JSON.parse(e.postData.contents);
        for (var jKey in json) {
          params[jKey] = json[jKey];
        }
      } catch (jsonErr) {
        // Fallback for form-encoded submissions
        if (params.data) {
          try {
            var nested = JSON.parse(params.data);
            for (var nKey in nested) {
              params[nKey] = nested[nKey];
            }
          } catch (nestedErr) {}
        }
      }
    }

    var action = (params.action || "register").toLowerCase();
    var sheetName = params.sheet || DEFAULT_SHEET_NAME;

    if (action === "setup") {
      setupSheet();
      return createJsonResponse({ status: "SUCCESS", message: "Setup completed." });
    }

    if (action === "flush") {
      flushSheet();
      return createJsonResponse({ status: "SUCCESS", message: "Sheet data flushed." });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getWorksheet(ss, sheetName);
    var data = sheet.getDataRange().getValues();

    // ACTION: CHECK EXISTING USER OR STATUS
    if (action === "check") {
      var phone = cleanPhone(params.phone_number || params.contact_number || params.phone);
      var deviceId = String(params.device_id || "").trim();
      var rowIndex = findRowByPhone(data, phone);

      if (rowIndex === -1) {
        return createJsonResponse({ status: "NEW_USER" });
      }

      var rowData = data[rowIndex - 1];
      var registeredDevId = String(rowData[6] || "").trim(); // Col G
      if (deviceId && registeredDevId && deviceId !== registeredDevId) {
        return createJsonResponse({ 
          status: "DEVICE_MISMATCH", 
          name: rowData[3], 
          message: "This account is bound to another device." 
        });
      }

      return createJsonResponse({
        status: "EXISTS",
        registration_id: rowData[1],
        full_name: rowData[3],
        email: rowData[4],
        category: rowData[5]
      });
    }

    // ACTION: ATTEND (Daily Attendance Check-in)
    if (action === "attend") {
      var day = parseInt(params.day || "1", 10);
      var phone = cleanPhone(params.phone_number || params.contact_number || params.phone);
      var deviceId = String(params.device_id || "").trim();
      var rowIndex = findRowByPhone(data, phone);

      if (rowIndex === -1) {
        return createJsonResponse({ status: "NOT_FOUND", message: "Phone number not registered." });
      }

      var rowData = data[rowIndex - 1];
      var registeredDevId = String(rowData[6] || "").trim();
      if (deviceId && registeredDevId && deviceId !== registeredDevId) {
        return createJsonResponse({ status: "DEVICE_MISMATCH", message: "Proxy attempt blocked." });
      }

      // Column for Day N starts at column 9 (Col I)
      var targetCol = 8 + day;
      sheet.getRange(rowIndex, targetCol).setValue(true);
      return createJsonResponse({ status: "SUCCESS", message: "Attendance marked for Day " + day });
    }

    // ACTION: REGISTER (Default)
    var result = processRegistration(sheet, data, params);
    return createJsonResponse(result);

  } catch (err) {
    return createJsonResponse({
      status: "ERROR",
      message: err.toString()
    });
  }
}

/**
 * Flexible registration processor with dynamic header mapping and deduplication
 */
function processRegistration(sheet, data, params) {
  var timestamp = new Date();
  var phone = cleanPhone(params.phone_number || params.contact_number || params.phone || "");
  var regId = params.registration_id || params.reg_id || ("REG-" + Math.floor(100000 + Math.random() * 900000));
  var fullName = params.full_name || params.name || "";
  var email = params.email_address || params.email || "";
  var category = params.category || params.branch || params.track || params.department || "";
  var deviceId = params.device_id || params.deviceId || "";
  var status = params.status || "Registered";

  // Build field mapping dictionary (accepts various common aliases)
  var fieldMap = {
    "timestamp": timestamp,
    "time": timestamp,
    "date": timestamp,
    "registrationid": regId,
    "regid": regId,
    "id": regId,
    "ticketid": regId,
    "phonenumber": "'" + phone,
    "phone": "'" + phone,
    "contact": "'" + phone,
    "contactnumber": "'" + phone,
    "mobile": "'" + phone,
    "whatsapp": "'" + phone,
    "fullname": fullName,
    "name": fullName,
    "emailaddress": email,
    "email": email,
    "category": category,
    "branch": category,
    "track": category,
    "department": category,
    "categorybranch": category,
    "deviceid": deviceId,
    "uuid": deviceId,
    "device": deviceId,
    "status": status,
    "notes": status,
    "statusnotes": status
  };

  // Inspect headers in Row 1
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    setupSheet();
    data = sheet.getDataRange().getValues();
    lastCol = DEFAULT_HEADERS.length;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Check if user exists by Phone Number (Col C) or Registration ID (Col B)
  var existingRowIndex = -1;
  if (phone) {
    existingRowIndex = findRowByPhone(data, phone);
  }

  // Construct dynamic row values matching existing sheet headers
  var rowValues = [];
  for (var i = 0; i < headers.length; i++) {
    var normHeader = normalizeKey(headers[i]);
    if (fieldMap.hasOwnProperty(normHeader)) {
      rowValues.push(fieldMap[normHeader]);
    } else if (params[headers[i]]) {
      rowValues.push(params[headers[i]]);
    } else {
      rowValues.push("");
    }
  }

  if (existingRowIndex > 1) {
    // Update existing row (deduplication)
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    return {
      status: "SUCCESS",
      action: "UPDATED",
      registration_id: regId,
      full_name: fullName,
      row: existingRowIndex
    };
  } else {
    // Append new row
    sheet.appendRow(rowValues);
    return {
      status: "SUCCESS",
      action: "CREATED",
      registration_id: regId,
      full_name: fullName,
      row: sheet.getLastRow()
    };
  }
}

function cleanPhone(raw) {
  return String(raw || "").trim().replace(/[^0-9]/g, "");
}

function findRowByPhone(data, phone) {
  if (!phone) return -1;
  var target = cleanPhone(phone);
  for (var i = 1; i < data.length; i++) {
    var cellVal = cleanPhone(data[i][2] || data[i][1] || "");
    if (cellVal === target) return i + 1;
  }
  return -1;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
