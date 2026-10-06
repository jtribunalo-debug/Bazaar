# Link sales to Google Sheets
1. Open your Google Sheet > Extensions > Apps Script. Delete any code, paste `google-sheets/Code.gs`.
   Change SECRET to a long random password. Save.
2. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy, authorize, copy the Web app URL.
3. In Vercel > Settings > Environment Variables add:
   GOOGLE_SHEET_WEBHOOK_URL = the Web app URL
   GOOGLE_SHEET_SECRET      = the same password as SECRET in Code.gs
   SHEETS_WEBHOOK_SECRET    = another random password (only for real-time sync)
   Then redeploy.
4. Push button: Dashboard > "Sync to Google Sheets". Safe to click repeatedly (existing orders are updated, not duplicated).
5. Real-time (optional): Supabase > Database > Webhooks > Create:
   Table: orders | Events: Insert + Update | Type: HTTP Request | Method: POST
   URL: https://YOUR-SITE.vercel.app/api/sheets | Header: x-webhook-secret = your SHEETS_WEBHOOK_SECRET
