/**
 * Dashboard Module
 */

let patientsChart, revenueChart;

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializeDashboard();
    }
});

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    updateStatistics();
    createCharts();
    populateRecentData();
}

/**
 * Update dashboard statistics
 */
function updateStatistics() {
    const stats = storage.getStatistics();

    getEl('totalPatients').textContent = stats.totalPatients;
    getEl('totalDoctors').textContent = stats.totalDoctors;
    getEl('todayAppointments').textContent = stats.todayAppointments;
    getEl('totalRevenue').textContent = formatCurrency(stats.totalRevenue);

    // Animate stat numbers
    animateCounter('totalPatients', stats.totalPatients);
    animateCounter('totalDoctors', stats.totalDoctors);
    animateCounter('todayAppointments', stats.todayAppointments);
}

/**
 * Animate counter effect
 */
function animateCounter(elementId, finalValue) {
    const element = getEl(elementId);
    if (!element) return;

    let currentValue = 0;
    const increment = Math.ceil(finalValue / 30);
    const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            element.textContent = finalValue;
            clearInterval(interval);
        } else {
            element.textContent = currentValue;
        }
    }, 30);
}

/**
 * Create charts
 */
function createCharts() {
    const patients = PatientManager.getAll();
    const invoices = BillingManager.getAll();

    // Monthly Patients Chart
    const patientsCtx = getEl('patientsChart');
    if (patientsCtx) {
        const monthlyData = getMonthlyPatientData(patients);
        
        patientsChart = new Chart(patientsCtx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'New Patients',
                    data: monthlyData.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#6b7280' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#6b7280' },
                        grid: { color: '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: '#6b7280' },
                        grid: { color: '#e5e7eb' }
                    }
                }
            }
        });
    }

    // Revenue Chart
    const revenueCtx = getEl('revenueChart');
    if (revenueCtx) {
        const monthlyRevenue = getMonthlyRevenueData(invoices);
        
        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: monthlyRevenue.labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: monthlyRevenue.data,
                    backgroundColor: '#8b5cf6',
                    borderColor: '#7c3aed',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#6b7280' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#6b7280' },
                        grid: { color: '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: '#6b7280' },
                        grid: { color: '#e5e7eb' }
                    }
                }
            }
        });
    }
}

/**
 * Get monthly patient data
 */
function getMonthlyPatientData(patients) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = new Array(12).fill(0);

    patients.forEach(patient => {
        const date = new Date(patient.createdAt || patient.admissionDate);
        const month = date.getMonth();
        data[month]++;
    });

    return {
        labels: months,
        data: data
    };
}

/**
 * Get monthly revenue data
 */
function getMonthlyRevenueData(invoices) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = new Array(12).fill(0);

    invoices.forEach(invoice => {
        const date = new Date(invoice.date);
        const month = date.getMonth();
        const total = BillingManager.calculateTotal(invoice);
        data[month] += total;
    });

    return {
        labels: months,
        data: data.map(v => parseFloat(v.toFixed(2)))
    };
}

/**
 * Populate recent appointments
 */
function populateRecentData() {
    // Recent appointments
    const appointments = AppointmentManager.getAll();
    const recentAppointments = appointments.slice(-5).reverse();
    
    const appointmentsTbody = getEl('recentAppointmentsTable');
    if (appointmentsTbody) {
        if (recentAppointments.length === 0) {
            appointmentsTbody.innerHTML = '<tr><td colspan="5" class="empty-state">No appointments</td></tr>';
        } else {
            appointmentsTbody.innerHTML = recentAppointments.map(apt => {
                const patient = PatientManager.getById(apt.patientId);
                const doctor = DoctorManager.getById(apt.doctorId);
                
                return `
                    <tr>
                        <td>${patient ? patient.name : 'Unknown'}</td>
                        <td>${doctor ? doctor.name : 'Unknown'}</td>
                        <td>${formatDateDisplay(apt.date)}</td>
                        <td>${formatTime(apt.time)}</td>
                        <td><span class="status-badge ${apt.status}">${capitalize(apt.status)}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Latest patients
    const patients = PatientManager.getAll();
    const latestPatients = patients.slice(-5).reverse();
    
    const patientsTbody = getEl('latestPatientsTable');
    if (patientsTbody) {
        if (latestPatients.length === 0) {
            patientsTbody.innerHTML = '<tr><td colspan="4" class="empty-state">No patients</td></tr>';
        } else {
            patientsTbody.innerHTML = latestPatients.map(patient => `
                <tr>
                    <td><strong>${patient.id}</strong></td>
                    <td>${patient.name}</td>
                    <td>${formatPhone(patient.phone)}</td>
                    <td><span class="status-badge ${patient.status}">${capitalize(patient.status)}</span></td>
                </tr>
            `).join('');
        }
    }
}

// Refresh dashboard data periodically
setInterval(() => {
    updateStatistics();
    populateRecentData();
}, 30000); // Refresh every 30 seconds
