/**
 * Utility Functions for Hospital Management System
 */

// ===========================
// DOM Manipulation Utilities
// ===========================

/**
 * Safely get element by ID
 */
function getEl(id) {
    return document.getElementById(id);
}

/**
 * Query selector
 */
function query(selector) {
    return document.querySelector(selector);
}

/**
 * Query selector all
 */
function queryAll(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Add event listener with multiple events support
 */
function on(element, event, handler) {
    if (!element) return;
    
    if (Array.isArray(element)) {
        element.forEach(el => el.addEventListener(event, handler));
    } else if (typeof element === 'string') {
        document.addEventListener(event, handler);
    } else {
        element.addEventListener(event, handler);
    }
}

/**
 * Remove event listener
 */
function off(element, event, handler) {
    if (element && typeof element === 'object') {
        element.removeEventListener(event, handler);
    }
}

/**
 * Add class to element
 */
function addClass(element, className) {
    if (element) {
        if (Array.isArray(element)) {
            element.forEach(el => el.classList.add(className));
        } else {
            element.classList.add(className);
        }
    }
}

/**
 * Remove class from element
 */
function removeClass(element, className) {
    if (element) {
        if (Array.isArray(element)) {
            element.forEach(el => el.classList.remove(className));
        } else {
            element.classList.remove(className);
        }
    }
}

/**
 * Toggle class on element
 */
function toggleClass(element, className) {
    if (element) {
        if (Array.isArray(element)) {
            element.forEach(el => el.classList.toggle(className));
        } else {
            element.classList.toggle(className);
        }
    }
}

/**
 * Check if element has class
 */
function hasClass(element, className) {
    return element && element.classList.contains(className);
}

/**
 * Show element
 */
function show(element) {
    if (element) removeClass(element, 'hidden');
}

/**
 * Hide element
 */
function hide(element) {
    if (element) addClass(element, 'hidden');
}

/**
 * Toggle visibility
 */
function toggle(element) {
    if (element) toggleClass(element, 'hidden');
}

// ===========================
// String & Format Utilities
// ===========================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    if (typeof date === 'string') return date;
    if (!date) return '';
    
    const d = new Date(date);
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let day = String(d.getDate()).padStart(2, '0');
    let year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 */
function formatDateDisplay(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format time from 24-hour to 12-hour format
 */
function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
}

/**
 * Format phone number
 */
function formatPhone(phone) {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    return phone;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

/**
 * Truncate text
 */
function truncate(text, length = 50) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// ===========================
// Validation Utilities
// ===========================

/**
 * Validate email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate phone number
 */
function isValidPhone(phone) {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate date
 */
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    return password && password.length >= 6;
}

/**
 * Check if required fields are filled
 */
function hasRequiredFields(fields) {
    return fields.every(field => {
        if (typeof field === 'string') return field.trim() !== '';
        if (field instanceof HTMLElement) {
            if (field.type === 'checkbox' || field.type === 'radio') {
                return field.checked;
            }
            return field.value.trim() !== '';
        }
        return false;
    });
}

// ===========================
// ID Generation
// ===========================

/**
 * Generate unique ID
 */
function generateId(prefix = 'ID') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate patient ID
 */
function generatePatientId() {
    return `P-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate doctor ID
 */
function generateDoctorId() {
    return `D-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate appointment ID
 */
function generateAppointmentId() {
    return `APT-${Date.now().toString().slice(-6)}`;
}

/**
 * Generate invoice ID
 */
function generateInvoiceId() {
    return `INV-${Date.now().toString().slice(-6)}`;
}

// ===========================
// Toast Notifications
// ===========================

/**
 * Show toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = getEl('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    show(toast);

    setTimeout(() => {
        hide(toast);
    }, duration);
}

/**
 * Show success toast
 */
function toastSuccess(message) {
    showToast(message, 'success');
}

/**
 * Show error toast
 */
function toastError(message) {
    showToast(message, 'error', 4000);
}

/**
 * Show warning toast
 */
function toastWarning(message) {
    showToast(message, 'warning', 3500);
}

/**
 * Show info toast
 */
function toastInfo(message) {
    showToast(message, 'info');
}

// ===========================
// Modal Utilities
// ===========================

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = getEl(modalId);
    if (modal) show(modal);
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = getEl(modalId);
    if (modal) hide(modal);
}

/**
 * Toggle modal
 */
function toggleModal(modalId) {
    const modal = getEl(modalId);
    if (modal) toggle(modal);
}

/**
 * Setup modal close handlers
 */
function setupModalClose(modalId, onClose = null) {
    const modal = getEl(modalId);
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(modalId);
            if (onClose) onClose();
        });
    }

    const cancelBtn = modal.querySelector('.btn-cancel, #cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(modalId);
            if (onClose) onClose();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
            if (onClose) onClose();
        }
    });
}

