/**
 * Reports Module
 */

let currentReportType = 'patient';
let charts = {};
let reportStartDate = null;
let reportEndDate = null;

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializeReports();
    }
});

/**
 * Initialize reports
 */
function initializeReports() {
    setupEventListeners();
    setDefaultDateRange();
    generatePatientReport();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Report buttons
    getEl('patientReportBtn')?.addEventListener('click', () => {
        currentReportType = 'patient';
        generatePatientReport();
    });

    getEl('doctorReportBtn')?.addEventListener('click', () => {
        currentReportType = 'doctor';
        generateDoctorReport();
    });

    getEl('appointmentReportBtn')?.addEventListener('click', () => {
        currentReportType = 'appointment';
        generateAppointmentReport();
    });

    getEl('revenueReportBtn')?.addEventListener('click', () => {
        currentReportType = 'revenue';
        generateRevenueReport();
    });

    // Filter button
    getEl('applyFilterBtn')?.addEventListener('click', applyDateFilter);

    // Export button
    getEl('exportReportCsv')?.addEventListener('click', exportReportCSV);
}

/**
 * Set default date range (last 30 days)
 */
function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    reportEndDate = endDate.toISOString().split('T')[0];
    reportStartDate = startDate.toISOString().split('T')[0];

    getEl('reportStartDate').value = reportStartDate;
    getEl('reportEndDate').value = reportEndDate;
}

/**
 * Apply date filter
 */
function applyDateFilter() {
    reportStartDate = getEl('reportStartDate').value;
    reportEndDate = getEl('reportEndDate').value;

    if (!reportStartDate || !reportEndDate) {
        toastError('Please select both start and end dates');
        return;
    }

    switch (currentReportType) {
        case 'patient':
            generatePatientReport();
            break;
        case 'doctor':
            generateDoctorReport();
            break;
        case 'appointment':
            generateAppointmentReport();
            break;
        case 'revenue':
            generateRevenueReport();
            break;
    }
}

/**
 * Filter data by date range
 */
function filterByDateRange(data, dateField = 'date') {
    return data.filter(item => {
        const itemDate = item[dateField] || item.createdAt;
        return itemDate >= reportStartDate && itemDate <= reportEndDate;
    });
}

/**
 * Generate patient report
 */
function generatePatientReport() {
    const patients = PatientManager.getAll();
    const filteredPatients = filterByDateRange(patients, 'admissionDate');

    updateReportUI('Patient Report', 'patient');
    
    // Chart 1: Patients by Status
    createDoughnutChart('patientTrendChart', 'Patients by Status',
        groupByKey(filteredPatients, 'status'));

    // Chart 2: Patients by Blood Group
    createDoughnutChart('departmentChart', 'Patients by Blood Group',
        groupByKey(filteredPatients, 'bloodGroup'));

    // Table data
    const tableData = filteredPatients.map((p, idx) => ({
        'ID': p.id,
        'Name': p.name,
        'Count': ++idx,
        'Date': formatDateDisplay(p.admissionDate)
    }));

    updateReportTable(tableData);
    updateReportStats(filteredPatients.length, 0, filteredPatients.length);
}

/**
 * Generate doctor report
 */
function generateDoctorReport() {
    const doctors = DoctorManager.getAll();

    updateReportUI('Doctor Report', 'doctor');

    // Chart 1: Doctors by Department
    createDoughnutChart('patientTrendChart', 'Doctors by Department',
        groupByKey(doctors, 'department'));

    // Chart 2: Doctors by Experience
    const experienceGroups = {
        '0-5 years': doctors.filter(d => d.experience <= 5).length,
        '6-10 years': doctors.filter(d => d.experience > 5 && d.experience <= 10).length,
        '10+ years': doctors.filter(d => d.experience > 10).length
    };

    createBarChart('departmentChart', 'Doctors by Experience', experienceGroups);

    // Table data
    const tableData = doctors.map(d => ({
        'Doctor ID': d.id,
        'Name': d.name,
        'Department': d.department,
        'Experience': `${d.experience} years`
    }));

    updateReportTable(tableData);
    updateReportStats(doctors.length, 0, doctors.length);
}

/**
 * Generate appointment report
 */
function generateAppointmentReport() {
    const appointments = AppointmentManager.getAll();
    const filteredAppointments = filterByDateRange(appointments, 'date');

    updateReportUI('Appointment Report', 'appointment');

    // Chart 1: Appointments by Status
    createDoughnutChart('patientTrendChart', 'Appointments by Status',
        groupByKey(filteredAppointments, 'status'));

    // Chart 2: Appointments Timeline
    createLineChart('departmentChart', 'Appointments Timeline', filteredAppointments);

    // Table data
    const tableData = filteredAppointments.map(apt => {
        const doctor = DoctorManager.getById(apt.doctorId);
        return {
            'Appointment ID': apt.id,
            'Doctor': doctor ? doctor.name : 'Unknown',
            'Status': capitalize(apt.status),
            'Date': formatDateDisplay(apt.date)
        };
    });

    updateReportTable(tableData);
    updateReportStats(filteredAppointments.length, 0, filteredAppointments.length);
}

