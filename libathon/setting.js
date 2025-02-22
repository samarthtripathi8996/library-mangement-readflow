// Settings Management Class
class LibrarySettings {
    constructor() {
        this.settings = {
            general: {},
            loan: {},
            notification: {},
            system: {}
        };
        this.originalSettings = {};
        this.hasUnsavedChanges = false;
        this.initializeSettings();
        this.setupEventListeners();
    }

    initializeSettings() {
        // Load settings from localStorage or use defaults
        const savedSettings = localStorage.getItem('librarySettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        } else {
            // Default settings
            this.settings = {
                general: {
                    libraryName: 'Central Library',
                    contactEmail: 'contact@library.com',
                    timeZone: 'UTC-08:00 Pacific Time',
                    dateFormat: 'MM/DD/YYYY'
                },
                loan: {
                    loanPeriod: 14,
                    maxBooks: 5,
                    lateFee: 0.50,
                    gracePeriod: 2
                },
                notification: {
                    emailEnabled: true,
                    dueDateReminder: 3,
                    smsEnabled: false,
                    newsletterEnabled: true
                },
                system: {
                    autoBackup: true,
                    maintenanceTime: '02:00',
                    sessionTimeout: 30,
                    debugMode: false
                }
            };
        }
        this.originalSettings = JSON.parse(JSON.stringify(this.settings));
        this.populateFormFields();
    }

    setupEventListeners() {
        // Input change listeners
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', (e) => this.handleInputChange(e));
        });

        // Save button
        document.querySelector('.btn-primary').addEventListener('click', () => this.saveSettings());

        // Cancel button
        document.querySelector('.btn-cancel').addEventListener('click', () => this.cancelChanges());

        // Form validation
        document.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', (e) => this.validateEmail(e.target));
        });

        // Warning before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Setup real-time validation
        this.setupValidation();
    }

    handleInputChange(event) {
        const input = event.target;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        
        // Update settings object based on input name/id
        let section = this.determineSection(input);
        let key = this.determineKey(input);
        
        if (section && key) {
            this.settings[section][key] = value;
            this.hasUnsavedChanges = true;
            this.updateSaveBarVisibility();
        }

        // Validate input if necessary
        this.validateInput(input);
    }

    determineSection(input) {
        // Determine settings section based on closest settings-section
        const section = input.closest('.settings-section');
        if (section) {
            if (section.querySelector('h2 i').classList.contains('fa-globe')) return 'general';
            if (section.querySelector('h2 i').classList.contains('fa-book-reader')) return 'loan';
            if (section.querySelector('h2 i').classList.contains('fa-bell')) return 'notification';
            if (section.querySelector('h2 i').classList.contains('fa-server')) return 'system';
        }
        return null;
    }

    determineKey(input) {
        // Get key based on input label or id
        const label = input.closest('.setting-item').querySelector('label').textContent.trim();
        return this.convertToKey(label);
    }

    convertToKey(label) {
        // Convert label text to camelCase key
        return label.toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, '');
    }

    setupValidation() {
        const validationRules = {
            'contact-email': {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            'loan-period': {
                min: 1,
                max: 60,
                message: 'Loan period must be between 1 and 60 days'
            },
            'max-books': {
                min: 1,
                max: 20,
                message: 'Maximum books must be between 1 and 20'
            },
            'late-fee': {
                min: 0,
                max: 10,
                message: 'Late fee must be between $0 and $10'
            }
        };

        // Add validation to inputs
        Object.keys(validationRules).forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.validateField(input, validationRules[inputId]));
            }
        });
    }

    validateField(input, rules) {
        let isValid = true;
        let errorMessage = '';

        const value = input.value;

        if (rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }

        if (rules.min !== undefined && (Number(value) < rules.min)) {
            isValid = false;
            errorMessage = rules.message;
        }

        if (rules.max !== undefined && (Number(value) > rules.max)) {
            isValid = false;
            errorMessage = rules.message;
        }

        this.showValidationResult(input, isValid, errorMessage);
        return isValid;
    }

    showValidationResult(input, isValid, errorMessage) {
        // Remove existing error message
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message if invalid
        if (!isValid) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = 'var(--danger)';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginTop = '5px';
            errorDiv.textContent = errorMessage;
            input.parentElement.appendChild(errorDiv);
            input.style.borderColor = 'var(--danger)';
        } else {
            input.style.borderColor = '';
        }
    }

    validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(input.value);
        this.showValidationResult(input, isValid, 'Please enter a valid email address');
        return isValid;
    }

    populateFormFields() {
        // Populate all form fields with current settings
        Object.keys(this.settings).forEach(section => {
            Object.keys(this.settings[section]).forEach(key => {
                const value = this.settings[section][key];
                const input = this.findInput(section, key);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                }
            });
        });
    }

    findInput(section, key) {
        // Find input element based on section and key
        const sectionDiv = Array.from(document.querySelectorAll('.settings-section')).find(
            div => div.querySelector('h2').textContent.toLowerCase().includes(section)
        );
        
        if (sectionDiv) {
            return sectionDiv.querySelector(`input[name="${key}"], select[name="${key}"]`);
        }
        return null;
    }

    updateSaveBarVisibility() {
        const saveBar = document.querySelector('.save-bar');
        if (this.hasUnsavedChanges) {
            saveBar.style.transform = 'translateY(0)';
            saveBar.style.opacity = '1';
        } else {
            saveBar.style.transform = 'translateY(100%)';
            saveBar.style.opacity = '0';
        }
    }

    async saveSettings() {
        try {
            // Validate all fields before saving
            if (!this.validateAllFields()) {
                this.showToast('Please fix validation errors before saving', 'error');
                return;
            }

            // Simulate API call
            await this.simulateApiCall();

            // Save to localStorage
            localStorage.setItem('librarySettings', JSON.stringify(this.settings));
            
            // Update original settings
            this.originalSettings = JSON.parse(JSON.stringify(this.settings));
            
            this.hasUnsavedChanges = false;
            this.updateSaveBarVisibility();
            
            this.showToast('Settings saved successfully!', 'success');
        } catch (error) {
            this.showToast('Error saving settings. Please try again.', 'error');
            console.error('Error saving settings:', error);
        }
    }

    validateAllFields() {
        let isValid = true;
        document.querySelectorAll('input, select').forEach(input => {
            if (input.type === 'email') {
                isValid = this.validateEmail(input) && isValid;
            }
            // Add other validation as needed
        });
        return isValid;
    }

    simulateApiCall() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    cancelChanges() {
        // Restore original settings
        this.settings = JSON.parse(JSON.stringify(this.originalSettings));
        this.populateFormFields();
        this.hasUnsavedChanges = false;
        this.updateSaveBarVisibility();
        this.showToast('Changes cancelled', 'warning');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const backgroundColor = type === 'success' ? 'var(--success)' : 
                              type === 'error' ? 'var(--danger)' : 
                              'var(--warning)';
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${backgroundColor};
            color: white;
            padding: 15px 25px;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new LibrarySettings();
});