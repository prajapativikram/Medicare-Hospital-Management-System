/**
 * Doctor Management Module
 */

let currentDoctorPage = 1;
const DOCTORS_PER_PAGE = 8;
let allDoctors = [];
let filteredDoctors = [];
let editingDoctorId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializeDoctorManagement();
    }
});

/**
 * Initialize doctor management page
 */
function initializeDoctorManagement() {
    loadDoctors();
    setupEventListeners();
    displayDoctors();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add doctor button
    const addBtn = getEl('addDoctorBtn');
    if (addBtn) addBtn.addEventListener('click', openAddDoctorModal);

    // Search
    const searchInput = getEl('searchDoctor');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Department filter
    const departmentFilter = getEl('filterDepartment');
    if (departmentFilter) departmentFilter.addEventListener('change', handleFilter);

    // Form submission
    const form = getEl('doctorForm');
    if (form) form.addEventListener('submit', handleSaveDoctor);

    // Export CSV
    const exportBtn = getEl('exportDoctorsCsv');
    if (exportBtn) exportBtn.addEventListener('click', exportDoctorsCSV);

    // Pagination
    const prevBtn = getEl('prevBtn');
    const nextBtn = getEl('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);

    // Modal close
    setupModalClose('doctorModal', resetDoctorForm);
    setupModalClose('confirmDialog');
}

/**
 * Load doctors from storage
 */
function loadDoctors() {
    allDoctors = DoctorManager.getAll();
    filteredDoctors = [...allDoctors];
}

/**
 * Display doctors in grid
 */
function displayDoctors() {
    const totalPages = getTotalPages(filteredDoctors.length, DOCTORS_PER_PAGE);
    
    if (currentDoctorPage > totalPages && totalPages > 0) {
        currentDoctorPage = totalPages;
    }

    const pageDoctors = getPage(filteredDoctors, currentDoctorPage, DOCTORS_PER_PAGE);
    const grid = getEl('doctorsGrid');

    if (!grid) return;

    if (pageDoctors.length === 0) {
        grid.innerHTML = '<div class="empty-state">No doctors found</div>';
    } else {
        grid.innerHTML = pageDoctors.map(doctor => `
            <div class="doctor-card">
                <img src="${doctor.photo || 'https://via.placeholder.com/150?text=Dr'}" alt="${doctor.name}" class="doctor-photo">
                <div class="doctor-info">
                    <div class="doctor-name">${doctor.name}</div>
                    <div class="doctor-detail">
                        <span>🏥</span>
                        <span>${doctor.department}</span>
                    </div>
                    <div class="doctor-detail">
                        <span>📚</span>
                        <span>${doctor.qualification}</span>
                    </div>
                    <div class="doctor-detail">
                        <span>⏱️</span>
                        <span>${doctor.experience} years experience</span>
                    </div>
                    <div class="doctor-detail">
                        <span>📞</span>
                        <span>${formatPhone(doctor.phone)}</span>
                    </div>
                    <div class="doctor-detail">
                        <span>⏰</span>
                        <span>${doctor.availability}</span>
                    </div>
                    <div class="doctor-actions">
                        <button class="edit-btn" onclick="editDoctor('${doctor.id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteDoctor('${doctor.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updatePaginationInfo(currentDoctorPage, totalPages);
    updatePaginationButtons(currentDoctorPage, totalPages);
}

/**
 * Handle search
 */
function handleSearch(e) {
    const query = e.target.value.trim();
    currentDoctorPage = 1;

    if (query) {
        filteredDoctors = DoctorManager.search(query);
    } else {
        applyFilters();
    }

    displayDoctors();
}

/**
 * Handle filters
 */
function handleFilter() {
    currentDoctorPage = 1;
    applyFilters();
    displayDoctors();
}

/**
 * Apply filters
 */
function applyFilters() {
    const department = getEl('filterDepartment')?.value;

    if (department) {
        filteredDoctors = DoctorManager.filter({ department });
    } else {
        filteredDoctors = [...allDoctors];
    }
}

/**
 * Open add doctor modal
 */
function openAddDoctorModal() {
    editingDoctorId = null;
    resetDoctorForm();
    getEl('modalTitle').textContent = 'Add Doctor';
    getEl('doctorId').value = generateDoctorId();
    openModal('doctorModal');
}

/**
 * Edit doctor
 */
function editDoctor(id) {
    const doctor = DoctorManager.getById(id);
    if (!doctor) return;

    editingDoctorId = id;
    getEl('modalTitle').textContent = 'Edit Doctor';

    getEl('doctorId').value = doctor.id;
    getEl('doctorName').value = doctor.name;
    getEl('doctorDepartment').value = doctor.department;
    getEl('doctorExperience').value = doctor.experience;
    getEl('doctorPhone').value = doctor.phone;
    getEl('doctorEmail').value = doctor.email;
    getEl('doctorQualification').value = doctor.qualification;
    getEl('doctorAvailability').value = doctor.availability;
    getEl('doctorSalary').value = doctor.salary;
    getEl('doctorPhoto').value = doctor.photo;

    openModal('doctorModal');
}

/**
 * Delete doctor
 */
function deleteDoctor(id) {
    showConfirm('Are you sure you want to delete this doctor?', () => {
        DoctorManager.delete(id);
        loadDoctors();
        applyFilters();
        displayDoctors();
        toastSuccess('Doctor deleted successfully');
    });
}

/**
 * Handle save doctor
 */
function handleSaveDoctor(e) {
    e.preventDefault();

    // Validation
    const name = getEl('doctorName').value.trim();
    const department = getEl('doctorDepartment').value;
    const experience = getEl('doctorExperience').value;
    const phone = getEl('doctorPhone').value.trim();
    const email = getEl('doctorEmail').value.trim();
    const qualification = getEl('doctorQualification').value.trim();
    const availability = getEl('doctorAvailability').value;
    const salary = getEl('doctorSalary').value;

    if (!name || !department || !experience || !phone || !email || !qualification || !availability || !salary) {
        toastError('Please fill in all required fields');
        return;
    }

    if (!isValidPhone(phone)) {
        toastError('Please enter a valid phone number');
        return;
    }

    if (!isValidEmail(email)) {
        toastError('Please enter a valid email address');
        return;
    }

    if (parseInt(experience) < 0) {
        toastError('Experience cannot be negative');
        return;
    }

    if (parseFloat(salary) < 0) {
        toastError('Salary cannot be negative');
        return;
    }

    const doctorData = {
        name,
        department,
        experience: parseInt(experience),
        phone,
        email,
        qualification,
        availability,
        salary: parseFloat(salary),
        photo: getEl('doctorPhoto').value || 'https://via.placeholder.com/150?text=Dr'
    };

    try {
        if (editingDoctorId) {
            DoctorManager.update(editingDoctorId, doctorData);
            toastSuccess('Doctor updated successfully');
        } else {
            DoctorManager.add({ ...doctorData, id: getEl('doctorId').value });
            toastSuccess('Doctor added successfully');
        }

        closeModal('doctorModal');
        loadDoctors();
        applyFilters();
        displayDoctors();
    } catch (error) {
        toastError('Error saving doctor');
        console.error(error);
    }
}

/**
 * Reset doctor form
 */
function resetDoctorForm() {
    const form = getEl('doctorForm');
    if (form) form.reset();
    editingDoctorId = null;

    queryAll('.error-msg').forEach(el => el.textContent = '');
}

/**
 * Export doctors to CSV
 */
function exportDoctorsCSV() {
    const doctors = filteredDoctors.length > 0 ? filteredDoctors : allDoctors;

    if (doctors.length === 0) {
        toastError('No doctors to export');
        return;
    }

    const exportData = doctors.map(d => ({
        'Doctor ID': d.id,
        'Name': d.name,
        'Department': d.department,
        'Experience (Years)': d.experience,
        'Phone': d.phone,
        'Email': d.email,
        'Qualification': d.qualification,
        'Availability': d.availability,
        'Salary': formatCurrency(d.salary)
    }));

    exportToCSV(exportData, 'doctors.csv');
}

/**
 * Go to previous page
 */
function goToPreviousPage() {
    if (currentDoctorPage > 1) {
        currentDoctorPage--;
        displayDoctors();
    }
}

/**
 * Go to next page
 */
function goToNextPage() {
    const totalPages = getTotalPages(filteredDoctors.length, DOCTORS_PER_PAGE);
    if (currentDoctorPage < totalPages) {
        currentDoctorPage++;
        displayDoctors();
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

window.editDoctor = editDoctor;
window.deleteDoctor = deleteDoctor;
