/**
 * ==============================================================================
 * EVENT REGISTRATION PORTAL - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Target Sheet Name: "Registrations"
 * Columns (26 Total):
 * 1. Timestamp                   14. Preferred Council
 * 2. Registration ID             15. Participation Mode
 * 3. Full Name                   16. Venture Name
 * 4. Gender                      17. Founder / Team Name
 * 5. Age                         18. Payment Receipt
 * 6. Email Address               19. Payment Confirmation (Pending / Verified)
 * 7. Contact Number              20. Referral Source
 * 8. College / University        21. Shakti Referral Code
 * 9. Current College Year/Class  22. ID Document
 * 10. City / State               23. Payment Email
 * 11. Participation Type         24. Payment Transaction Screenshot
 * 12. Registration Fee           25. UTR / UPI Transaction ID
 * 13. Prior MUN Experience       26. Venture Overview & Notes
 * ==============================================================================
 */

function getRegistrationsSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Registrations");
  if (!sheet) {
    sheet = ss.getActiveSheet();
    try { sheet.setName("Registrations"); } catch (e) {}
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

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getRegistrationsSheet(ss);

  unhideAllRows(sheet);

  var headers = [
    "Timestamp",
    "Registration ID",
    "Full Name",
    "Gender",
    "Age",
    "Email Address",
    "Contact Number",
    "College / University",
    "Current College Year / Class",
    "City / State",
    "Participation Type",
    "Registration Fee",
    "Prior MUN Experience",
    "Preferred Council",
    "Participation Mode",
    "Venture Name",
    "Founder or Team Name",
    "Payment Receipt",
    "Payment Confirmation",
    "Referral Source",
    "Shakti Referral Code",
    "ID Document",
    "Payment Email",
    "Payment Transaction Screenshot",
    "UTR / UPI Transaction ID",
    "Venture Overview"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0F172A");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontSize(11);
  sheet.setRowHeight(1, 40);
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  
  // Format Registration ID (Col 2), Contact Number (Col 7), and UTR ID (Col 25) as explicit text (@)
  sheet.getRange("B:B").setNumberFormat("@");
  sheet.getRange("G:G").setNumberFormat("@");
  sheet.getRange("Y:Y").setNumberFormat("@");

  // Add validation dropdown to Payment Confirmation (Col 19)
  try {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Pending", "Verified", "Cash/Desk", "Waived"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange("S2:S1000").setDataValidation(rule);
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

function handleRequest(e) {
  try {
    var params = {};
    
    // Parse query parameters
    if (e && e.parameter) {
      for (var key in e.parameter) {
        params[key] = e.parameter[key];
      }
    }
    
    // Parse JSON body for POST requests if provided
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

    // Auto-setup headers if row 1 is empty
    if (sheet.getLastRow() === 0) {
      setupSheet();
    }

    // Handle updating UTR asynchronously if provided post-registration
    if (action === "update_utr") {
      var targetRegId = String(params.registration_id || params.reg_id || "").trim();
      var targetPhone = String(params.contact_number || params.phone || "").trim().replace(/[^0-9]/g, "");
      var utrVal = String(params.utr_upi_transaction_id || params.utr || "").trim();
      
      var data = sheet.getDataRange().getValues();
      var updated = false;
      for (var i = 1; i < data.length; i++) {
        var rowRegId = String(data[i][1] || "").trim();
        var rowPhone = String(data[i][6] || "").replace(/[^0-9]/g, "");
        if ((targetRegId && rowRegId === targetRegId) || (targetPhone && rowPhone === targetPhone)) {
          sheet.getRange(i + 1, 25).setValue("'" + utrVal);
          updated = true;
          break;
        }
      }
      return createJsonResponse({
        status: updated ? "SUCCESS" : "NOT_FOUND",
        message: updated ? "UTR updated successfully" : "Registration record not found"
      });
    }

    // Capture the columns
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
    var participationType = (params.participation_type || params.track || "").trim();
    var registrationFee = (params.registration_fee || params.fee || "INR 2,500").trim();
    var priorMunExperience = (params.prior_mun_experience || "").trim();
    var preferredCouncil = (params.preferred_council || "").trim();
    var participationMode = (params.participation_mode || "").trim();
    var ventureName = (params.venture_name || "").trim();
    var founderOrTeamName = (params.founder_or_team_name || "").trim();
    var paymentReceipt = (params.payment_receipt || "").trim();
    var paymentConfirmation = (params.payment_confirmation || "Pending").trim();
    var referralSource = (params.referral_source || "").trim();
    var shaktiReferralCode = (params.shakti_referral_code || "").trim();
    var paymentEmail = (params.payment_email || "").trim();
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
          idDocument = "Gallery File: " + (params.id_file_name || "Uploaded") + " (Drive: " + driveErr.toString() + ")";
        }
      }
    }
    var paymentTransactionScreenshot = (params.payment_transaction_screenshot || "").trim();
    var utrUpiTransactionId = "'" + (params.utr_upi_transaction_id || params.utr || "").trim();
    var ventureOverview = (params.venture_overview || "").trim();

    var rowData = [
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
      participationType,
      registrationFee,
      priorMunExperience,
      preferredCouncil,
      participationMode,
      ventureName,
      founderOrTeamName,
      paymentReceipt,
      paymentConfirmation,
      referralSource,
      shaktiReferralCode,
      idDocument,
      paymentEmail,
      paymentTransactionScreenshot,
      utrUpiTransactionId,
      ventureOverview
    ];

    sheet.appendRow(rowData);

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
