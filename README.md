# Dolibarr Bulk Serial Importer (Chrome Extension)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Dolibarr](https://img.shields.io/badge/Dolibarr-v14%20--%20v24+-orange.svg)](https://www.dolibarr.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A lightweight Google Chrome / Chromium extension for **Dolibarr ERP/CRM** that allows warehouse and inventory teams to receive and split hundreds of unique serial numbers in seconds without manual clicking or typing.

---

## 🎯 The Problem it Solves

In standard Dolibarr, receiving serialized inventory on a Purchase Order (`fourn/commande/dispatch.php`) requires:
1. Clicking the tiny "split line" button once for **every single item** (e.g., clicking 160 times for 160 units).
2. Manually copy-pasting or typing each serial number into separate individual text boxes.

This extension replaces that tedious process with a single **Bulk Serial Importer** dialog that splits the line and populates all rows automatically in under 1 second.

---

## ✨ Features

- **In-Page Buttons:** Injects a **`📋 Bulk Serials`** button right next to the split icon on every lot/serial tracked product line.
- **Floating Quick-Access Widget:** A floating **`📦 Bulk Serial Importer`** button in the bottom-right corner showing remaining lines.
- **Smart Serial Parsing:** Paste serial numbers directly from:
  - Excel / Google Sheets (columns / tabs)
  - CSV files
  - PDF packing slips
  - Handheld barcode scanners (newline separated)
- **Real-Time Match Verification:**
  - 🟢 **Exact Match:** Confirms pasted count matches remaining quantity.
  - 🔵 **Partial Reception:** Allows receiving partial deliveries (e.g., 50 out of 160).
  - 🟡 **Excess Warning:** Alerts you if you pasted more serials than remaining.
- **Duplicate Prevention:** Automatic checkbox to filter out duplicate serials.
- **1-Click Reset / Undo:** Made a mistake? Click **`🔄 Reset Line`** to collapse back to a single row with the full remaining quantity.
- **100% Private & Secure:** Runs entirely locally in your browser. No data or serial numbers are ever collected or sent to external servers.

---

## 🚀 Installation

### Option 1: Load in Chrome (Developer Mode)

1. **Download this repository:**
   - Click the green **Code** button at the top of this repository and select **Download ZIP** (or clone via Git).
   - Unzip the downloaded file to a folder on your computer.
2. **Open Extensions in Chrome:**
   - In Google Chrome, go to `chrome://extensions/` in the address bar.
   - Enable **Developer mode** toggle in the top-right corner.
3. **Load the Extension:**
   - Click **Load unpacked** in the top-left corner.
   - Select the folder containing `manifest.json`.
4. **Done!** Open or refresh your Dolibarr purchase order reception page.

---

## 📖 How to Use

1. Open any Purchase Order reception page in Dolibarr (`fourn/commande/dispatch.php`).
2. Click the blue **`📋 Bulk Serials`** button next to the product you want to receive.
3. Copy your serial numbers (from your vendor packing slip, spreadsheet, or barcode scan) and paste them into the box.
4. Click **`⚡ Split & Populate Serials`**.
5. All rows will be generated with **Qty: 1**, serial numbers filled, and your warehouse pre-selected.
6. Scroll down and click **`CREATE RECEPTION`** (or `Receive`) as usual!

---

## ⚙️ Server Recommendation: `max_input_vars`

When receiving large quantities of serialized items at once (e.g. 100+ units), your browser submits many form fields to PHP.

* If your server uses PHP's default `max_input_vars = 1000`, PHP may silently drop inputs past ~80 items.
* **Recommended:** In your server's `php.ini`, cPanel, or `.user.ini`, increase the limit:
  ```ini
  max_input_vars = 5000
  ```
* **Alternatively:** If you cannot edit `php.ini`, simply paste and receive in batches of 50 to 80 units. Dolibarr natively supports partial receptions!

---

## 🔍 Compatibility & Tested Versions

- **Primary Tested Version:** Dolibarr **v24.0.3**
- **Compatible Versions:** Dolibarr **v14.x through v24.x+**
- **Requirements:** Dolibarr core `Product batch / serial number management` module enabled.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
