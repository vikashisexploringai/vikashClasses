// js/auth/password.js
// Forgot password and username functions

import { getAuth, getDb } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { showInlineMessage, clearInlineMessages } from '../ui/modals.js';
import { renderLogin } from './login.js';

// ===== FORGOT USERNAME (using email) =====
function renderForgotUsername() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('Find Username');
    
    const html = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Find Your Username</h2>
                <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Enter your email address to retrieve your username.
                </p>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="forgotEmail" placeholder="student@example.com" class="auth-input">
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
    const email = document.getElementById('forgotEmail')?.value;
    
    clearInlineMessages();
    
    if (!email) {
        showInlineMessage('forgotEmail', 'Please enter your email');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineMessage('forgotEmail', 'Please enter a valid email address');
        return;
    }
    
    try {
        const findBtn = document.querySelector('.auth-btn');
        findBtn.textContent = 'Searching...';
        findBtn.disabled = true;
        
        const { db } = getDb();
        
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .get();
        
        findBtn.textContent = 'Find Username';
        findBtn.disabled = false;
        
        if (snapshot.empty) {
            showToast('No account found with this email', 'error');
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

// ===== FORGOT PASSWORD (Firebase built-in email reset) =====
function renderForgotPassword() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('Reset Password');
    
    const html = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Reset Password</h2>
                <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Enter your email address and we'll send you a password reset link.
                </p>
                
                <div class="form-group">
                    <label for="resetEmail">Email Address</label>
                    <input type="email" id="resetEmail" placeholder="student@example.com" class="auth-input">
                </div>
                
                <button class="auth-btn" onclick="window.handleSendResetEmail()">Send Reset Email</button>
                
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

async function handleSendResetEmail() {
    const email = document.getElementById('resetEmail')?.value;
    
    clearInlineMessages();
    
    if (!email) {
        showInlineMessage('resetEmail', 'Please enter your email');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineMessage('resetEmail', 'Please enter a valid email address');
        return;
    }
    
    try {
        const resetBtn = document.querySelector('.auth-btn');
        resetBtn.textContent = 'Sending...';
        resetBtn.disabled = true;
        
        const { auth } = getAuth();
        
        // Firebase built-in password reset
        await auth.sendPasswordResetEmail(email);
        
        showToast('Password reset email sent! Check your inbox.', 'success');
        
        // Clear form
        document.getElementById('resetEmail').value = '';
        
        // Optional: redirect to login after 3 seconds
        setTimeout(() => {
            renderLogin();
        }, 3000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.code === 'auth/user-not-found') {
            showInlineMessage('resetEmail', 'No account found with this email');
        } else if (error.code === 'auth/invalid-email') {
            showInlineMessage('resetEmail', 'Invalid email address');
        } else if (error.code === 'auth/too-many-requests') {
            showInlineMessage('resetEmail', 'Too many requests. Please try again later.');
        } else {
            showToast('Failed to send reset email: ' + error.message, 'error');
        }
        
        const resetBtn = document.querySelector('.auth-btn');
        resetBtn.textContent = 'Send Reset Email';
        resetBtn.disabled = false;
    }
}

// Make functions globally available
window.renderForgotUsername = renderForgotUsername;
window.handleFindUsername = handleFindUsername;
window.renderForgotPassword = renderForgotPassword;
window.handleSendResetEmail = handleSendResetEmail;

export { 
    renderForgotUsername, 
    handleFindUsername, 
    renderForgotPassword, 
    handleSendResetEmail 
};