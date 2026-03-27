// js/views/settings.js
// Settings page with dark mode, change password, delete account

import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { getAuth, getDb } from '../firebase/firebaseInit.js';
import { renderLogin } from '../auth/login.js';
import { handleLogout } from '../auth/logout.js';

function renderSettings() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('⚙️ Settings');
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    const html = `
        <div class="settings-container">
            <!-- Appearance Section -->
            <div class="settings-card">
                <div class="settings-header">Appearance</div>
                <div class="settings-item">
                    <div class="settings-item-left">
                        <span class="settings-icon">🌙</span>
                        <span class="settings-label">Dark Mode</span>
                    </div>
                    <div class="settings-toggle">
                        <button class="toggle-btn ${!isDarkMode ? 'active' : ''}" onclick="window.setDarkMode(false)">Off</button>
                        <button class="toggle-btn ${isDarkMode ? 'active' : ''}" onclick="window.setDarkMode(true)">On</button>
                    </div>
                </div>
            </div>
            
            <!-- Account Section -->
            <div class="settings-card">
                <div class="settings-header">Account</div>
                <div class="settings-item" onclick="window.renderChangePassword()">
                    <div class="settings-item-left">
                        <span class="settings-icon">🔒</span>
                        <span class="settings-label">Change Password</span>
                    </div>
                    <span class="settings-arrow">→</span>
                </div>
                <div class="settings-item" onclick="window.confirmDeleteAccount()">
                    <div class="settings-item-left">
                        <span class="settings-icon">🗑️</span>
                        <span class="settings-label">Delete Account</span>
                    </div>
                    <span class="settings-arrow">→</span>
                </div>
            </div>
            
            <!-- About Section -->
            <div class="settings-card">
                <div class="settings-header">About</div>
                <div class="settings-item">
                    <div class="settings-item-left">
                        <span class="settings-icon">ℹ️</span>
                        <span class="settings-label">Version</span>
                    </div>
                    <span class="settings-value">1.0.0</span>
                </div>
                <div class="settings-item" onclick="window.open('https://your-terms-url.com', '_blank')">
                    <div class="settings-item-left">
                        <span class="settings-icon">📋</span>
                        <span class="settings-label">Terms of Service</span>
                    </div>
                    <span class="settings-arrow">→</span>
                </div>
                <div class="settings-item" onclick="window.open('https://vikashisexploringai.github.io/mathRiyaz/privacy-policy.html', '_blank')">
                    <div class="settings-item-left">
                        <span class="settings-icon">🔒</span>
                        <span class="settings-label">Privacy Policy</span>
                    </div>
                    <span class="settings-arrow">→</span>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    updateBottomNav('settings');
}

function setDarkMode(enabled) {
    localStorage.setItem('darkMode', enabled);
    
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    renderSettings();
}

function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function renderChangePassword() {
    import('../firebase/firebaseInit.js').then(({ initFirebase, getAuth }) => {
        initFirebase().then(() => {
            const auth = getAuth();
            const user = auth ? auth.currentUser : null;
            
            if (!user) {
                showToast('Please login first', 'error');
                renderLogin();
                return;
            }
            
            const content = document.getElementById('main-content');
            
            updateHeader('Change Password', true, 'renderSettings');
            
            const html = `
                <div class="auth-container">
                    <div class="auth-card">
                        <h2>Change Password</h2>
                        <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                            Enter your current password and choose a new one
                        </p>
                        
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <input type="password" id="currentPassword" placeholder="Enter current password" class="auth-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" placeholder="At least 6 characters" class="auth-input">
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmNewPassword">Confirm New Password</label>
                            <input type="password" id="confirmNewPassword" placeholder="Re-enter new password" class="auth-input">
                        </div>
                        
                        <button class="auth-btn" onclick="window.handleChangePassword()">Update Password</button>
                        
                        <div class="auth-links">
                            <button class="link-btn" onclick="window.renderSettings()">Back to Settings</button>
                        </div>
                    </div>
                </div>
            `;
            
            content.innerHTML = html;
        }).catch(error => {
            console.error('Firebase init error:', error);
            showToast('Failed to load', 'error');
        });
    });
}

async function handleChangePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmNewPassword')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill all fields');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const changeBtn = document.querySelector('.auth-btn');
        changeBtn.textContent = 'Verifying...';
        changeBtn.disabled = true;
        
        const { initFirebase, getAuth } = await import('../firebase/firebaseInit.js');
        await initFirebase();
        const auth = getAuth();
        const user = auth ? auth.currentUser : null;
        
        if (!user) {
            throw new Error('No user logged in');
        }
        
        const email = user.email;
        const credential = firebase.auth.EmailAuthProvider.credential(email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        
        changeBtn.textContent = 'Updating...';
        await user.updatePassword(newPassword);
        
        showToast('Password updated successfully!', 'success');
        renderSettings();
        
    } catch (error) {
        console.error('Change password error:', error);
        
        const changeBtn = document.querySelector('.auth-btn');
        changeBtn.textContent = 'Update Password';
        changeBtn.disabled = false;
        
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect');
        } else {
            alert('Failed to change password: ' + error.message);
        }
    }
}


function confirmDeleteAccount() {
    import('../firebase/firebaseInit.js').then(async ({ initFirebase, getAuth }) => {
        await initFirebase();
        const auth = getAuth();
        const user = auth ? auth.currentUser : null;
        
        if (!user) {
            showToast('Please login first', 'error');
            renderLogin();
            return;
        }
        
        const content = document.getElementById('main-content');
        const previousContent = content.innerHTML;
        
        const deleteModalHTML = `
            <div class="delete-modal-overlay">
                <div class="delete-modal">
                    <div class="delete-modal-icon">⚠️</div>
                    <h3 class="delete-modal-title">Delete Account?</h3>
                    <p class="delete-modal-message">
                        This action is <strong>PERMANENT</strong> and cannot be undone.
                    </p>
                    <ul class="delete-modal-list">
                        <li>• All your quiz attempts will be deleted</li>
                        <li>• You will be removed from all classes</li>
                        <li>• Your profile information will be deleted</li>
                        <li>• Your account will be permanently removed</li>
                    </ul>
                    <div class="delete-modal-buttons">
                        <button class="delete-modal-cancel" onclick="window.cancelDelete()">Cancel</button>
                        <button class="delete-modal-confirm" onclick="window.deleteAccount()">Delete Forever</button>
                    </div>
                </div>
            </div>
        `;
        
        window.previousContent = previousContent;
        content.innerHTML = deleteModalHTML;
    }).catch(error => {
        console.error('Firebase init error:', error);
        showToast('Failed to load', 'error');
    });
}


function cancelDelete() {
    const content = document.getElementById('main-content');
    if (window.previousContent) {
        content.innerHTML = window.previousContent;
    } else {
        renderSettings();
    }
}

// Make globally available
window.setDarkMode = setDarkMode;
window.renderSettings = renderSettings;
window.renderChangePassword = renderChangePassword;
window.handleChangePassword = handleChangePassword;
window.confirmDeleteAccount = confirmDeleteAccount;
window.cancelDelete = cancelDelete;
window.deleteAccount = deleteAccount;

export { 
    renderSettings, 
    setDarkMode, 
    initDarkMode, 
    renderChangePassword, 
    handleChangePassword, 
    confirmDeleteAccount, 
    deleteAccount 
};