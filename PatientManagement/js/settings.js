/**
 * Settings Module
 */

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthAndRedirect()) {
        initializeSettings();
    }
});

/**
 * Initialize settings page
 */
function initializeSettings() {
    loadSettingsData();
    setupEventListeners();
    initializeThemeButtons();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Hospital settings form
    const hospitalForm = getEl('hospitalSettingsForm');
    if (hospitalForm) hospitalForm.addEventListener('submit', saveHospitalSettings);

    // User profile form
    const profileForm = getEl('userProfileForm');
    if (profileForm) profileForm.addEventListener('submit', saveUserProfile);

    // Security form
    const securityForm = getEl('securityForm');
    if (securityForm) securityForm.addEventListener('submit', changePassword);

    // Notifications form
    const notificationsForm = getEl('notificationsForm');
    if (notificationsForm) notificationsForm.addEventListener('submit', saveNotifications);

    // Data management buttons
    const exportBtn = getEl('exportAllDataBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportAllData);

    const backupBtn = getEl('backupDataBtn');
    if (backupBtn) backupBtn.addEventListener('click', backupAllData);

    const clearBtn = getEl('clearDataBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        showConfirm('⚠️ WARNING: This will permanently delete all data! Are you absolutely sure?', clearAllData);
    });

    // Setup confirm dialog
    setupModalClose('confirmDialog');
}

/**
 * Load settings from storage
 */
function loadSettingsData() {
    // Load hospital settings
    const settings = storage.get('settings', {});
    getEl('hospitalName').value = settings.hospitalName || '';
    getEl('hospitalEmail').value = settings.hospitalEmail || '';
    getEl('hospitalPhone').value = settings.hospitalPhone || '';
    getEl('hospitalAddress').value = settings.hospitalAddress || '';
    getEl('hospitalLogoUrl').value = settings.hospitalLogoUrl || '';

    // Load user profile
    if (auth.currentUser) {
        getEl('userName').value = auth.currentUser.name || '';
        getEl('userEmail').value = auth.currentUser.email || '';
        getEl('userRole').value = capitalize(auth.currentUser.role) || '';
        getEl('userPhone').value = auth.currentUser.phone || '';
    }

    // Load notification preferences
    const notifPrefs = storage.get('notificationPreferences', {});
    getEl('emailNotifications').checked = notifPrefs.emailNotifications !== false;
    getEl('appointmentAlerts').checked = notifPrefs.appointmentAlerts !== false;
    getEl('patientAlerts').checked = notifPrefs.patientAlerts !== false;
    getEl('billingAlerts').checked = notifPrefs.billingAlerts !== false;

    // Load theme preference
    const currentTheme = localStorage.getItem('HMS_theme') || 'auto';
    setActiveThemeButton(currentTheme);
}

/**
 * Save hospital settings
 */
function saveHospitalSettings(e) {
    e.preventDefault();

    const settings = {
        hospitalName: getEl('hospitalName').value.trim(),
        hospitalEmail: getEl('hospitalEmail').value.trim(),
        hospitalPhone: getEl('hospitalPhone').value.trim(),
        hospitalAddress: getEl('hospitalAddress').value.trim(),
        hospitalLogoUrl: getEl('hospitalLogoUrl').value.trim()
    };

    if (!settings.hospitalName) {
        toastError('Hospital name is required');
        return;
    }

    storage.set('settings', settings);
    toastSuccess('Hospital settings saved successfully');
}

/**
 * Save user profile
 */
function saveUserProfile(e) {
    e.preventDefault();

    const name = getEl('userName').value.trim();
    const phone = getEl('userPhone').value.trim();

    if (!name) {
        toastError('Name is required');
        return;
    }

    if (phone && !isValidPhone(phone)) {
        toastError('Invalid phone number');
        return;
    }

    const result = auth.updateProfile({ name, phone });

    if (result.success) {
        toastSuccess('Profile updated successfully');
        // Update page
        loadSettingsData();
    } else {
        toastError(result.message || 'Error updating profile');
    }
}

