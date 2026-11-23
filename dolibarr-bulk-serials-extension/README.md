# Dolibarr Bulk Serial Importer (Chrome Extension)

A Chrome Extension for Dolibarr ERP/CRM that allows receiving hundreds of serialized products in seconds without manual clicking or typing.

## Features
- **In-Page Buttons:** Injects a **`📋 Bulk Serials`** button right next to each serialized product line on Dolibarr Purchase Order dispatch/reception screens (`/fourn/commande/dispatch.php`).
- **Floating Importer Widget:** Bottom-right floating badge showing pending lines and quick access.
- **Smart Serial Parsing:** Automatically parses serials copied from Excel, Google Sheets, CSV, PDF, or barcode scanners.
- **Real-Time Match Detection:** Confirms whether your pasted serial count matches, partially matches, or exceeds the remaining quantity to receive.
- **Duplicate Prevention:** Option to automatically strip duplicate serial numbers.
- **1-Click Undo / Reset:** If you make a mistake or want to re-paste, 1-click resets the line back to a single row.

## Installation in Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in the address bar.
3. Turn ON **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the folder:
   `D:\Antigravity\Billing DJSenter\dolibarr-bulk-serials-extension`
6. Done! Open or refresh your Dolibarr reception page.
