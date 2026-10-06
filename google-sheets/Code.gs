// Paste into: your Google Sheet > Extensions > Apps Script
const SECRET = 'Buypartite102026'; // must equal GOOGLE_SHEET_SECRET in Vercel
const SHEET_NAME = 'Sales';
const HEADERS = ['Order ID', 'Date', 'Source', 'Customer', 'Items', 'Total (PHP)', 'Payment Method', 'Payment Status', 'Order Status'];

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return out({ ok: false, error: 'Bad secret' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().flat() : [];
    const index = {}; ids.forEach((id, i) => index[id] = i + 2);
    data.rows.forEach((r) => {
      const v = [r.id, r.date, r.source, r.customer, r.items, r.total, r.method, r.payment, r.status];
      if (index[r.id]) sh.getRange(index[r.id], 1, 1, v.length).setValues([v]); // update existing order
      else { sh.appendRow(v); index[r.id] = sh.getLastRow(); }                  // add new order
    });
    return out({ ok: true, count: data.rows.length });
  } catch (err) { return out({ ok: false, error: String(err) }); }
  finally { lock.releaseLock(); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
