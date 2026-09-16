/**
 * ==============================================================================
 * JAI CONCLAVE 2026 | VISHWAM - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Features:
 * 1. Self-Healing & Header-Aware: Maps fields dynamically to matching column headers in Row 1.
 * 2. Deduplication Engine: Updates existing rows by Registration ID instead of creating multiple entries.
 * 3. Dedicated Google Drive Upload: Directly saves ID photos to your specified Drive folder.
 * 4. One-Click Setup & Verification: Includes setupSheet() and testDriveFolderAccess().
 * ==============================================================================
 */

// Target Master Sheet Tab Name
var SHEET_NAME = "Registrations";

// Target Google Drive Folder ID for ID photos / documents
// URL: https://drive.google.com/drive/u/0/folders/1zsI2DV10KLTwGixUYlzkxJZQ3wkZSmpr
var DRIVE_FOLDER_ID = "1zsI2DV10KLTwGixUYlzkxJZQ3wkZSmpr";

// Standard Master Schema (27 Columns)
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
 * Run this function in the Google Apps Script Editor once to authorize DriveApp.
 */
function testDriveFolderAccess() {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log("SUCCESS: Connected to folder: " + folder.getName());
    return "SUCCESS: Connected to folder: " + folder.getName();
  } catch (err) {
    Logger.log("ERROR: " + err.toString());
    return "ERROR: " + err.toString();
  }
}

/**
 * Formats Row 1 with official headers and styles.
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

  // Format Text columns (@) so numbers like phones and registration IDs don't lose digits
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

    // 2. JSON POST body
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

    if (action === "flush") {
      flushSheet();
      return createJsonResponse({ status: "SUCCESS", message: "Registrations sheet cleared." });
    }

    // Auto-setup if sheet is completely blank
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

      if (regColIdx === -1) regColIdx = 1;
      if (phoneColIdx === -1) phoneColIdx = 6;
      if (utrColIdx === -1) utrColIdx = 24;

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

    // --- GOOGLE DRIVE FILE UPLOADER ---
    var idDocument = (params.id_document || "").trim();
    if (params.id_file_base64) {
      try {
        var base64Data = String(params.id_file_base64);
        if (base64Data.indexOf(",") > -1) {
          base64Data = base64Data.split(",")[1];
        }
        var decoded = Utilities.base64Decode(base64Data);
        var mimeType = params.id_file_type || "image/jpeg";
        var fileExt = mimeType.indexOf("png") > -1 ? ".png" : (mimeType.indexOf("pdf") > -1 ? ".pdf" : ".jpg");
        var safeRegId = (registrationId || "DOC").replace(/[^a-zA-Z0-9_-]/g, "_");
        var safeName = (fullName || "Participant").replace(/[^a-zA-Z0-9_-]/g, "_");
        var fileName = safeRegId + "_" + safeName + fileExt;

        var blob = Utilities.newBlob(decoded, mimeType, fileName);

        // Upload into specified Drive Folder
        var targetFolder;
        try {
          targetFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        } catch (fErr) {
          try {
            targetFolder = DriveApp.getRootFolder();
          } catch (rErr) {
            targetFolder = null;
          }
        }

        if (targetFolder) {
          var uploadedFile = targetFolder.createFile(blob);
          try {
            uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (shareErr) {}
          idDocument = uploadedFile.getUrl();
        } else {
          idDocument = "https://drive.google.com/drive/folders/" + DRIVE_FOLDER_ID;
        }
      } catch (driveErr) {
        if (!idDocument) {
          idDocument = "https://drive.google.com/drive/folders/" + DRIVE_FOLDER_ID + " (Upload note: " + driveErr.toString() + ")";
        }
      }
    }

    // Value mapping dictionary
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

    // --- DYNAMIC ROW CONSTRUCTION ---
    var currentLastCol = sheet.getLastColumn();
    var existingHeaders = currentLastCol > 0 ? sheet.getRange(1, 1, 1, currentLastCol).getValues()[0] : [];
    var mappedRow;

    if (existingHeaders.length > 0 && String(existingHeaders[0] || "").trim() !== "") {
      mappedRow = new Array(existingHeaders.length);
      for (var col = 0; col < existingHeaders.length; col++) {
        var rawHeader = String(existingHeaders[col] || "").trim();
        var normH = normalizeKey(rawHeader);

        if (valueDict.hasOwnProperty(normH)) {
          mappedRow[col] = valueDict[normH];
        } else {
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
    } else {
      setupSheet();
      mappedRow = [
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
    }

    // --- DEDUPLICATION & IDEMPOTENCY ENGINE ---
    // If a row with this Registration ID already exists, UPDATE it in place instead of creating duplicates!
    var existingRowNumber = -1;
    if (registrationId) {
      var allRows = sheet.getDataRange().getValues();
      var idCol = 1; // Default Column B

      if (existingHeaders && existingHeaders.length > 0) {
        for (var idx = 0; idx < existingHeaders.length; idx++) {
          var key = normalizeKey(existingHeaders[idx]);
          if (key === "registrationid" || key === "regid") {
            idCol = idx;
            break;
          }
        }
      }

      for (var r = 1; r < allRows.length; r++) {
        var cellId = String(allRows[r][idCol] || "").trim();
        if (cellId && cellId === registrationId) {
          existingRowNumber = r + 1; // 1-indexed row in sheet
          break;
        }
      }
    }

    if (existingRowNumber > 0) {
      // Row already exists: update existing row in place
      sheet.getRange(existingRowNumber, 1, 1, mappedRow.length).setValues([mappedRow]);
    } else {
      // New record: append single clean row
      sheet.appendRow(mappedRow);
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
