/**
 * Patient Management Module
 */

let currentPatientPage = 1;
const PATIENTS_PER_PAGE = 10;
let allPatients = [];
let filteredPatients = [];
let editingPatientId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializePatientManagement();
    }
});

/**
 * Initialize patient management page
 */
function initializePatientManagement() {
    loadPatients();
    setupEventListeners();
    populateDoctorSelect();
    displayPatients();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add patient button
    const addBtn = getEl('addPatientBtn');
    if (addBtn) addBtn.addEventListener('click', openAddPatientModal);

    // Search
    const searchInput = getEl('searchPatient');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Filters
    const statusFilter = getEl('filterStatus');
    const bloodFilter = getEl('filterBloodGroup');
    if (statusFilter) statusFilter.addEventListener('change', handleFilter);
    if (bloodFilter) bloodFilter.addEventListener('change', handleFilter);

    // Form submission
    const form = getEl('patientForm');
    if (form) form.addEventListener('submit', handleSavePatient);

    // Export CSV
    const exportBtn = getEl('exportPatientsCsv');
    if (exportBtn) exportBtn.addEventListener('click', exportPatientsCSV);

    // Pagination
    const prevBtn = getEl('prevBtn');
    const nextBtn = getEl('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => goToPreviousPage());
    if (nextBtn) nextBtn.addEventListener('click', () => goToNextPage());

    // Modal close
    setupModalClose('patientModal', resetPatientForm);
    setupModalClose('confirmDialog');

    // Real-time calculation for form validation
    const ageInput = getEl('patientAge');
    if (ageInput) {
        ageInput.addEventListener('change', () => {
            validateAge();
        });
    }

    // Dynamic total calculation for billing
    setupDynamicCalculations();
}

/**
 * Load patients from storage
 */
function loadPatients() {
    allPatients = PatientManager.getAll();
    filteredPatients = [...allPatients];
}

/**
 * Display patients in table
 */
function displayPatients() {
    const totalPages = getTotalPages(filteredPatients.length, PATIENTS_PER_PAGE);
    
    // Clamp current page
    if (currentPatientPage > totalPages && totalPages > 0) {
        currentPatientPage = totalPages;
    }
    
    const pagePatients = getPage(filteredPatients, currentPatientPage, PATIENTS_PER_PAGE);
    const tbody = getEl('patientsTable');

    if (!tbody) return;

    if (pagePatients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No patients found</td></tr>';
    } else {
        tbody.innerHTML = pagePatients.map(patient => `
            <tr>
                <td><strong>${patient.id}</strong></td>
                <td>${patient.name}</td>
                <td>${patient.age}</td>
                <td>${formatPhone(patient.phone)}</td>
                <td><span class="status-badge ${patient.bloodGroup.toLowerCase()}">${patient.bloodGroup}</span></td>
                <td><span class="status-badge ${patient.status}">${capitalize(patient.status)}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="editPatient('${patient.id}')" title="Edit">✏️</button>
                    <button class="btn-icon delete" onclick="deletePatient('${patient.id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    updatePaginationInfo(currentPatientPage, totalPages);
    updatePaginationButtons(currentPatientPage, totalPages);
}

/**
 * Handle search
 */
function handleSearch(e) {
    const query = e.target.value.trim();
    currentPatientPage = 1;
    
    if (query) {
        filteredPatients = PatientManager.search(query);
    } else {
        applyFilters();
    }
    
    displayPatients();
}

/**
 * Handle filters
 */
function handleFilter() {
    currentPatientPage = 1;
    applyFilters();
    displayPatients();
}

/**
 * Apply filters
 */
function applyFilters() {
    const status = getEl('filterStatus')?.value;
    const bloodGroup = getEl('filterBloodGroup')?.value;

    const criteria = {};
    if (status) criteria.status = status;
    if (bloodGroup) criteria.bloodGroup = bloodGroup;

    if (Object.keys(criteria).length > 0) {
        filteredPatients = PatientManager.filter(criteria);
    } else {
        filteredPatients = [...allPatients];
    }
}

/**
 * Open add patient modal
 */
function openAddPatientModal() {
    editingPatientId = null;
    resetPatientForm();
    getEl('modalTitle').textContent = 'Add Patient';
    getEl('patientId').value = generatePatientId();
    openModal('patientModal');
}

/**
 * Edit patient
 */
function editPatient(id) {
    const patient = PatientManager.getById(id);
    if (!patient) return;

    editingPatientId = id;
    getEl('modalTitle').textContent = 'Edit Patient';
    
    // Populate form
    getEl('patientId').value = patient.id;
    getEl('patientName').value = patient.name;
    getEl('patientAge').value = patient.age;
    getEl('patientGender').value = patient.gender;
    getEl('patientPhone').value = patient.phone;
    getEl('patientEmail').value = patient.email;
    getEl('patientAddress').value = patient.address;
    getEl('patientBloodGroup').value = patient.bloodGroup;
    getEl('patientDisease').value = patient.disease;
    getEl('patientDoctor').value = patient.doctorAssigned;
    getEl('patientAdmissionDate').value = patient.admissionDate;
    getEl('patientStatus').value = patient.status;

    openModal('patientModal');
}

/**
 * Delete patient
 */
function deletePatient(id) {
    showConfirm('Are you sure you want to delete this patient?', () => {
        PatientManager.delete(id);
        loadPatients();
        applyFilters();
        displayPatients();
        toastSuccess('Patient deleted successfully');
    });
}

/**
 * Handle save patient
 */
function handleSavePatient(e) {
    e.preventDefault();

    // Validation
    const name = getEl('patientName').value.trim();
    const age = getEl('patientAge').value;
    const gender = getEl('patientGender').value;
    const phone = getEl('patientPhone').value.trim();
    const email = getEl('patientEmail').value.trim();
    const address = getEl('patientAddress').value.trim();
    const bloodGroup = getEl('patientBloodGroup').value;
    const disease = getEl('patientDisease').value.trim();
    const doctor = getEl('patientDoctor').value;
    const admissionDate = getEl('patientAdmissionDate').value;
    const status = getEl('patientStatus').value;

    if (!name || !age || !gender || !phone || !address || !bloodGroup || !disease || !doctor || !admissionDate || !status) {
        toastError('Please fill in all required fields');
        return;
    }

    if (!isValidPhone(phone)) {
        toastError('Please enter a valid phone number');
        return;
    }

    if (email && !isValidEmail(email)) {
        toastError('Please enter a valid email address');
        return;
    }

    if (parseInt(age) < 1 || parseInt(age) > 120) {
        toastError('Age must be between 1 and 120');
        return;
    }

    const patientData = {
        name,
        age: parseInt(age),
        gender,
        phone,
        email,
        address,
        bloodGroup,
        disease,
        doctorAssigned: doctor,
        admissionDate,
        status
    };

    try {
        if (editingPatientId) {
            PatientManager.update(editingPatientId, patientData);
            toastSuccess('Patient updated successfully');
        } else {
            PatientManager.add({ ...patientData, id: getEl('patientId').value });
            toastSuccess('Patient added successfully');
        }

        closeModal('patientModal');
        loadPatients();
        applyFilters();
        displayPatients();
    } catch (error) {
        toastError('Error saving patient');
        console.error(error);
    }
}

/**
 * Reset patient form
 */
function resetPatientForm() {
    const form = getEl('patientForm');
    if (form) form.reset();
    editingPatientId = null;
    
    // Clear error messages
    queryAll('.error-msg').forEach(el => el.textContent = '');
}

/**
 * Populate doctor select dropdown
 */
function populateDoctorSelect() {
    const doctorSelect = getEl('patientDoctor');
    if (!doctorSelect) return;

    const doctors = DoctorManager.getAll();
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>' +
        doctors.map(doc => `<option value="${doc.id}">${doc.name} (${doc.department})</option>`).join('');
}

/**
 * Validate age
 */
function validateAge() {
    const age = parseInt(getEl('patientAge').value);
    const ageError = getEl('ageError');
    
    if (age < 1 || age > 120) {
        ageError.textContent = 'Age must be between 1 and 120';
    } else {
        ageError.textContent = '';
    }
}

/**
 * Setup dynamic calculations
 */
function setupDynamicCalculations() {
    // This can be extended for other dynamic calculations
}

/**
 * Export patients to CSV
 */
function exportPatientsCSV() {
    const patients = filteredPatients.length > 0 ? filteredPatients : allPatients;
    
    if (patients.length === 0) {
        toastError('No patients to export');
        return;
    }

    const exportData = patients.map(p => ({
        'Patient ID': p.id,
        'Name': p.name,
        'Age': p.age,
        'Gender': p.gender,
        'Phone': p.phone,
        'Email': p.email,
        'Blood Group': p.bloodGroup,
        'Disease': p.disease,
        'Status': p.status,
        'Admission Date': formatDateDisplay(p.admissionDate)
    }));

    exportToCSV(exportData, 'patients.csv');
}

/**
 * Go to previous page
 */
function goToPreviousPage() {
    if (currentPatientPage > 1) {
        currentPatientPage--;
        displayPatients();
    }
}

/**
 * Go to next page
 */
function goToNextPage() {
    const totalPages = getTotalPages(filteredPatients.length, PATIENTS_PER_PAGE);
    if (currentPatientPage < totalPages) {
        currentPatientPage++;
        displayPatients();
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

/**
 * Sort table
 */
function sortTable(column) {
    if (column === 'patientId') {
        filteredPatients = sortByKey(filteredPatients, 'id');
    } else if (column === 'name') {
        filteredPatients = sortByKey(filteredPatients, 'name');
    }
    currentPatientPage = 1;
    displayPatients();
}
