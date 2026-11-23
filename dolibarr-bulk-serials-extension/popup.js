// Popup click handler

document.getElementById('btn-trigger').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (!tab.url || !tab.url.includes('dispatch.php')) {
        alert("Please navigate to a Dolibarr Purchase Order reception page (dispatch.php) first!");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const fab = document.getElementById('doli-fab-importer');
            if (fab) {
                fab.click();
            } else {
                alert("Bulk importer buttons not detected on this page. Make sure the Lot/Serial module is enabled.");
            }
        }
    });

    window.close();
});
