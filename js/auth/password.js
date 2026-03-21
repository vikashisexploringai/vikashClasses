// js/auth/password.js
// Forgot username and password reset functions

import { getAuth, getDb } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { showInlineMessage, clearInlineMessages } from '../ui/modals.js';
import { renderLogin } from './login.js';

let passwordResetVerified = false;
let passwordResetUsername = null;
let passwordResetDay = null;
let passwordResetMonth = null;
let passwordResetYear = null;

function renderForgotUsername() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('Find Username');
    
    const today = new Date();
    const maxYear = today.getFullYear() - 2;
    const minYear = today.getFullYear() - 100;
    
    let yearOptions = '';
    for (let year = maxYear; year >= minYear; year--) {
        yearOptions += `<option value="${year}">${year}</option>`;
    }
    
    let monthOptions = '';
    for (let month = 1; month <= 12; month++) {
        monthOptions += `<option value="${month}">${month}</option>`;
    }
    
    let dayOptions = '';
    for (let day = 1; day <= 31; day++) {
        dayOptions += `<option value="${day}">${day}</option>`;
    }
    
    const html = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Find Your Username</h2>
                <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Enter your child's full name and date of birth to retrieve the username.
                </p>
                
                <div class="form-group">
                    <label for="fullName">Child's Full Name</label>
                    <input type="text" id="fullName" placeholder="e.g., John Doe" class="auth-input">
                </div>
                
                <div class="form-group">
                    <label>Date of Birth</label>
                    <div style="display: flex; gap: 8px;">
                        <select id="dobDay" class="auth-input" style="flex: 1;">
                            <option value="">Day</option>
                            ${dayOptions}
                        </select>
                        <select id="dobMonth" class="auth-input" style="flex: 1;">
                            <option value="">Month</option>
                            ${monthOptions}
                        </select>
                        <select id="dobYear" class="auth-input" style="flex: 1;">
                            <option value="">Year</option>
                            ${yearOptions}
                        </select>
                    </div>
                </div>
                
                <button class="auth-btn" onclick="window.handleFindUsername()">Find Username</button>
                
                <div id="usernameResult" style="display: none; margin: 20px 0; padding: 16px; background: #f0f9ff; border-radius: 12px; text-align: center;">
                    <p style="color: #0369a1; margin-bottom: 4px;">Your username is:</p>
                    <p id="foundUsername" style="font-size: 20px; font-weight: 600; color: #0f172a;"></p>
                </div>
                
                <div class="auth-links">
                    <button class="link-btn" onclick="window.renderLogin()">Back to Login</button>
                    <button class="link-btn" onclick="window.renderForgotPassword()">Forgot Password?</button>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    updateBottomNav('forgotUsername');
}

async function handleFindUsername() {
    const fullName = document.getElementById('fullName')?.value;
    const day = document.getElementById('dobDay')?.value;
    const month = document.getElementById('dobMonth')?.value;
    const year = document.getElementById('dobYear')?.value;
    
    clearInlineMessages();
    
    if (!fullName || !day || !month || !year) {
        if (!fullName) showInlineMessage('fullName', 'Please enter full name');
        if (!day || !month || !year) showInlineMessage('dobDay', 'Please select date of birth');
        return;
    }
    
    try {
        const findBtn = document.querySelector('.auth-btn');
        findBtn.textContent = 'Searching...';
        findBtn.disabled = true;
        
        // Make sure Firebase is initialized
        const { initFirebase, getDb } = await import('../firebase/firebaseInit.js');
        await initFirebase();
        const db = getDb();
        
        if (!db) {
            throw new Error('Database not initialized');
        }
        
        const snapshot = await db.collection('users')
            .where('displayName', '==', fullName)
            .where('dateOfBirth.day', '==', parseInt(day))
            .where('dateOfBirth.month', '==', parseInt(month))
            .where('dateOfBirth.year', '==', parseInt(year))
            .get();
        
        findBtn.textContent = 'Find Username';
        findBtn.disabled = false;
        
        if (snapshot.empty) {
            showToast('No account found with these details', 'error');
            return;
        }
        
        const userData = snapshot.docs[0].data();
        
        document.getElementById('foundUsername').textContent = userData.username;
        document.getElementById('usernameResult').style.display = 'block';
        showToast('Username found!', 'success');
        
    } catch (error) {
        console.error('Error finding username:', error);
        showToast('An error occurred. Please try again.', 'error');
        
        const findBtn = document.querySelector('.auth-btn');
        findBtn.textContent = 'Find Username';
        findBtn.disabled = false;
    }
}

function renderForgotPassword() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    passwordResetVerified = false;
    passwordResetUsername = null;
    
    const content = document.getElementById('main-content');
    
    updateHeader('Reset Password');
    
    const today = new Date();
    const maxYear = today.getFullYear() - 2;
    const minYear = today.getFullYear() - 100;
    
    let yearOptions = '';
    for (let year = maxYear; year >= minYear; year--) {
        yearOptions += `<option value="${year}">${year}</option>`;
    }
    
    let monthOptions = '';
    for (let month = 1; month <= 12; month++) {
        monthOptions += `<option value="${month}">${month}</option>`;
    }
    
    let dayOptions = '';
    for (let day = 1; day <= 31; day++) {
        dayOptions += `<option value="${day}">${day}</option>`;
    }
    
    const html = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Reset Password</h2>
                <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Step 1: Verify your identity
                </p>
                
                <div class="form-group">
                    <label for="resetUsername">Username</label>
                    <input type="text" id="resetUsername" placeholder="Enter your username" class="auth-input">
                </div>
                
                <div class="form-group">
                    <label>Date of Birth</label>
                    <div style="display: flex; gap: 8px;">
                        <select id="resetDobDay" class="auth-input" style="flex: 1;">
                            <option value="">Day</option>
                            ${dayOptions}
                        </select>
                        <select id="resetDobMonth" class="auth-input" style="flex: 1;">
                            <option value="">Month</option>
                            ${monthOptions}
                        </select>
                        <select id="resetDobYear" class="auth-input" style="flex: 1;">
                            <option value="">Year</option>
                            ${yearOptions}
                        </select>
                    </div>
                </div>
                
                <button class="auth-btn" onclick="window.handleVerifyIdentity()">Verify Identity</button>
                
                <div class="auth-links">
                    <button class="link-btn" onclick="window.renderLogin()">Back to Login</button>
                    <button class="link-btn" onclick="window.renderForgotUsername()">Forgot Username?</button>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    updateBottomNav('forgotPassword');
}

