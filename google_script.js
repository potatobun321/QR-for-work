/**
 * ==============================================================================
 * EVENT REGISTRATION PORTAL - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Target Sheet Name: "Registrations"
 * Columns (25 Total):
 * 1. Timestamp                   14. Venture Name
 * 2. Full Name                   15. Founder / Team Name
 * 3. Gender                      16. Payment Receipt URL/Doc
 * 4. Age                         17. Payment Confirmation Status
 * 5. Email Address               18. Referral Source
 * 6. Contact Number              19. Shakti Referral Code
 * 7. College / University        20. ID Document URL/Ref
 * 8. Current College Year/Class  21. Payment Email
 * 9. City / State                22. Payment Transaction Screenshot
 * 10. Participation Type         23. UTR / UPI Transaction ID
 * 11. Prior MUN Experience       24. Venture Overview
 * 12. Preferred Council          25. Accommodation Required
 * 13. Participation Mode
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
    "Full Name",
    "Gender",
    "Age",
    "Email Address",
    "Contact Number",
    "College / University",
    "Current College Year / Class",
    "City / State",
    "Participation Type",
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
    "Venture Overview",
    "Accommodation Required"
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
  
  // Format Contact Number (Col 6) and UTR ID (Col 23) as explicit text (@) to preserve leading zeroes
  sheet.getRange("F:F").setNumberFormat("@");
  sheet.getRange("W:W").setNumberFormat("@");
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

    // Capture the 25 columns
    var timestamp = new Date();
    var fullName = (params.full_name || params.name || "").trim();
    var gender = (params.gender || "").trim();
    var age = (params.age || "").trim();
    var emailAddress = (params.email_address || params.email || "").trim();
    var contactNumber = "'" + String(params.contact_number || params.phone || "").trim().replace(/[^0-9+]/g, "");
    var collegeUniversity = (params.college_university || params.college || "").trim();
    var collegeYear = (params.current_college_year_or_class || params.year || "").trim();
    var cityState = (params.city_state || "").trim();
    var participationType = (params.participation_type || params.track || "").trim();
    var priorMunExperience = (params.prior_mun_experience || "").trim();
    var preferredCouncil = (params.preferred_council || "").trim();
    var participationMode = (params.participation_mode || "").trim();
    var ventureName = (params.venture_name || "").trim();
    var founderOrTeamName = (params.founder_or_team_name || "").trim();
    var paymentReceipt = (params.payment_receipt || "").trim();
    var paymentConfirmation = (params.payment_confirmation || "Pending").trim();
    var referralSource = (params.referral_source || "").trim();
    var shaktiReferralCode = (params.shakti_referral_code || "").trim();
    var idDocument = (params.id_document || "").trim();
    var paymentEmail = (params.payment_email || "").trim();
    var paymentTransactionScreenshot = (params.payment_transaction_screenshot || "").trim();
    var utrUpiTransactionId = "'" + (params.utr_upi_transaction_id || params.utr || "").trim();
    var ventureOverview = (params.venture_overview || "").trim();
    var accommodationRequired = (params.accommodation_required || "No").trim();

    var rowData = [
      timestamp,
      fullName,
      gender,
      age,
      emailAddress,
      contactNumber,
      collegeUniversity,
      collegeYear,
      cityState,
      participationType,
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
      ventureOverview,
      accommodationRequired
    ];

    sheet.appendRow(rowData);

    return createJsonResponse({
      status: "SUCCESS",
      message: "Registration recorded successfully!",
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
