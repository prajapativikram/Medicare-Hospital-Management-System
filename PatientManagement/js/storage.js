/**
 * Local Storage Manager for Hospital Management System
 */

class StorageManager {
    constructor() {
        this.prefix = 'HMS_';
        this.version = '1.0';
        this.initializeDefaultData();
    }

    /**
     * Initialize default data in localStorage
     */
    initializeDefaultData() {
        const dataExists = localStorage.getItem(`${this.prefix}initialized`);
        
        if (!dataExists) {
            // Initialize default admin user
            this.set('users', [
                {
                    id: 'admin1',
                    email: 'admin@hospital.com',
                    password: 'admin123',
                    name: 'Admin User',
                    role: 'administrator',
                    phone: '1-800-MEDICARE'
                }
            ]);

            // Initialize empty collections
            this.set('patients', []);
            this.set('doctors', []);
            this.set('appointments', []);
            this.set('invoices', []);
            this.set('settings', {
                hospitalName: 'MediCare Hospital',
                hospitalEmail: 'support@medicare.com',
                hospitalPhone: '1-800-MEDICARE',
                hospitalAddress: '123 Medical Street, Hospital City',
                hospitalLogoUrl: ''
            });

            // Add some sample data
            this.addSampleData();

            localStorage.setItem(`${this.prefix}initialized`, 'true');
        }
    }

    /**
     * Add sample data for demonstration
     */
    addSampleData() {
        // Sample Doctors
        const doctors = [
            {
                id: generateDoctorId(),
                name: 'Dr. James Wilson',
                department: 'Cardiology',
                experience: 15,
                phone: '(555) 123-4567',
                email: 'james@medicare.com',
                qualification: 'MBBS, MD',
                availability: 'Monday-Friday',
                salary: 120000,
                photo: 'https://drjameswilson.co.uk/img/built/rEU9KEjyEw-3277.jpeg'
            },
            {
                id: generateDoctorId(),
                name: 'Dr. Sarah Johnson',
                department: 'Neurology',
                experience: 12,
                phone: '(555) 234-5678',
                email: 'sarah@medicare.com',
                qualification: 'MBBS, MD',
                availability: 'Monday-Saturday',
                salary: 110000,
                photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoNQKhuQ4y0beMSYOaflxO06nfocCtOoB8BJrs4gqnA5ohjyylvb-yAz8&s=10'
            },
            {
                id: generateDoctorId(),
                name: 'Dr. Michael Chen',
                department: 'Orthopedics',
                experience: 10,
                phone: '(555) 345-6789',
                email: 'michael@medicare.com',
                qualification: 'MBBS, MD',
                availability: 'Monday-Friday',
                salary: 100000,
                photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyPYoeCORKbvIEedtJqjgLwnCEBpUzvGfEgNcOFFd4hHFEgmQrx3XLGXWx&s=10'
            }
        ];

        // Sample Patients
        const patients = [
            {
                id: generatePatientId(),
                name: 'John Smith',
                age: 45,
                gender: 'Male',
                phone: '(555) 456-7890',
                email: 'john@email.com',
                address: '456 Oak Avenue, Medical City',
                bloodGroup: 'O+',
                disease: 'Hypertension',
                doctorAssigned: doctors[0].id,
                admissionDate: new Date().toISOString().split('T')[0],
                status: 'active'
            },
            {
                id: generatePatientId(),
                name: 'Emily Davis',
                age: 38,
                gender: 'Female',
                phone: '(555) 567-8901',
                email: 'emily@email.com',
                address: '789 Maple Road, Hospital Town',
                bloodGroup: 'A+',
                disease: 'Migraine',
                doctorAssigned: doctors[1].id,
                admissionDate: new Date().toISOString().split('T')[0],
                status: 'admitted'
            }
        ];

        // Sample Appointments
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const appointments = [
            {
                id: generateAppointmentId(),
                patientId: patients[0].id,
                doctorId: doctors[0].id,
                date: tomorrow.toISOString().split('T')[0],
                time: '10:00',
                status: 'scheduled',
                reason: 'Regular checkup'
            }
        ];

        this.set('doctors', doctors);
        this.set('patients', patients);
        this.set('appointments', appointments);
    }

