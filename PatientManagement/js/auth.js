/**
 * Authentication Module for Hospital Management System
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.loadSession();
    }

    /**
     * Load existing session
     */
    loadSession() {
        const session = localStorage.getItem('HMS_currentUser');
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
                this.isAuthenticated = true;
            } catch (error) {
                console.error('Error loading session:', error);
                this.logout();
            }
        }
    }

    /**
     * Login user
     */
    login(email, password) {
        const users = storage.get('users', []);
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        this.currentUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone
        };
        this.isAuthenticated = true;

        localStorage.setItem('HMS_currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('HMS_loginTime', new Date().toISOString());

        return { success: true, user: this.currentUser };
    }

    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('HMS_currentUser');
        localStorage.removeItem('HMS_loginTime');
        window.location.href = 'login.html';
    }

    /**
     * Register new user (admin only)
     */
    register(email, password, name, role) {
        const users = storage.get('users', []);

        // Check if email already exists
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            id: `U-${Date.now()}`,
            email,
            password, // In production, use proper hashing
            name,
            role: role || 'staff',
            phone: ''
        };

        users.push(newUser);
        storage.set('users', users);

        return { success: true, user: newUser };
    }

    /**
     * Change password
     */
    changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'Not logged in' };
        }

        const users = storage.get('users', []);
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        if (users[userIndex].password !== currentPassword) {
            return { success: false, message: 'Current password is incorrect' };
        }

        users[userIndex].password = newPassword;
        storage.set('users', users);

        return { success: true, message: 'Password changed successfully' };
    }

    /**
     * Update user profile
     */
    updateProfile(updates) {
        if (!this.currentUser) {
            return { success: false, message: 'Not logged in' };
        }

        const users = storage.get('users', []);
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        users[userIndex] = {
            ...users[userIndex],
            ...updates,
            id: this.currentUser.id, // Don't allow ID change
            email: this.currentUser.email // Don't allow email change through profile update
        };

        storage.set('users', users);

        // Update current user
        this.currentUser = {
            id: users[userIndex].id,
            email: users[userIndex].email,
            name: users[userIndex].name,
            role: users[userIndex].role,
            phone: users[userIndex].phone
        };

        localStorage.setItem('HMS_currentUser', JSON.stringify(this.currentUser));

        return { success: true, user: this.currentUser };
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if logged in
     */
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser;
    }

    /**
     * Check if user has role
     */
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    /**
     * Verify session
     */
    verifySession() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    /**
     * Get session expiry (useful for implementing expiry in future)
     */
    getSessionInfo() {
        const loginTime = localStorage.getItem('HMS_loginTime');
        return {
            user: this.currentUser,
            loginTime: loginTime,
            isActive: this.isAuthenticated
        };
    }
}

// Initialize auth manager
const auth = new AuthManager();

// ===========================
// Login Page Handler
// ===========================

if (document.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = getEl('loginForm');
        const forgotLink = getEl('forgotLink');
        const resetForm = getEl('resetForm');
        const forgotModal = getEl('forgotModal');

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                openModal('forgotModal');
            });
        }

        if (resetForm) {
            resetForm.addEventListener('submit', handleForgotPassword);
        }

        if (forgotModal) {
            setupModalClose('forgotModal');
        }

        // Check if already logged in
        if (auth.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }
    });
}

/**
 * Handle login form submission
 */
function handleLogin(e) {
    e.preventDefault();

    const email = getEl('email').value.trim();
    const password = getEl('password').value.trim();
    const remember = getEl('remember').checked;

    // Validation
    if (!email || !password) {
        toastError('Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        getEl('emailError').textContent = 'Invalid email address';
        return;
    } else {
        getEl('emailError').textContent = '';
    }

    // Attempt login
    const result = auth.login(email, password);

    if (result.success) {
        if (remember) {
            localStorage.setItem('HMS_rememberEmail', email);
        }
        toastSuccess('Login successful!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } else {
        toastError(result.message || 'Login failed');
    }
}

/**
 * Handle forgot password form
 */
function handleForgotPassword(e) {
    e.preventDefault();

    const email = getEl('resetEmail').value.trim();

    if (!isValidEmail(email)) {
        toastError('Please enter a valid email address');
        return;
    }

    // In a real app, this would send an email
    toastSuccess('Password reset link sent to ' + email);
    closeModal('forgotModal');
    getEl('resetForm').reset();
}



function checkAuthAndRedirect() {
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Check auth on protected pages
if (!document.location.pathname.includes('index.html') && 
    !document.location.pathname.includes('login.html')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        if (!checkAuthAndRedirect()) return;

        // Update user info in navbar
        const userName = getEl('userName');
        const userRole = getEl('userRole');
        
        if (userName) userName.textContent = auth.currentUser.name;
        if (userRole) userRole.textContent = capitalize(auth.currentUser.role);

        // Setup logout button
        const logoutBtn = getEl('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                showConfirm('Are you sure you want to logout?', () => {
                    auth.logout();
                });
            });
        }

        // Restore remembered email on login page
        if (document.location.pathname.includes('login.html')) {
            const savedEmail = localStorage.getItem('HMS_rememberEmail');
            if (savedEmail) {
                getEl('email').value = savedEmail;
                getEl('remember').checked = true;
            }
        }
    });
}