// ===========================
// Confirmation Dialog
// ===========================

/**
 * Show confirmation dialog
 */
function showConfirm(message, onConfirm, onCancel = null) {
    const confirmDialog = getEl('confirmDialog');
    if (!confirmDialog) return;

    getEl('confirmMessage').textContent = message;
    show(confirmDialog);

    const confirmBtn = getEl('confirmBtn');
    const cancelBtn = getEl('cancelConfirmBtn');

    const handleConfirm = () => {
        hide(confirmDialog);
        if (onConfirm) onConfirm();
        cleanup();
    };

    const handleCancel = () => {
        hide(confirmDialog);
        if (onCancel) onCancel();
        cleanup();
    };

    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

// ===========================
// Array Utilities
// ===========================

/**
 * Remove duplicates from array
 */
function removeDuplicates(array, key = null) {
    if (!key) return [...new Set(array)];
    
    const seen = new Set();
    return array.filter(item => {
        const val = key ? item[key] : item;
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
    });
}

/**
 * Sort array of objects
 */
function sortByKey(array, key, ascending = true) {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) return ascending ? -1 : 1;
        if (a[key] > b[key]) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Filter array by key value
 */
function filterByKey(array, key, value) {
    if (!value) return array;
    return array.filter(item => item[key] == value);
}

/**
 * Group array by key
 */
function groupByKey(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = item[key];
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
        return groups;
    }, {});
}

/**
 * Sum array values by key
 */
function sumByKey(array, key) {
    return array.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

/**
 * Average array values by key
 */
function averageByKey(array, key) {
    if (array.length === 0) return 0;
    return sumByKey(array, key) / array.length;
}

// ===========================
// CSV Export
// ===========================

/**
 * Export array to CSV
 */
function exportToCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
        toastError('No data to export');
        return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header =>
                JSON.stringify(row[header] || '')
            ).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toastSuccess('Data exported successfully');
}

// ===========================
// Pagination Utilities
// ===========================

/**
 * Paginate array
 */
function paginate(array, pageSize = 10) {
    const totalPages = Math.ceil(array.length / pageSize);
    const pages = [];
    
    for (let i = 0; i < totalPages; i++) {
        pages.push(array.slice(i * pageSize, (i + 1) * pageSize));
    }
    
    return pages;
}

/**
 * Get page from array
 */
function getPage(array, pageNumber = 1, pageSize = 10) {
    const start = (pageNumber - 1) * pageSize;
    const end = start + pageSize;
    return array.slice(start, end);
}

/**
 * Get total pages
 */
function getTotalPages(arrayLength, pageSize = 10) {
    return Math.ceil(arrayLength / pageSize);
}

// ===========================
// Theme Utilities
// ===========================

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeToggle();
}

/**
 * Set dark mode
 */
function setDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', enabled);
    updateThemeToggle();
}

/**
 * Update theme toggle button
 */
function updateThemeToggle() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const toggleBtn = getEl('themToggle');
    if (toggleBtn) {
        toggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

/**
 * Initialize theme
 */
function initializeTheme() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
    }
    updateThemeToggle();
}

// ===========================
// Sidebar Utilities
// ===========================

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    const sidebar = query('.sidebar');
    if (sidebar) toggleClass(sidebar, 'active');
}

/**
 * Close sidebar
 */
function closeSidebar() {
    const sidebar = query('.sidebar');
    if (sidebar) removeClass(sidebar, 'active');
}

/**
 * Setup sidebar toggle
 */
function setupSidebarToggle() {
    const toggleBtn = getEl('sidebarToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    // Close sidebar on link click
    queryAll('.nav-item').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = query('.sidebar');
        const toggleBtn = getEl('sidebarToggle');
        if (sidebar && toggleBtn && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            closeSidebar();
        }
    });
}

// ===========================
// Initialization
// ===========================

/**
 * Initialize utilities on page load
 */
function initializeUtils() {
    initializeTheme();
    setupSidebarToggle();
    setupThemeToggle();
}

/**
 * Setup theme toggle button
 */
function setupThemeToggle() {
    const themeToggle = getEl('themToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUtils);
} else {
    initializeUtils();
}