    /**
     * Set data in localStorage
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(`${this.prefix}${key}`, serialized);
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage: ${key}`, error);
            return false;
        }
    }

    /**
     * Get data from localStorage
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`${this.prefix}${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     */
    remove(key) {
        localStorage.removeItem(`${this.prefix}${key}`);
    }

    /**
     * Clear all data
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Export all data
     */
    exportAll() {
        const data = {
            patients: this.get('patients', []),
            doctors: this.get('doctors', []),
            appointments: this.get('appointments', []),
            invoices: this.get('invoices', []),
            settings: this.get('settings', {}),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    /**
     * Import data
     */
    importData(data) {
        try {
            if (data.patients) this.set('patients', data.patients);
            if (data.doctors) this.set('doctors', data.doctors);
            if (data.appointments) this.set('appointments', data.appointments);
            if (data.invoices) this.set('invoices', data.invoices);
            if (data.settings) this.set('settings', data.settings);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Backup data to JSON file
     */
    backupToFile() {
        const data = this.exportAll();
        const filename = `medicare-backup-${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(data, filename);
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const patients = this.get('patients', []);
        const doctors = this.get('doctors', []);
        const appointments = this.get('appointments', []);
        const invoices = this.get('invoices', []);

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(a => a.date === today).length;
        const totalRevenue = invoices.reduce((sum, inv) => {
            const subtotal = parseFloat(inv.doctorFee || 0) + 
                           parseFloat(inv.medicineCost || 0) + 
                           parseFloat(inv.roomCharges || 0) + 
                           parseFloat(inv.labCharges || 0);
            const taxAmount = subtotal * (parseFloat(inv.tax || 0) / 100);
            const total = subtotal + taxAmount - parseFloat(inv.discount || 0);
            return sum + total;
        }, 0);

        return {
            totalPatients: patients.length,
            totalDoctors: doctors.length,
            todayAppointments: todayAppointments,
            totalRevenue: totalRevenue
        };
    }
}

// Initialize storage manager
const storage = new StorageManager();

/**
 * Export data to JSON file
 */
function exportToJSON(data, filename) {
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
}

/**
 * Patient Management Functions
 */
class PatientManager {
    static getAll() {
        return storage.get('patients', []);
    }

    static getById(id) {
        const patients = this.getAll();
        return patients.find(p => p.id === id);
    }

    static add(patient) {
        const patients = this.getAll();
        const newPatient = {
            ...patient,
            id: patient.id || generatePatientId(),
            createdAt: new Date().toISOString()
        };
        patients.push(newPatient);
        storage.set('patients', patients);
        return newPatient;
    }

    static update(id, updates) {
        const patients = this.getAll();
        const index = patients.findIndex(p => p.id === id);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...updates };
            storage.set('patients', patients);
            return patients[index];
        }
        return null;
    }

    static delete(id) {
        const patients = this.getAll().filter(p => p.id !== id);
        storage.set('patients', patients);
        return true;
    }

    static search(query) {
        const patients = this.getAll();
        const lowerQuery = query.toLowerCase();
        return patients.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.id.toLowerCase().includes(lowerQuery) ||
            p.phone.includes(query) ||
            p.email.toLowerCase().includes(lowerQuery)
        );
    }

    static filter(criteria) {
        let patients = this.getAll();
        if (criteria.status) {
            patients = patients.filter(p => p.status === criteria.status);
        }
        if (criteria.bloodGroup) {
            patients = patients.filter(p => p.bloodGroup === criteria.bloodGroup);
        }
        return patients;
    }
}

/**
 * Doctor Management Functions
 */
class DoctorManager {
    static getAll() {
        return storage.get('doctors', []);
    }

    static getById(id) {
        const doctors = this.getAll();
        return doctors.find(d => d.id === id);
    }

    static add(doctor) {
        const doctors = this.getAll();
        const newDoctor = {
            ...doctor,
            id: doctor.id || generateDoctorId(),
            createdAt: new Date().toISOString()
        };
        doctors.push(newDoctor);
        storage.set('doctors', doctors);
        return newDoctor;
    }

    static update(id, updates) {
        const doctors = this.getAll();
        const index = doctors.findIndex(d => d.id === id);
        if (index !== -1) {
            doctors[index] = { ...doctors[index], ...updates };
            storage.set('doctors', doctors);
            return doctors[index];
        }
        return null;
    }

    static delete(id) {
        const doctors = this.getAll().filter(d => d.id !== id);
        storage.set('doctors', doctors);
        return true;
    }

    static search(query) {
        const doctors = this.getAll();
        const lowerQuery = query.toLowerCase();
        return doctors.filter(d =>
            d.name.toLowerCase().includes(lowerQuery) ||
            d.id.toLowerCase().includes(lowerQuery) ||
            d.phone.includes(query) ||
            d.email.toLowerCase().includes(lowerQuery)
        );
    }

    static filter(criteria) {
        let doctors = this.getAll();
        if (criteria.department) {
            doctors = doctors.filter(d => d.department === criteria.department);
        }
        return doctors;
    }
}

/**
 * Appointment Management Functions
 */
class AppointmentManager {
    static getAll() {
        return storage.get('appointments', []);
    }

    static getById(id) {
        const appointments = this.getAll();
        return appointments.find(a => a.id === id);
    }

    static add(appointment) {
        const appointments = this.getAll();
        const newAppointment = {
            ...appointment,
            id: appointment.id || generateAppointmentId(),
            createdAt: new Date().toISOString()
        };
        appointments.push(newAppointment);
        storage.set('appointments', appointments);
        return newAppointment;
    }

    static update(id, updates) {
        const appointments = this.getAll();
        const index = appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            appointments[index] = { ...appointments[index], ...updates };
            storage.set('appointments', appointments);
            return appointments[index];
        }
        return null;
    }

    static delete(id) {
        const appointments = this.getAll().filter(a => a.id !== id);
        storage.set('appointments', appointments);
        return true;
    }

    static search(query) {
        const appointments = this.getAll();
        const lowerQuery = query.toLowerCase();
        return appointments.filter(a =>
            a.id.toLowerCase().includes(lowerQuery) ||
            a.reason.toLowerCase().includes(lowerQuery)
        );
    }

    static filter(criteria) {
        let appointments = this.getAll();
        if (criteria.status) {
            appointments = appointments.filter(a => a.status === criteria.status);
        }
        if (criteria.date) {
            appointments = appointments.filter(a => a.date === criteria.date);
        }
        return appointments;
    }

    static getTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        return this.filter({ date: today });
    }
}

/**
 * Invoice/Billing Management Functions
 */
class BillingManager {
    static getAll() {
        return storage.get('invoices', []);
    }

    static getById(id) {
        const invoices = this.getAll();
        return invoices.find(i => i.id === id);
    }

    static add(invoice) {
        const invoices = this.getAll();
        const newInvoice = {
            ...invoice,
            id: invoice.id || generateInvoiceId(),
            createdAt: new Date().toISOString()
        };
        invoices.push(newInvoice);
        storage.set('invoices', invoices);
        return newInvoice;
    }

    static update(id, updates) {
        const invoices = this.getAll();
        const index = invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            invoices[index] = { ...invoices[index], ...updates };
            storage.set('invoices', invoices);
            return invoices[index];
        }
        return null;
    }

    static delete(id) {
        const invoices = this.getAll().filter(i => i.id !== id);
        storage.set('invoices', invoices);
        return true;
    }

    static calculateTotal(invoice) {
        const subtotal = parseFloat(invoice.doctorFee || 0) +
                        parseFloat(invoice.medicineCost || 0) +
                        parseFloat(invoice.roomCharges || 0) +
                        parseFloat(invoice.labCharges || 0);
        const taxAmount = subtotal * (parseFloat(invoice.tax || 0) / 100);
        const total = subtotal + taxAmount - parseFloat(invoice.discount || 0);
        return total;
    }
}
