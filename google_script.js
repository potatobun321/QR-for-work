/**
 * ==============================================================================
 * HAIFA HOUSE | VISHWAM - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Features:
 * 1. Self-Healing & Header-Aware: Maps incoming fields dynamically to Row 1 headers.
 * 2. Deduplication Engine: Updates existing rows by Registration ID if re-submitted.
 * 3. Fast & Lightweight: Single registration handler without unnecessary payload overhead.
 * 4. Helper Tools: Run setupSheet() in script editor for one-click table formatting.
 * ==============================================================================
 */

// Target Master Sheet Tab Name
var SHEET_NAME = "Haifa_Registrations";

// Standard Haifa House Schema (13 Columns)
var MASTER_HEADERS = [
  "Timestamp",                       // Col A (1)
  "Registration ID",                 // Col B (2)
  "Full Name",                       // Col C (3)
  "Contact Number",                  // Col G (4)
  "Email Address",                   // Col F (5)
  "Gender",                          // Col D (6)
  "Age",                             // Col E (7)
  "College / University",            // Col H (8)
  "Current College Year / Class",    // Col I (9)
  "City / State",                    // Col J (10)
  "Referral Source",                 // Col K (11)
  "Shakti Referral Code",            // Col L (12)
  "Status / Notes"                   // Col M (13)
];

function getRegistrationsSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getActiveSheet();
    try { sheet.setName(SHEET_NAME); } catch (e) {}
  }
  return sheet;
}

function unhideAllRows(sheet) {
  try {
    var maxRows = sheet.getMaxRows();
    if (maxRows > 0) sheet.showRows(1, maxRows);
    var filter = sheet.getFilter();
    if (filter) filter.remove();
  } catch(e) {}
}

/**
 * Run this function in the Google Apps Script Editor once to format Row 1 headers.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getRegistrationsSheet(ss);
  unhideAllRows(sheet);

  sheet.getRange(1, 1, 1, MASTER_HEADERS.length).setValues([MASTER_HEADERS]);
  var headerRange = sheet.getRange(1, 1, 1, MASTER_HEADERS.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0B192C");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontSize(11);
  sheet.setRowHeight(1, 40);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setFrozenRows(1);

  // Format Text columns (@) so contact numbers and registration IDs don't lose formatting
  sheet.getRange("B:B").setNumberFormat("@");
  sheet.getRange("D:D").setNumberFormat("@");
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function normalizeKey(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function handleRequest(e) {
  try {
    var params = {};

    // 1. Query parameters
    if (e && e.parameter) {
      for (var key in e.parameter) {
        params[key] = e.parameter[key];
      }
    }

    // 2. Post body (JSON or Form URL-encoded)
    if (e && e.postData && e.postData.contents) {
      try {
        var json = JSON.parse(e.postData.contents);
        for (var jKey in json) {
          params[jKey] = json[jKey];
        }
      } catch (jsonErr) {
        // Form encoded fallback
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

    // Process Registration
    var result = processHaifaRegistration(params);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function processHaifaRegistration(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getRegistrationsSheet(ss);
  unhideAllRows(sheet);

  var regId = params.registration_id || "";
  var fullName = params.full_name || "";
  var contactNum = params.contact_number || "";
  var email = params.email_address || "";
  var gender = params.gender || "";
  var age = params.age || "";
  var college = params.college_university || "";
  var yearClass = params.current_college_year_or_class || "";
  var cityState = params.city_state || "";
  var referralSource = params.referral_source || "Instagram";
  var shaktiCode = params.shakti_referral_code || "";
  var statusNotes = "Free Entry Confirmed";
  var timestamp = new Date();

  // Field mapping lookup dictionary
  var fieldMap = {
    "timestamp": timestamp,
    "time": timestamp,
    "date": timestamp,
    "registrationid": regId,
    "regid": regId,
    "id": regId,
    "fullname": fullName,
    "name": fullName,
    "contactnumber": contactNum,
    "contact": contactNum,
    "phone": contactNum,
    "phonenumber": contactNum,
    "mobile": contactNum,
    "whatsapp": contactNum,
    "emailaddress": email,
    "email": email,
    "gender": gender,
    "age": age,
    "collegeuniversity": college,
    "college": college,
    "university": college,
    "school": college,
    "institution": college,
    "currentcollegeyearorclass": yearClass,
    "currentcollegeyear": yearClass,
    "year": yearClass,
    "class": yearClass,
    "citystate": cityState,
    "city": cityState,
    "state": cityState,
    "location": cityState,
    "referralsource": referralSource,
    "source": referralSource,
    "shaktireferralcode": shaktiCode,
    "shakticode": shaktiCode,
    "referralcode": shaktiCode,
    "statusnotes": statusNotes,
    "status": statusNotes,
    "notes": statusNotes
  };

  // Inspect existing headers
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    setupSheet();
    lastCol = MASTER_HEADERS.length;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var lastRow = sheet.getLastRow();

  // Deduplication check: check if Registration ID already exists
  var existingRowIndex = -1;
  var regIdColIndex = -1;

  for (var c = 0; c < headers.length; c++) {
    var normHeader = normalizeKey(headers[c]);
    if (normHeader === "registrationid" || normHeader === "regid") {
      regIdColIndex = c + 1;
      break;
    }
  }

  if (regId && regIdColIndex > 0 && lastRow > 1) {
    var idValues = sheet.getRange(2, regIdColIndex, lastRow - 1, 1).getValues();
    for (var r = 0; r < idValues.length; r++) {
      if (String(idValues[r][0]).trim() === regId) {
        existingRowIndex = r + 2;
        break;
      }
    }
  }

  var rowValues = [];
  for (var i = 0; i < headers.length; i++) {
    var key = normalizeKey(headers[i]);
    if (fieldMap.hasOwnProperty(key)) {
      rowValues.push(fieldMap[key]);
    } else {
      rowValues.push("");
    }
  }

  if (existingRowIndex > 1) {
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    return {
      status: "success",
      action: "updated",
      registration_id: regId,
      row: existingRowIndex
    };
  } else {
    sheet.appendRow(rowValues);
    return {
      status: "success",
      action: "created",
      registration_id: regId,
      row: sheet.getLastRow()
    };
  }
}