/**
 * Generate revenue report
 */
function generateRevenueReport() {
    const invoices = BillingManager.getAll();
    const filteredInvoices = filterByDateRange(invoices, 'date');

    updateReportUI('Revenue Report', 'revenue');

    // Calculate revenue data
    const totalRevenue = sumByKey(filteredInvoices, 'doctorFee') +
                        sumByKey(filteredInvoices, 'medicineCost') +
                        sumByKey(filteredInvoices, 'roomCharges') +
                        sumByKey(filteredInvoices, 'labCharges');

    // Chart 1: Revenue Sources
    const revenueSources = {
        'Doctor Fee': sumByKey(filteredInvoices, 'doctorFee'),
        'Medicine': sumByKey(filteredInvoices, 'medicineCost'),
        'Room Charges': sumByKey(filteredInvoices, 'roomCharges'),
        'Lab Charges': sumByKey(filteredInvoices, 'labCharges')
    };

    createPieChart('patientTrendChart', 'Revenue Sources', revenueSources);

    // Chart 2: Monthly Revenue Trend
    createRevenueChart('departmentChart', 'Monthly Revenue Trend', filteredInvoices);

    // Table data
    const tableData = filteredInvoices.map(inv => ({
        'Invoice ID': inv.id,
        'Amount': formatCurrency(BillingManager.calculateTotal(inv)),
        'Status': 'Paid',
        'Date': formatDateDisplay(inv.date)
    }));

    updateReportTable(tableData);
    const avgRevenue = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;
    updateReportStats(filteredInvoices.length, totalRevenue, avgRevenue);
}

/**
 * Update report UI
 */
function updateReportUI(title, type) {
    getEl('reportTableTitle').textContent = title;
    getEl('chart1Title').textContent = `${title} - Overview`;
    getEl('chart2Title').textContent = `${title} - Trend`;
    getEl('chart3Title').textContent = `${title} - Distribution`;
    getEl('chart4Title').textContent = `${title} - Details`;
}

/**
 * Create doughnut chart
 */
function createDoughnutChart(canvasId, label, data) {
    const ctx = getEl(canvasId);
    if (!ctx) return;

    const chartData = Object.keys(data);
    const chartCounts = chartData.map(key => data[key].length);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData,
            datasets: [{
                data: chartCounts,
                backgroundColor: colors.slice(0, chartData.length),
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#6b7280' } }
            }
        }
    });
}

/**
 * Create pie chart
 */
function createPieChart(canvasId, label, data) {
    const ctx = getEl(canvasId);
    if (!ctx) return;

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#6b7280' } }
            }
        }
    });
}

/**
 * Create bar chart
 */
function createBarChart(canvasId, label, data) {
    const ctx = getEl(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: label,
                data: Object.values(data),
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#6b7280' } },
                x: { ticks: { color: '#6b7280' } }
            }
        }
    });
}

/**
 * Create line chart
 */
function createLineChart(canvasId, label, data) {
    const ctx = getEl(canvasId);
    if (!ctx) return;

    const dailyData = {};
    data.forEach(item => {
        const date = item.date;
        dailyData[date] = (dailyData[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyData).sort();

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: label,
                data: sortedDates.map(d => dailyData[d]),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#6b7280' } },
                x: { ticks: { color: '#6b7280' } }
            }
        }
    });
}

/**
 * Create revenue chart
 */
function createRevenueChart(canvasId, label, invoices) {
    const ctx = getEl(canvasId);
    if (!ctx) return;

    const monthlyRevenue = {};
    invoices.forEach(inv => {
        const date = new Date(inv.date);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        const total = BillingManager.calculateTotal(inv);
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + total;
    });

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(monthlyRevenue),
            datasets: [{
                label: 'Revenue ($)',
                data: Object.values(monthlyRevenue),
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#6b7280' } },
                x: { ticks: { color: '#6b7280' } }
            }
        }
    });
}

/**
 * Update report table
 */
function updateReportTable(data) {
    const tbody = getEl('reportTable');
    if (!tbody || data.length === 0) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No data</td></tr>';
        return;
    }

    const headers = Object.keys(data[0]);
    const thead = getEl('reportTableHead');
    if (thead) {
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    }

    tbody.innerHTML = data.slice(0, 10).map(row =>
        `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
    ).join('');
}

/**
 * Update report statistics
 */
function updateReportStats(totalRecords, totalRevenue, averageValue) {
    getEl('totalRecords').textContent = totalRecords;
    getEl('reportTotalRevenue').textContent = formatCurrency(totalRevenue);
    getEl('averageValue').textContent = formatCurrency(averageValue);
}

/**
 * Export report to CSV
 */
function exportReportCSV() {
    const tbody = getEl('reportTable');
    const thead = getEl('reportTableHead');

    if (!tbody || !thead) {
        toastError('No report data to export');
        return;
    }

    const headers = Array.from(thead.querySelectorAll('th')).map(th => th.textContent);
    const rows = Array.from(tbody.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent)
    );

    const csvData = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${currentReportType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toastSuccess('Report exported successfully');
}
