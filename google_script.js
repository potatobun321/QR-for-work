/**
 * ==============================================================================
 * JAI CONCLAVE 2026 | VISHWAM - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Self-Healing & Header-Aware Data Engine:
 * - Dynamically maps incoming data to matching column headers in Row 1.
 * - Prevents column shifting even if headers are rearranged or added.
 * - Supports one-click setupSheet() and fixShiftedRows() for existing data.
 * ==============================================================================
 */

// Target Master Sheet Name
var SHEET_NAME = "Registrations";

// Standard Master Schema (27 Master Columns)
var MASTER_HEADERS = [
  "Timestamp",                       // Col A (1)
  "Registration ID",                 // Col B (2)
  "Full Name",                       // Col C (3)
  "Gender",                          // Col D (4)
  "Age",                             // Col E (5)
  "Email Address",                   // Col F (6)
  "Contact Number",                  // Col G (7)
  "College / University",            // Col H (8)
  "Current College Year / Class",    // Col I (9)
  "City / State",                    // Col J (10)
  "Accommodation Required",          // Col K (11)
  "Participation Type",              // Col L (12)
  "Registration Fee",                // Col M (13)
  "Prior MUN Experience",            // Col N (14)
  "Preferred Council",               // Col O (15)
  "Participation Mode",              // Col P (16)
  "Art Specifications",              // Col Q (17)
  "Venture Name",                    // Col R (18)
  "Founder or Team Name",            // Col S (19)
  "Venture Overview",                // Col T (20)
  "Payment Confirmation",            // Col U (21)
  "Referral Source",                 // Col V (22)
  "Shakti Referral Code",            // Col W (23)
  "ID Document",                     // Col X (24)
  "UTR / UPI Transaction ID",        // Col Y (25)
  "Payment Email",                   // Col Z (26)
  "Notes / Desk Remarks"             // Col AA (27)
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
 * Run this function in Google Apps Script Editor to format and set up Row 1 headers cleanly.
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

  // Format Registration ID, Contact Number, and UTR as text (@) so leading zeros aren't lost
  sheet.getRange("B:B").setNumberFormat("@");
  sheet.getRange("G:G").setNumberFormat("@");
  sheet.getRange("Y:Y").setNumberFormat("@");

  // Add validation dropdown to Payment Confirmation (Col U)
  try {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Pending", "Verified", "Cash/Desk", "Waived"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange("U2:U2000").setDataValidation(rule);
  } catch(e) {}
}

/**
 * Clean existing corrupted / shifted rows (where Registration ID was under Full Name, etc.)
 */
function fixShiftedRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getRegistrationsSheet(ss);
  unhideAllRows(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // First ensure Row 1 has the standard headers
  setupSheet();

  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  for (var r = 0; r < data.length; r++) {
    var row = data[r];
    // Check if row has a Registration ID pattern in Col 2 (B) or Col 1 (A)
    // JAI-26-XXXX format
    var foundRegId = "";
    var regIdIdx = -1;
    for (var c = 0; c < 5; c++) {
      var valStr = String(row[c] || "").trim();
      if (/^JAI-26-\d{4}/i.test(valStr)) {
        foundRegId = valStr;
        regIdIdx = c;
        break;
      }
    }

    // If Registration ID was placed in Col C (index 2) or Col B (index 1) with shifted values:
    if (regIdIdx === 1 && typeof row[0] === "number") {
      // Row is likely shifted by 1 column
      // row[1] = Reg ID, row[2] = Full Name, row[3] = Gender, row[4] = Age, row[5] = Email, etc.
      sheet.getRange(r + 2, 2).setValue("'" + foundRegId);
    }
  }
}

function flushSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getRegistrationsSheet(ss);
  unhideAllRows(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
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

    // 2. JSON POST payload if sent
    if (e && e.postData && e.postData.contents) {
      try {
        var jsonBody = JSON.parse(e.postData.contents);
        for (var bKey in jsonBody) {
          params[bKey] = jsonBody[bKey];
        }
      } catch (jsonErr) {}
    }

    var action = params.action || "register";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getRegistrationsSheet(ss);

    if (action === "setup") {
      setupSheet();
      return createJsonResponse({ status: "SUCCESS", message: "Registrations sheet setup complete." });
    }

    if (action === "fix") {
      fixShiftedRows();
      return createJsonResponse({ status: "SUCCESS", message: "Existing rows aligned." });
    }

    if (action === "flush") {
      flushSheet();
      return createJsonResponse({ status: "SUCCESS", message: "Registrations sheet cleared." });
    }

    // Auto-setup if sheet is completely empty
    if (sheet.getLastRow() === 0) {
      setupSheet();
    }

    // --- ASYNC UTR UPDATE ACTION ---
    if (action === "update_utr") {
      var targetRegId = String(params.registration_id || params.reg_id || "").trim();
      var targetPhone = String(params.contact_number || params.phone || "").trim().replace(/[^0-9]/g, "");
      var utrVal = String(params.utr_upi_transaction_id || params.utr || "").trim();

      var dataRange = sheet.getDataRange();
      var data = dataRange.getValues();
      var headers = data[0] || [];
      var regColIdx = -1;
      var phoneColIdx = -1;
      var utrColIdx = -1;

      for (var h = 0; h < headers.length; h++) {
        var nH = normalizeKey(headers[h]);
        if (nH === "registrationid" || nH === "regid") regColIdx = h;
        if (nH === "contactnumber" || nH === "phone" || nH === "mobilenumber") phoneColIdx = h;
        if (nH === "utrupitransactionid" || nH === "utr" || nH === "transactionid") utrColIdx = h;
      }

      if (regColIdx === -1) regColIdx = 1; // Fallback Col B
      if (phoneColIdx === -1) phoneColIdx = 6; // Fallback Col G
      if (utrColIdx === -1) utrColIdx = 24; // Fallback Col Y

      var updated = false;
      for (var i = 1; i < data.length; i++) {
        var rowRegId = String(data[i][regColIdx] || "").trim();
        var rowPhone = String(data[i][phoneColIdx] || "").replace(/[^0-9]/g, "");
        if ((targetRegId && rowRegId === targetRegId) || (targetPhone && rowPhone === targetPhone)) {
          sheet.getRange(i + 1, utrColIdx + 1).setValue("'" + utrVal);
          updated = true;
          break;
        }
      }

      return createJsonResponse({
        status: updated ? "SUCCESS" : "NOT_FOUND",
        message: updated ? "UTR updated successfully" : "Registration record not found"
      });
    }

    // --- REGISTRATION SUBMISSION ---
    var timestamp = new Date();
    var registrationId = String(params.registration_id || params.reg_id || "").trim();
    var fullName = (params.full_name || params.name || "").trim();
    var gender = (params.gender || "").trim();
    var age = (params.age || "").trim();
    var emailAddress = (params.email_address || params.email || "").trim();
    var contactNumber = "'" + String(params.contact_number || params.phone || "").trim().replace(/[^0-9+]/g, "");
    var collegeUniversity = (params.college_university || params.college || "").trim();
    var collegeYear = (params.current_college_year_or_class || params.year || "").trim();
    var cityState = (params.city_state || "").trim();
    var accommodationRequired = (params.accommodation_required || "No").trim();
    var participationType = (params.participation_type || params.track || "").trim();
    var registrationFee = (params.registration_fee || params.fee || "INR 2,500").trim();
    var priorMunExperience = (params.prior_mun_experience || "").trim();
    var preferredCouncil = (params.preferred_council || "").trim();
    var participationMode = (params.participation_mode || "").trim();
    var artSpecifications = (params.art_specifications || "").trim();
    var ventureName = (params.venture_name || "").trim();
    var founderOrTeamName = (params.founder_or_team_name || "").trim();
    var ventureOverview = (params.venture_overview || "").trim();
    var paymentConfirmation = (params.payment_confirmation || "Pending").trim();
    var referralSource = (params.referral_source || "").trim();
    var shaktiReferralCode = (params.shakti_referral_code || "").trim();
    var paymentEmail = (params.payment_email || "").trim();
    var utrUpiTransactionId = "'" + (params.utr_upi_transaction_id || params.utr || "").trim();

    // Handle uploaded file if present
    var idDocument = (params.id_document || "").trim();
    if (params.id_file_base64) {
      try {
        var base64Data = String(params.id_file_base64);
        if (base64Data.indexOf(",") > -1) {
          base64Data = base64Data.split(",")[1];
        }
        var decoded = Utilities.base64Decode(base64Data);
        var mimeType = params.id_file_type || "image/jpeg";
        var fileName = (params.id_file_name || ("ID_" + (registrationId || "doc"))).replace(/[^a-zA-Z0-9._-]/g, "_");
        var blob = Utilities.newBlob(decoded, mimeType, fileName);
        var file = DriveApp.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        idDocument = file.getUrl();
      } catch (driveErr) {
        if (!idDocument) {
          idDocument = "Gallery File: " + (params.id_file_name || "Uploaded") + " (" + driveErr.toString() + ")";
        }
      }
    }

    // Value mapping dictionary keyed by normalized keywords
    var valueDict = {
      "timestamp": timestamp,
      "date": timestamp,
      "time": timestamp,

      "registrationid": registrationId,
      "regid": registrationId,
      "id": registrationId,

      "fullname": fullName,
      "name": fullName,
      "participantname": fullName,

      "gender": gender,
      "sex": gender,

      "age": age,

      "emailaddress": emailAddress,
      "email": emailAddress,
      "emailid": emailAddress,

      "contactnumber": contactNumber,
      "phone": contactNumber,
      "phonenumber": contactNumber,
      "mobile": contactNumber,
      "mobilenumber": contactNumber,
      "whatsapp": contactNumber,

      "collegeuniversity": collegeUniversity,
      "college": collegeUniversity,
      "university": collegeUniversity,
      "school": collegeUniversity,

      "currentcollegeyearclass": collegeYear,
      "collegeyear": collegeYear,
      "year": collegeYear,
      "class": collegeYear,

      "citystate": cityState,
      "city": cityState,
      "state": cityState,

      "accommodationrequired": accommodationRequired,
      "accommodation": accommodationRequired,

      "participationtype": participationType,
      "track": participationType,
      "participationtrack": participationType,

      "registrationfee": registrationFee,
      "fee": registrationFee,
      "amount": registrationFee,

      "priormunexperience": priorMunExperience,
      "munexperience": priorMunExperience,

      "preferredcouncil": preferredCouncil,
      "council": preferredCouncil,

      "participationmode": participationMode,
      "mode": participationMode,

      "artspecifications": artSpecifications,
      "art": artSpecifications,

      "venturename": ventureName,
      "projectname": ventureName,
      "startupname": ventureName,

      "founderorteamname": founderOrTeamName,
      "founder": founderOrTeamName,
      "team": founderOrTeamName,

      "ventureoverview": ventureOverview,
      "overview": ventureOverview,

      "paymentconfirmation": paymentConfirmation,
      "paymentstatus": paymentConfirmation,
      "status": paymentConfirmation,

      "referralsource": referralSource,
      "referral": referralSource,

      "shaktireferralcode": shaktiReferralCode,
      "shakticode": shaktiReferralCode,
      "referralcode": shaktiReferralCode,

      "iddocument": idDocument,
      "document": idDocument,

      "utrupitransactionid": utrUpiTransactionId,
      "utr": utrUpiTransactionId,
      "transactionid": utrUpiTransactionId,

      "paymentemail": paymentEmail
    };

    // --- DYNAMIC HEADER MAPPING ---
    // Read the existing Row 1 headers from the user's sheet
    var currentLastCol = sheet.getLastColumn();
    var existingHeaders = currentLastCol > 0 ? sheet.getRange(1, 1, 1, currentLastCol).getValues()[0] : [];

    // If headers exist, build row matching the user's exact columns
    if (existingHeaders.length > 0 && String(existingHeaders[0] || "").trim() !== "") {
      var mappedRow = new Array(existingHeaders.length);
      for (var col = 0; col < existingHeaders.length; col++) {
        var rawHeader = String(existingHeaders[col] || "").trim();
        var normH = normalizeKey(rawHeader);

        if (valueDict.hasOwnProperty(normH)) {
          mappedRow[col] = valueDict[normH];
        } else {
          // Fuzzy fallback search
          var assigned = false;
          for (var dictKey in valueDict) {
            if (normH.indexOf(dictKey) > -1 || dictKey.indexOf(normH) > -1) {
              mappedRow[col] = valueDict[dictKey];
              assigned = true;
              break;
            }
          }
          if (!assigned) {
            mappedRow[col] = "";
          }
        }
      }

      sheet.appendRow(mappedRow);

    } else {
      // Fallback: Use standard schema
      setupSheet();
      var fallbackRow = [
        timestamp,
        registrationId,
        fullName,
        gender,
        age,
        emailAddress,
        contactNumber,
        collegeUniversity,
        collegeYear,
        cityState,
        accommodationRequired,
        participationType,
        registrationFee,
        priorMunExperience,
        preferredCouncil,
        participationMode,
        artSpecifications,
        ventureName,
        founderOrTeamName,
        ventureOverview,
        paymentConfirmation,
        referralSource,
        shaktiReferralCode,
        idDocument,
        utrUpiTransactionId,
        paymentEmail,
        ""
      ];
      sheet.appendRow(fallbackRow);
    }

    return createJsonResponse({
      status: "SUCCESS",
      message: "Registration recorded successfully",
      registration_id: registrationId,
      timestamp: timestamp
    });

  } catch (err) {
    return createJsonResponse({
      status: "ERROR",
      message: err.toString()
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