/**
 * Change password
 */
function changePassword(e) {
    e.preventDefault();

    const currentPassword = getEl('currentPassword').value;
    const newPassword = getEl('newPassword').value;
    const confirmPassword = getEl('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        toastError('Please fill in all password fields');
        return;
    }

    if (!isValidPassword(newPassword)) {
        toastError('New password must be at least 6 characters');
        return;
    }

    if (newPassword !== confirmPassword) {
        toastError('Passwords do not match');
        return;
    }

    if (currentPassword === newPassword) {
        toastError('New password must be different from current password');
        return;
    }

    const result = auth.changePassword(currentPassword, newPassword);

    if (result.success) {
        toastSuccess('Password changed successfully');
        getEl('securityForm').reset();
    } else {
        toastError(result.message || 'Error changing password');
    }
}

/**
 * Save notification preferences
 */
function saveNotifications(e) {
    e.preventDefault();

    const preferences = {
        emailNotifications: getEl('emailNotifications').checked,
        appointmentAlerts: getEl('appointmentAlerts').checked,
        patientAlerts: getEl('patientAlerts').checked,
        billingAlerts: getEl('billingAlerts').checked
    };

    storage.set('notificationPreferences', preferences);
    toastSuccess('Notification preferences saved');
}

/**
 * Initialize theme buttons
 */
function initializeThemeButtons() {
    const lightBtn = getEl('lightThemeBtn');
    const darkBtn = getEl('darkThemeBtn');
    const autoBtn = getEl('autoThemeBtn');

    if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));
    if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
    if (autoBtn) autoBtn.addEventListener('click', () => setTheme('auto'));
}

/**
 * Set theme
 */
function setTheme(theme) {
    localStorage.setItem('HMS_theme', theme);
    setActiveThemeButton(theme);

    if (theme === 'light') {
        document.body.classList.remove('dark-mode');
        updateThemeToggle();
        toastSuccess('Switched to light mode');
    } else if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeToggle();
        toastSuccess('Switched to dark mode');
    } else {
        // Auto mode - remove the explicit setting
        document.body.classList.remove('dark-mode');
        updateThemeToggle();
        toastSuccess('Switched to auto mode');
    }
}

/**
 * Set active theme button
 */
function setActiveThemeButton(theme) {
    const lightBtn = getEl('lightThemeBtn');
    const darkBtn = getEl('darkThemeBtn');
    const autoBtn = getEl('autoThemeBtn');

    [lightBtn, darkBtn, autoBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    if (theme === 'light' && lightBtn) {
        lightBtn.classList.add('active');
    } else if (theme === 'dark' && darkBtn) {
        darkBtn.classList.add('active');
    } else if (autoBtn) {
        autoBtn.classList.add('active');
    }
}

/**
 * Export all data
 */
function exportAllData() {
    const data = storage.exportAll();
    const filename = `medicare-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toastSuccess('Data exported successfully');
}

/**
 * Backup all data
 */
function backupAllData() {
    storage.backupToFile();
    toastSuccess('Data backed up successfully');
}

/**
 * Clear all data
 */
function clearAllData() {
    storage.clear();
    storage.initializeDefaultData();
    toastSuccess('All data has been cleared and reset');
    
    // Refresh page after delay
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Add styles for theme buttons
const style = document.createElement('style');
style.textContent = `
    .theme-option.active {
        border-color: var(--primary);
        background: rgba(59, 130, 246, 0.2);
    }
    
    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 4px;
        transition: var(--transition);
    }
    
    .btn-icon:hover {
        transform: scale(1.2);
    }
    
    .btn-icon.edit {
        color: #3b82f6;
    }
    
    .btn-icon.delete {
        color: #ef4444;
    }
`;
document.head.appendChild(style);