async function handleVerifyIdentity() {
    const username = document.getElementById('resetUsername')?.value;
    const day = document.getElementById('resetDobDay')?.value;
    const month = document.getElementById('resetDobMonth')?.value;
    const year = document.getElementById('resetDobYear')?.value;
    
    clearInlineMessages();
    
    if (!username || !day || !month || !year) {
        if (!username) showInlineMessage('resetUsername', 'Please enter username');
        if (!day || !month || !year) showInlineMessage('resetDobDay', 'Please select date of birth');
        return;
    }
    
    try {
        const verifyBtn = document.querySelector('.auth-btn');
        verifyBtn.textContent = 'Verifying...';
        verifyBtn.disabled = true;
        
        // Make sure Firebase is initialized
        const { initFirebase, getDb } = await import('../firebase/firebaseInit.js');
        await initFirebase();
        const db = getDb();
        
        if (!db) {
            throw new Error('Database not initialized');
        }
        
        const snapshot = await db.collection('users').where('username', '==', username).get();
        
        if (snapshot.empty) {
            showInlineMessage('resetUsername', 'Username not found');
            verifyBtn.textContent = 'Verify Identity';
            verifyBtn.disabled = false;
            return;
        }
        
        const userData = snapshot.docs[0].data();
        
        if (userData.dateOfBirth.day !== parseInt(day) ||
            userData.dateOfBirth.month !== parseInt(month) ||
            userData.dateOfBirth.year !== parseInt(year)) {
            showInlineMessage('resetDobDay', 'Date of birth does not match');
            verifyBtn.textContent = 'Verify Identity';
            verifyBtn.disabled = false;
            return;
        }
        
        passwordResetVerified = true;
        passwordResetUsername = username;
        passwordResetDay = day;
        passwordResetMonth = month;
        passwordResetYear = year;
        
        renderResetPassword();
        
    } catch (error) {
        console.error('Verification error:', error);
        showToast('Verification failed. Please try again.', 'error');
        
        const verifyBtn = document.querySelector('.auth-btn');
        verifyBtn.textContent = 'Verify Identity';
        verifyBtn.disabled = false;
    }
}

function renderResetPassword() {
    if (!passwordResetVerified) {
        renderForgotPassword();
        return;
    }
    
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('Reset Password');
    
    const html = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Reset Password</h2>
                <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Step 2: Set new password for <strong>${passwordResetUsername}</strong>
                </p>
                
                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input type="password" id="newPassword" placeholder="At least 6 characters" class="auth-input">
                </div>
                
                <div class="form-group">
                    <label for="confirmNewPassword">Confirm New Password</label>
                    <input type="password" id="confirmNewPassword" placeholder="Re-enter new password" class="auth-input">
                </div>
                
                <button class="auth-btn" onclick="window.handleCloudPasswordReset()">Update Password</button>
                
                <div class="auth-links">
                    <button class="link-btn" onclick="window.renderForgotPassword()">Start Over</button>
                    <button class="link-btn" onclick="window.renderLogin()">Back to Login</button>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    updateBottomNav('resetPassword');
}

async function handleCloudPasswordReset() {
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmNewPassword')?.value;
    
    clearInlineMessages();
    let hasError = false;
    
    if (!newPassword) { showInlineMessage('newPassword', 'Please enter new password'); hasError = true; }
    else if (newPassword.length < 6) { showInlineMessage('newPassword', 'Password must be at least 6 characters'); hasError = true; }
    
    if (!confirmPassword) { showInlineMessage('confirmNewPassword', 'Please confirm password'); hasError = true; }
    else if (newPassword !== confirmPassword) { showInlineMessage('confirmNewPassword', 'Passwords do not match'); hasError = true; }
    
    if (hasError) return;
    
    try {
        const resetBtn = document.querySelector('.auth-btn');
        resetBtn.textContent = 'Updating...';
        resetBtn.disabled = true;
        
        const response = await fetch('https://us-central1-database-367af.cloudfunctions.net/resetPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: passwordResetUsername,
                day: parseInt(passwordResetDay),
                month: parseInt(passwordResetMonth),
                year: parseInt(passwordResetYear),
                newPassword
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Password updated successfully! Please login with your new password.', 'success');
            
            passwordResetVerified = false;
            passwordResetUsername = null;
            passwordResetDay = passwordResetMonth = passwordResetYear = null;
            
            renderLogin();
        } else {
            throw new Error(result.error || 'Failed to reset password');
        }
        
    } catch (error) {
        console.error('Password reset error:', error);
        showToast(error.message, 'error');
        
        const resetBtn = document.querySelector('.auth-btn');
        resetBtn.textContent = 'Update Password';
        resetBtn.disabled = false;
    }
}

export { 
    renderForgotUsername, 
    handleFindUsername, 
    renderForgotPassword, 
    handleVerifyIdentity, 
    handleCloudPasswordReset 
};