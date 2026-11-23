// Dolibarr Bulk Serial Importer - Content Script

(function () {
    // Only run on dispatch/reception pages
    if (!window.location.pathname.includes('dispatch.php') && !document.querySelector('form[action*="dispatch.php"]')) {
        return;
    }

    console.log('[Dolibarr Bulk Serials] Extension loaded on dispatch page.');

    // Helper: Parse lines from the page
    function getProductLines() {
        const lines = [];
        const rows = document.querySelectorAll('tr[name^="batch_0_"]');

        rows.forEach(row => {
            const rowName = row.getAttribute('name'); // e.g. batch_0_0
            const parts = rowName.split('_');
            const lineIdx = parts[2];

            // Product label search in previous rows
            let prodLabel = 'Product ' + (parseInt(lineIdx) + 1);
            let prev = row.previousElementSibling;
            while (prev) {
                const link = prev.querySelector('td a');
                if (link && link.textContent.trim()) {
                    prodLabel = link.textContent.trim();
                    break;
                }
                prev = prev.previousElementSibling;
            }

            const orderedInput = document.getElementById('qty_ordered_0_' + lineIdx);
            const dispatchedInput = document.getElementById('qty_dispatched_0_' + lineIdx);
            const currentQtyInput = document.getElementById('qty_0_' + lineIdx);

            const qtyOrdered = orderedInput ? parseFloat(orderedInput.value) || 0 : (currentQtyInput ? parseFloat(currentQtyInput.value) || 0 : 0);
            const qtyDispatched = dispatchedInput ? parseFloat(dispatchedInput.value) || 0 : 0;
            const remaining = Math.max(0, qtyOrdered - qtyDispatched);

            // Warehouse select
            const whSelect = document.querySelector(`select[name="entrepot_0_${lineIdx}"]`);
            const warehouseVal = whSelect ? whSelect.value : '';

            lines.push({
                index: lineIdx,
                label: prodLabel,
                qtyOrdered: qtyOrdered,
                qtyDispatched: qtyDispatched,
                remaining: remaining,
                warehouse: warehouseVal
            });
        });

        return lines;
    }

    // Helper: Parse serial text
    function parseSerials(text, dedupe = true) {
        if (!text) return [];
        let list = text
            .split(/[\r\n,;\t]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        if (dedupe) {
            list = [...new Set(list)];
        }
        return list;
    }

    // Helper: Show on-screen toast
    function showToast(message) {
        const existing = document.querySelector('.doli-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'doli-toast';
        toast.innerHTML = `<span>✨</span><span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Main Modal Controller
    function openModal(preselectedLineIdx = null) {
        const lines = getProductLines();
        if (lines.length === 0) {
            alert('No serial-tracked lines found on this dispatch page.');
            return;
        }

        const existingModal = document.querySelector('.doli-modal-overlay');
        if (existingModal) existingModal.remove();

        const defaultIdx = preselectedLineIdx !== null ? preselectedLineIdx : lines[0].index;

        const overlay = document.createElement('div');
        overlay.className = 'doli-modal-overlay';

        let lineOptionsHtml = lines.map(l => {
            const isSel = l.index == defaultIdx ? 'selected' : '';
            return `<option value="${l.index}" ${isSel}>${l.label} (Remains: ${l.remaining} / Ordered: ${l.qtyOrdered})</option>`;
        }).join('');

        overlay.innerHTML = `
            <div class="doli-modal-card">
                <div class="doli-modal-header">
                    <h3>📦 Bulk Serial Number Importer</h3>
                    <button class="doli-modal-close" id="doli-btn-close">&times;</button>
                </div>
                <div class="doli-modal-body">
                    <div class="doli-form-group">
                        <label class="doli-form-label">
                            <span>Target Product Line:</span>
                            <span style="font-size: 11px; font-weight: normal; color: #64748b;">Choose the line to populate</span>
                        </label>
                        <select id="doli-select-line" class="doli-select">
                            ${lineOptionsHtml}
                        </select>
                    </div>

                    <div class="doli-form-group">
                        <div class="doli-form-label">
                            <span>Paste Serial Numbers:</span>
                            <label style="font-weight: normal; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                <input type="checkbox" id="doli-check-dedupe" checked> Remove duplicate serials
                            </label>
                        </div>
                        <textarea id="doli-textarea-serials" class="doli-textarea" placeholder="Paste serial numbers here (one per line, from Excel, CSV, or barcode scanner)...&#10;SN-0001&#10;SN-0002&#10;SN-0003..."></textarea>
                    </div>

                    <div class="doli-status-box">
                        <div>
                            Serials Detected: <strong id="doli-count-display" style="color: #2563eb; font-size: 15px;">0</strong>
                        </div>
                        <div>
                            <span id="doli-status-badge" class="doli-badge doli-badge-neutral">Waiting for input</span>
                        </div>
                    </div>

                    <div style="font-size: 11px; color: #64748b; line-height: 1.4; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px 12px; border-radius: 6px;">
                        💡 <strong>Tip:</strong> If you are importing > 80 serials, make sure your server's PHP <code>max_input_vars</code> is set to <code>5000</code> or import in batches of 80.
                    </div>
                </div>

                <div class="doli-modal-footer">
                    <div>
                        <button id="doli-btn-reset-line" class="doli-btn doli-btn-danger-light" title="Reset this line back to 1 row with full remaining qty">🔄 Reset Line</button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button id="doli-btn-cancel" class="doli-btn doli-btn-secondary">Cancel</button>
                        <button id="doli-btn-apply" class="doli-btn doli-btn-primary">⚡ Split & Populate Serials</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // UI references
        const selectLine = document.getElementById('doli-select-line');
        const textarea = document.getElementById('doli-textarea-serials');
        const countDisplay = document.getElementById('doli-count-display');
        const statusBadge = document.getElementById('doli-status-badge');
        const dedupeCheck = document.getElementById('doli-check-dedupe');
        const closeBtn = document.getElementById('doli-btn-close');
        const cancelBtn = document.getElementById('doli-btn-cancel');
        const applyBtn = document.getElementById('doli-btn-apply');
        const resetBtn = document.getElementById('doli-btn-reset-line');

        function updateStatus() {
            const serials = parseSerials(textarea.value, dedupeCheck.checked);
            const line = lines.find(l => l.index == selectLine.value);
            const count = serials.length;
            countDisplay.textContent = count;

            if (!line) return;

            if (count === 0) {
                statusBadge.className = 'doli-badge doli-badge-neutral';
                statusBadge.textContent = `Target: ${line.remaining}`;
            } else if (count === line.remaining) {
                statusBadge.className = 'doli-badge doli-badge-success';
                statusBadge.textContent = `✅ Perfect Match (${count}/${line.remaining})`;
            } else if (count < line.remaining) {
                statusBadge.className = 'doli-badge doli-badge-info';
                statusBadge.textContent = `ℹ️ Partial (${count}/${line.remaining})`;
            } else {
                statusBadge.className = 'doli-badge doli-badge-warning';
                statusBadge.textContent = `⚠️ Excess (${count}/${line.remaining})`;
            }
        }

        textarea.addEventListener('input', updateStatus);
        selectLine.addEventListener('change', updateStatus);
        dedupeCheck.addEventListener('change', updateStatus);
        updateStatus();

        closeBtn.onclick = () => overlay.remove();
        cancelBtn.onclick = () => overlay.remove();
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // Reset Line to 1 single row
        resetBtn.onclick = function () {
            const lineIdx = selectLine.value;
            const line = lines.find(l => l.index == lineIdx);
            const type = 'batch';

            if (!confirm(`Are you sure you want to reset this line?\nAll split rows for this item will be removed and remaining quantity (${line.remaining}) will be restored to row 1.`)) {
                return;
            }

            // Remove extra rows
            document.querySelectorAll(`tr[name^="${type}_"][name$="_${lineIdx}"]`).forEach(r => {
                if (r.getAttribute('name') !== `${type}_0_${lineIdx}`) {
                    r.remove();
                }
            });

            // Restore row 0
            const lotInput = document.getElementById(`lot_number_0_${lineIdx}`);
            const qtyInput = document.getElementById(`qty_0_${lineIdx}`);
            if (lotInput) lotInput.value = '';
            if (qtyInput) qtyInput.value = line.remaining;

            overlay.remove();
            showToast(`Line reset to single row with Qty ${line.remaining}.`);
        };

        // Apply Serials
        applyBtn.onclick = function () {
            const lineIdx = selectLine.value;
            const serials = parseSerials(textarea.value, dedupeCheck.checked);

            if (serials.length === 0) {
                alert('Please paste at least one serial number.');
                return;
            }

            const type = 'batch';
            const row0 = document.querySelector(`tr[name="${type}_0_${lineIdx}"]`);
            if (!row0) {
                alert(`Row tr[name="${type}_0_${lineIdx}"] not found.`);
                return;
            }

            // Clean up any previously split rows for this line
            document.querySelectorAll(`tr[name^="${type}_"][name$="_${lineIdx}"]`).forEach(r => {
                if (r.getAttribute('name') !== `${type}_0_${lineIdx}`) {
                    r.remove();
                }
            });

            const whSelect0 = row0.querySelector(`select[name="entrepot_0_${lineIdx}"]`);
            const whVal = whSelect0 ? whSelect0.value : '';

            // Setup row 0
            const lot0 = document.getElementById(`lot_number_0_${lineIdx}`);
            const qty0 = document.getElementById(`qty_0_${lineIdx}`);
            if (lot0) lot0.value = serials[0];
            if (qty0) qty0.value = 1;
            if (whSelect0 && whVal) whSelect0.value = whVal;

            // Clone rows 1 to N-1
            let lastRow = row0;
            const regex = new RegExp(`_0_${lineIdx}`, 'g');

            for (let k = 1; k < serials.length; k++) {
                const newRow = row0.cloneNode(true);

                // Strip select2 / datepicker UI residues
                newRow.querySelectorAll('.select2, .hasDatepicker, img.ui-datepicker-trigger').forEach(el => el.remove());

                // Replace attribute indexes
                newRow.innerHTML = newRow.innerHTML.replace(regex, `_${k}_${lineIdx}`);
                newRow.setAttribute('name', `${type}_${k}_${lineIdx}`);

                // Populate serial and qty
                const lotK = newRow.querySelector(`#lot_number_${k}_${lineIdx}`);
                const qtyK = newRow.querySelector(`#qty_${k}_${lineIdx}`);
                if (lotK) lotK.value = serials[k];
                if (qtyK) qtyK.value = 1;

                // Ensure warehouse select is visible & selected
                const whSelectK = newRow.querySelector(`select[name="entrepot_${k}_${lineIdx}"]`);
                if (whSelectK) {
                    whSelectK.style.display = 'inline-block';
                    if (whVal) whSelectK.value = whVal;
                }

                lastRow.parentNode.insertBefore(newRow, lastRow.nextSibling);
                lastRow = newRow;
            }

            overlay.remove();
            showToast(`✅ Successfully populated ${serials.length} serials for line ${parseInt(lineIdx) + 1}!`);

            // Scroll to the line
            row0.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
    }

    // In-page Enhancements
    function injectInPageButtons() {
        const rows = document.querySelectorAll('tr[name^="batch_0_"]');
        if (rows.length === 0) return;

        // 1. Add inline button next to split button for each batch row
        rows.forEach(row => {
            const lineIdx = row.getAttribute('name').split('_')[2];
            // Check if button already injected
            if (row.querySelector('.doli-bulk-btn')) return;

            // Look for split button or quantity cell
            const splitPicto = row.querySelector('.splitbutton') || row.querySelector('button.resetline');
            const targetContainer = splitPicto ? splitPicto.parentElement : row.querySelector('.qtydispatchinput')?.parentElement;

            if (targetContainer) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'doli-bulk-btn';
                btn.title = 'Paste multiple serial numbers from clipboard / Excel';
                btn.innerHTML = '<span>📋</span> <span>Bulk Serials</span>';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal(lineIdx);
                };
                targetContainer.appendChild(btn);
            }
        });

        // 2. Add Floating Action Button (FAB)
        if (!document.getElementById('doli-fab-importer')) {
            const fab = document.createElement('button');
            fab.id = 'doli-fab-importer';
            fab.type = 'button';
            fab.className = 'doli-fab-btn';
            fab.innerHTML = `
                <span>📦</span>
                <span>Bulk Serial Importer</span>
                <span class="doli-fab-badge">${rows.length}</span>
            `;
            fab.onclick = (e) => {
                e.preventDefault();
                openModal();
            };
            document.body.appendChild(fab);
        }
    }

    // Initialize after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectInPageButtons);
    } else {
        injectInPageButtons();
    }

    // Also watch for dynamic table updates
    setTimeout(injectInPageButtons, 1000);
})();
