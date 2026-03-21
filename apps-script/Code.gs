var SHEET_ID = '1c7YhPVoelyI3VoVc4dVV0SEM0OiWHPEWTCEco_NfNPg';

function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
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

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
