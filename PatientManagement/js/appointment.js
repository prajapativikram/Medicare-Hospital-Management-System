/**
 * Appointment Management Module
 */

let currentAppointmentPage = 1;
const APPOINTMENTS_PER_PAGE = 10;
let allAppointments = [];
let filteredAppointments = [];
let editingAppointmentId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializeAppointmentManagement();
    }
});

/**
 * Initialize appointment management page
 */
function initializeAppointmentManagement() {
    loadAppointments();
    setupEventListeners();
    populateSelects();
    displayAppointments();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Book appointment button
    const bookBtn = getEl('bookAppointmentBtn');
    if (bookBtn) bookBtn.addEventListener('click', openBookAppointmentModal);

    // Search
    const searchInput = getEl('searchAppointment');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Status filter
    const statusFilter = getEl('filterStatus');
    if (statusFilter) statusFilter.addEventListener('change', handleFilter);

    // Form submission
    const form = getEl('appointmentForm');
    if (form) form.addEventListener('submit', handleSaveAppointment);

    // Export CSV
    const exportBtn = getEl('exportAppointmentsCsv');
    if (exportBtn) exportBtn.addEventListener('click', exportAppointmentsCSV);

    // Pagination
    const prevBtn = getEl('prevBtn');
    const nextBtn = getEl('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);

    // Modal close
    setupModalClose('appointmentModal', resetAppointmentForm);
    setupModalClose('confirmDialog');
}

/**
 * Load appointments from storage
 */
function loadAppointments() {
    allAppointments = AppointmentManager.getAll();
    filteredAppointments = [...allAppointments];
}

/**
 * Display appointments in table
 */
function displayAppointments() {
    const totalPages = getTotalPages(filteredAppointments.length, APPOINTMENTS_PER_PAGE);

    if (currentAppointmentPage > totalPages && totalPages > 0) {
        currentAppointmentPage = totalPages;
    }

    const pageAppointments = getPage(filteredAppointments, currentAppointmentPage, APPOINTMENTS_PER_PAGE);
    const tbody = getEl('appointmentsTable');

    if (!tbody) return;

    if (pageAppointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No appointments found</td></tr>';
    } else {
        tbody.innerHTML = pageAppointments.map(apt => {
            const patient = PatientManager.getById(apt.patientId);
            const doctor = DoctorManager.getById(apt.doctorId);

            return `
                <tr>
                    <td><strong>${apt.id}</strong></td>
                    <td>${patient ? patient.name : 'Unknown'}</td>
                    <td>${doctor ? doctor.name : 'Unknown'}</td>
                    <td>${formatDateDisplay(apt.date)}</td>
                    <td>${formatTime(apt.time)}</td>
                    <td><span class="status-badge ${apt.status}">${capitalize(apt.status)}</span></td>
                    <td>${truncate(apt.reason, 30)}</td>
                    <td>
                        <button class="btn-icon edit" onclick="editAppointment('${apt.id}')" title="Edit">✏️</button>
                        <button class="btn-icon delete" onclick="deleteAppointment('${apt.id}')" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updatePaginationInfo(currentAppointmentPage, totalPages);
    updatePaginationButtons(currentAppointmentPage, totalPages);
}

/**
 * Handle search
 */
function handleSearch(e) {
    const query = e.target.value.trim();
    currentAppointmentPage = 1;

    if (query) {
        filteredAppointments = AppointmentManager.search(query);
    } else {
        applyFilters();
    }

    displayAppointments();
}

/**
 * Handle filters
 */
function handleFilter() {
    currentAppointmentPage = 1;
    applyFilters();
    displayAppointments();
}

/**
 * Apply filters
 */
function applyFilters() {
    const status = getEl('filterStatus')?.value;

    if (status) {
        filteredAppointments = AppointmentManager.filter({ status });
    } else {
        filteredAppointments = [...allAppointments];
    }
}

/**
 * Open book appointment modal
 */
function openBookAppointmentModal() {
    editingAppointmentId = null;
    resetAppointmentForm();
    getEl('modalTitle').textContent = 'Book Appointment';
    getEl('appointmentId').value = generateAppointmentId();
    const today = new Date().toISOString().split('T')[0];
    getEl('appointmentDate').min = today;
    openModal('appointmentModal');
}

/**
 * Edit appointment
 */
function editAppointment(id) {
    const apt = AppointmentManager.getById(id);
    if (!apt) return;

    editingAppointmentId = id;
    getEl('modalTitle').textContent = 'Edit Appointment';

    getEl('appointmentId').value = apt.id;
    getEl('appointmentPatient').value = apt.patientId;
    getEl('appointmentDoctor').value = apt.doctorId;
    getEl('appointmentDate').value = apt.date;
    getEl('appointmentTime').value = apt.time;
    getEl('appointmentReason').value = apt.reason;
    getEl('appointmentStatus').value = apt.status;

    openModal('appointmentModal');
}

/**
 * Delete appointment
 */
function deleteAppointment(id) {
    showConfirm('Are you sure you want to cancel this appointment?', () => {
        AppointmentManager.delete(id);
        loadAppointments();
        applyFilters();
        displayAppointments();
        toastSuccess('Appointment cancelled successfully');
    });
}

/**
 * Handle save appointment
 */
function handleSaveAppointment(e) {
    e.preventDefault();

    // Validation
    const patientId = getEl('appointmentPatient').value;
    const doctorId = getEl('appointmentDoctor').value;
    const date = getEl('appointmentDate').value;
    const time = getEl('appointmentTime').value;
    const reason = getEl('appointmentReason').value.trim();
    const status = getEl('appointmentStatus').value;

    if (!patientId || !doctorId || !date || !time || !reason || !status) {
        toastError('Please fill in all required fields');
        return;
    }

    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
        toastError('Appointment date cannot be in the past');
        return;
    }

    if (reason.length < 5) {
        toastError('Please provide a detailed reason (at least 5 characters)');
        return;
    }

    const appointmentData = {
        patientId,
        doctorId,
        date,
        time,
        reason,
        status
    };

    try {
        if (editingAppointmentId) {
            AppointmentManager.update(editingAppointmentId, appointmentData);
            toastSuccess('Appointment updated successfully');
        } else {
            AppointmentManager.add({ ...appointmentData, id: getEl('appointmentId').value });
            toastSuccess('Appointment booked successfully');
        }

        closeModal('appointmentModal');
        loadAppointments();
        applyFilters();
        displayAppointments();
    } catch (error) {
        toastError('Error saving appointment');
        console.error(error);
    }
}

/**
 * Reset appointment form
 */
function resetAppointmentForm() {
    const form = getEl('appointmentForm');
    if (form) form.reset();
    editingAppointmentId = null;

    queryAll('.error-msg').forEach(el => el.textContent = '');
}

/**
 * Populate select dropdowns
 */
function populateSelects() {
    // Patient dropdown
    const patientSelect = getEl('appointmentPatient');
    if (patientSelect) {
        const patients = PatientManager.getAll();
        patientSelect.innerHTML = '<option value="">Select Patient</option>' +
            patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    // Doctor dropdown
    const doctorSelect = getEl('appointmentDoctor');
    if (doctorSelect) {
        const doctors = DoctorManager.getAll();
        doctorSelect.innerHTML = '<option value="">Select Doctor</option>' +
            doctors.map(d => `<option value="${d.id}">${d.name} (${d.department})</option>`).join('');
    }
}

/**
 * Export appointments to CSV
 */
function exportAppointmentsCSV() {
    const appointments = filteredAppointments.length > 0 ? filteredAppointments : allAppointments;

    if (appointments.length === 0) {
        toastError('No appointments to export');
        return;
    }

    const exportData = appointments.map(apt => {
        const patient = PatientManager.getById(apt.patientId);
        const doctor = DoctorManager.getById(apt.doctorId);

        return {
            'Appointment ID': apt.id,
            'Patient': patient ? patient.name : 'Unknown',
            'Doctor': doctor ? doctor.name : 'Unknown',
            'Date': formatDateDisplay(apt.date),
            'Time': formatTime(apt.time),
            'Status': capitalize(apt.status),
            'Reason': apt.reason
        };
    });

    exportToCSV(exportData, 'appointments.csv');
}

/**
 * Go to previous page
 */
function goToPreviousPage() {
    if (currentAppointmentPage > 1) {
        currentAppointmentPage--;
        displayAppointments();
    }
}

/**
 * Go to next page
 */
function goToNextPage() {
    const totalPages = getTotalPages(filteredAppointments.length, APPOINTMENTS_PER_PAGE);
    if (currentAppointmentPage < totalPages) {
        currentAppointmentPage++;
        displayAppointments();
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
