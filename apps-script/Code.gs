var SHEET_ID = '1c7YhPVoelyI3VoVc4dVV0SEM0OiWHPEWTCEco_NfNPg';

function doPost(e) {
  // Lock prevents concurrent submissions from reading the same last row
  // and overwriting each other's data
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Vastaukset');
    var data = JSON.parse(e.parameter.data);
    var now = new Date();

    var rows = data.guests.map(function(guest) {
      return [
        guest.name,
        guest.attending,
        guest.bus,
        guest.dietary_restrictions,
        guest.speech,
        guest.baby_chair,
        now,
        guest.submission_group
      ];
    });

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally {
    lock.releaseLock();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
