/**
 * Billing/Invoice Management Module
 */

let currentInvoicePage = 1;
const INVOICES_PER_PAGE = 10;
let allInvoices = [];
let filteredInvoices = [];
let editingInvoiceId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializeBillingManagement();
    }
});

/**
 * Initialize billing management page
 */
function initializeBillingManagement() {
    loadInvoices();
    setupEventListeners();
    populatePatientSelect();
    displayInvoices();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Generate invoice button
    const generateBtn = getEl('generateInvoiceBtn');
    if (generateBtn) generateBtn.addEventListener('click', openGenerateInvoiceModal);

    // Search
    const searchInput = getEl('searchInvoice');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Form submission
    const form = getEl('invoiceForm');
    if (form) form.addEventListener('submit', handleSaveInvoice);

    // Real-time calculation
    const inputs = queryAll('#invoiceForm input[type="number"], #invoiceForm input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('change', calculateInvoiceTotal);
        input.addEventListener('input', calculateInvoiceTotal);
    });

    // Export CSV
    const exportBtn = getEl('exportBillingCsv');
    if (exportBtn) exportBtn.addEventListener('click', exportBillingCSV);

    // Pagination
    const prevBtn = getEl('prevBtn');
    const nextBtn = getEl('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);

    // Modal close
    setupModalClose('invoiceModal', resetInvoiceForm);
    setupModalClose('viewInvoiceModal');

    // Invoice action buttons
    const printBtn = getEl('printBtn');
    if (printBtn) printBtn.addEventListener('click', printInvoice);

    const downloadBtn = getEl('downloadPdfBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadInvoicePDF);

    const closeViewBtn = getEl('closeViewBtn');
    if (closeViewBtn) closeViewBtn.addEventListener('click', () => closeModal('viewInvoiceModal'));
}

/**
 * Load invoices from storage
 */
function loadInvoices() {
    allInvoices = BillingManager.getAll();
    filteredInvoices = [...allInvoices];
}

/**
 * Display invoices in table
 */
function displayInvoices() {
    const totalPages = getTotalPages(filteredInvoices.length, INVOICES_PER_PAGE);

    if (currentInvoicePage > totalPages && totalPages > 0) {
        currentInvoicePage = totalPages;
    }

    const pageInvoices = getPage(filteredInvoices, currentInvoicePage, INVOICES_PER_PAGE);
    const tbody = getEl('invoicesTable');

    if (!tbody) return;

    if (pageInvoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-state">No invoices found</td></tr>';
    } else {
        tbody.innerHTML = pageInvoices.map(invoice => {
            const patient = PatientManager.getById(invoice.patientId);
            const total = BillingManager.calculateTotal(invoice);

            return `
                <tr>
                    <td><strong>${invoice.id}</strong></td>
                    <td>${patient ? patient.name : 'Unknown'}</td>
                    <td>${formatDateDisplay(invoice.date)}</td>
                    <td>${formatCurrency(invoice.doctorFee)}</td>
                    <td>${formatCurrency(invoice.medicineCost)}</td>
                    <td>${formatCurrency(invoice.roomCharges)}</td>
                    <td>${formatCurrency(invoice.labCharges)}</td>
                    <td>${invoice.tax}%</td>
                    <td>${formatCurrency(invoice.discount)}</td>
                    <td><strong>${formatCurrency(total)}</strong></td>
                    <td>
                        <button class="btn-icon" onclick="viewInvoice('${invoice.id}')" title="View">👁️</button>
                        <button class="btn-icon edit" onclick="editInvoice('${invoice.id}')" title="Edit">✏️</button>
                        <button class="btn-icon delete" onclick="deleteInvoice('${invoice.id}')" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updatePaginationInfo(currentInvoicePage, totalPages);
    updatePaginationButtons(currentInvoicePage, totalPages);
}

/**
 * Handle search
 */
function handleSearch(e) {
    const query = e.target.value.trim();
    currentInvoicePage = 1;

    if (query) {
        filteredInvoices = allInvoices.filter(inv =>
            inv.id.toLowerCase().includes(query.toLowerCase())
        );
    } else {
        filteredInvoices = [...allInvoices];
    }

    displayInvoices();
}

/**
 * Open generate invoice modal
 */
function openGenerateInvoiceModal() {
    editingInvoiceId = null;
    resetInvoiceForm();
    getEl('modalTitle').textContent = 'Generate Invoice';
    getEl('invoiceId').value = generateInvoiceId();
    getEl('invoiceDate').value = new Date().toISOString().split('T')[0];
    openModal('invoiceModal');
}

/**
 * Edit invoice
 */
function editInvoice(id) {
    const invoice = BillingManager.getById(id);
    if (!invoice) return;

    editingInvoiceId = id;
    getEl('modalTitle').textContent = 'Edit Invoice';

    getEl('invoiceId').value = invoice.id;
    getEl('invoicePatient').value = invoice.patientId;
    getEl('invoiceDate').value = invoice.date;
    getEl('invoiceDoctorFee').value = invoice.doctorFee;
    getEl('invoiceMedicineCost').value = invoice.medicineCost;
    getEl('invoiceRoomCharges').value = invoice.roomCharges;
    getEl('invoiceLabCharges').value = invoice.labCharges;
    getEl('invoiceTax').value = invoice.tax;
    getEl('invoiceDiscount').value = invoice.discount;
    getEl('invoiceNotes').value = invoice.notes || '';

    calculateInvoiceTotal();
    openModal('invoiceModal');
}

/**
 * Delete invoice
 */
function deleteInvoice(id) {
    showConfirm('Are you sure you want to delete this invoice?', () => {
        BillingManager.delete(id);
        loadInvoices();
        displayInvoices();
        toastSuccess('Invoice deleted successfully');
    });
}

/**
 * View invoice
 */
function viewInvoice(id) {
    const invoice = BillingManager.getById(id);
    if (!invoice) return;

    const patient = PatientManager.getById(invoice.patientId);
    const settings = storage.get('settings', {});
    const total = BillingManager.calculateTotal(invoice);
    const subtotal = parseFloat(invoice.doctorFee) + parseFloat(invoice.medicineCost) +
                    parseFloat(invoice.roomCharges) + parseFloat(invoice.labCharges);
    const taxAmount = subtotal * (parseFloat(invoice.tax) / 100);

    const invoiceContent = `
        <div class="invoice-header">
            <div>
                <div class="invoice-title">INVOICE</div>
                <div>${settings.hospitalName || 'Hospital'}</div>
                <div>${settings.hospitalAddress || 'Address'}</div>
            </div>
            <div style="text-align: right;">
                <div><strong>Invoice ID:</strong> ${invoice.id}</div>
                <div><strong>Date:</strong> ${formatDateDisplay(invoice.date)}</div>
            </div>
        </div>

        <div class="invoice-details">
            <div>
                <div><strong>Bill To:</strong></div>
                <div>${patient ? patient.name : 'N/A'}</div>
                <div>${patient ? formatPhone(patient.phone) : 'N/A'}</div>
            </div>
            <div style="text-align: right;">
                <div><strong>Hospital Contact:</strong></div>
                <div>${settings.hospitalPhone || 'N/A'}</div>
                <div>${settings.hospitalEmail || 'N/A'}</div>
            </div>
        </div>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Doctor Fee</td>
                    <td style="text-align: right;">${formatCurrency(invoice.doctorFee)}</td>
                </tr>
                <tr>
                    <td>Medicine Cost</td>
                    <td style="text-align: right;">${formatCurrency(invoice.medicineCost)}</td>
                </tr>
                <tr>
                    <td>Room Charges</td>
                    <td style="text-align: right;">${formatCurrency(invoice.roomCharges)}</td>
                </tr>
                <tr>
                    <td>Lab Charges</td>
                    <td style="text-align: right;">${formatCurrency(invoice.labCharges)}</td>
                </tr>
            </tbody>
        </table>

        <div class="invoice-totals">
            <div class="invoice-total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="invoice-total-row">
                <span>Tax (${invoice.tax}%):</span>
                <span>${formatCurrency(taxAmount)}</span>
            </div>
            <div class="invoice-total-row">
                <span>Discount:</span>
                <span>${formatCurrency(invoice.discount)}</span>
            </div>
            <div class="invoice-total-row" style="font-size: 1.25rem; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
                <span>Total Amount Due:</span>
                <span>${formatCurrency(total)}</span>
            </div>
        </div>

        ${invoice.notes ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                <strong>Notes:</strong><br>
                ${invoice.notes}
            </div>
        ` : ''}

        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 0.9rem;">
            <p>Thank you for choosing ${settings.hospitalName || 'our Hospital'}!</p>
        </div>
    `;

    getEl('invoiceContent').innerHTML = invoiceContent;
    openModal('viewInvoiceModal');
}

/**
 * Calculate invoice total
 */
function calculateInvoiceTotal() {
    const doctorFee = parseFloat(getEl('invoiceDoctorFee')?.value || 0);
    const medicineCost = parseFloat(getEl('invoiceMedicineCost')?.value || 0);
    const roomCharges = parseFloat(getEl('invoiceRoomCharges')?.value || 0);
    const labCharges = parseFloat(getEl('invoiceLabCharges')?.value || 0);
    const taxPercent = parseFloat(getEl('invoiceTax')?.value || 0);
    const discount = parseFloat(getEl('invoiceDiscount')?.value || 0);

    const subtotal = doctorFee + medicineCost + roomCharges + labCharges;
    const taxAmount = subtotal * (taxPercent / 100);
    const total = subtotal + taxAmount - discount;

    getEl('subtotalAmount').textContent = formatCurrency(subtotal);
    getEl('taxAmount').textContent = formatCurrency(taxAmount);
    getEl('discountAmount').textContent = formatCurrency(discount);
    getEl('totalAmount').textContent = formatCurrency(total);
}

/**
 * Handle save invoice
 */
function handleSaveInvoice(e) {
    e.preventDefault();

    const patientId = getEl('invoicePatient').value;
    const date = getEl('invoiceDate').value;
    const doctorFee = getEl('invoiceDoctorFee').value;
    const medicineCost = getEl('invoiceMedicineCost').value;
    const roomCharges = getEl('invoiceRoomCharges').value;
    const labCharges = getEl('invoiceLabCharges').value;
    const tax = getEl('invoiceTax').value;
    const discount = getEl('invoiceDiscount').value;

    if (!patientId || !date || !doctorFee || !medicineCost || !roomCharges || !labCharges || !tax || discount === '') {
        toastError('Please fill in all required fields');
        return;
    }

    const invoiceData = {
        patientId,
        date,
        doctorFee: parseFloat(doctorFee),
        medicineCost: parseFloat(medicineCost),
        roomCharges: parseFloat(roomCharges),
        labCharges: parseFloat(labCharges),
        tax: parseFloat(tax),
        discount: parseFloat(discount),
        notes: getEl('invoiceNotes').value
    };

    try {
        if (editingInvoiceId) {
            BillingManager.update(editingInvoiceId, invoiceData);
            toastSuccess('Invoice updated successfully');
        } else {
            BillingManager.add({ ...invoiceData, id: getEl('invoiceId').value });
            toastSuccess('Invoice generated successfully');
        }

        closeModal('invoiceModal');
        loadInvoices();
        displayInvoices();
    } catch (error) {
        toastError('Error saving invoice');
        console.error(error);
    }
}

/**
 * Reset invoice form
 */
function resetInvoiceForm() {
    const form = getEl('invoiceForm');
    if (form) form.reset();
    editingInvoiceId = null;
    calculateInvoiceTotal();
}

/**
 * Populate patient select
 */
function populatePatientSelect() {
    const patientSelect = getEl('invoicePatient');
    if (!patientSelect) return;

    const patients = PatientManager.getAll();
    patientSelect.innerHTML = '<option value="">Select Patient</option>' +
        patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

/**
 * Print invoice
 */
function printInvoice() {
    const printWindow = window.open('', '', 'width=800,height=600');
    const content = getEl('invoiceContent').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .invoice-content { max-width: 800px; margin: 0 auto; }
                .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .invoice-table th { background-color: #3b82f6; color: white; }
                .invoice-totals { text-align: right; margin: 20px 0; }
                .invoice-total-row { display: flex; justify-content: flex-end; gap: 20px; margin: 5px 0; }
            </style>
        </head>
        <body>
            ${content}
            <script>window.print();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * Download invoice as PDF
 */
function downloadInvoicePDF() {
    const content = getEl('invoiceContent');
    const opt = {
        margin: 10,
        filename: 'invoice.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(content).save();
    } else {
        toastError('PDF library not available');
    }
}

/**
 * Export billing to CSV
 */
function exportBillingCSV() {
    const invoices = filteredInvoices.length > 0 ? filteredInvoices : allInvoices;

    if (invoices.length === 0) {
        toastError('No invoices to export');
        return;
    }

    const exportData = invoices.map(inv => {
        const patient = PatientManager.getById(inv.patientId);
        const total = BillingManager.calculateTotal(inv);

        return {
            'Invoice ID': inv.id,
            'Patient': patient ? patient.name : 'Unknown',
            'Date': formatDateDisplay(inv.date),
            'Doctor Fee': formatCurrency(inv.doctorFee),
            'Medicine Cost': formatCurrency(inv.medicineCost),
            'Room Charges': formatCurrency(inv.roomCharges),
            'Lab Charges': formatCurrency(inv.labCharges),
            'Tax (%)': inv.tax,
            'Discount': formatCurrency(inv.discount),
            'Total': formatCurrency(total)
        };
    });

    exportToCSV(exportData, 'billing.csv');
}

/**
 * Go to previous page
 */
function goToPreviousPage() {
    if (currentInvoicePage > 1) {
        currentInvoicePage--;
        displayInvoices();
    }
}

/**
 * Go to next page
 */
function goToNextPage() {
    const totalPages = getTotalPages(filteredInvoices.length, INVOICES_PER_PAGE);
    if (currentInvoicePage < totalPages) {
        currentInvoicePage++;
        displayInvoices();
    }
}

/**
 * Update pagination info
 */
function updatePaginationInfo(currentPage, totalPages) {
    const pageInfo = getEl('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'No data';
    }
}

/**
 * Update pagination buttons
 */
function updatePaginationButtons(currentPage, totalPages) {
    const prevBtn = getEl('prevBtn');
    const nextBtn = getEl('nextBtn');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}
