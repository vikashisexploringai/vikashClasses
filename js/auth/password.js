// js/auth/password.js
// Forgot password only (students use real emails)

import { getAuth } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { showInlineMessage, clearInlineMessages } from '../ui/modals.js';
import { renderLogin } from './login.js';

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
        
        showToast('Password reset email sent! Check your inbox (and spam folder).', 'success');
        
        document.getElementById('resetEmail').value = '';
        
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
window.renderForgotPassword = renderForgotPassword;
window.handleSendResetEmail = handleSendResetEmail;

export { 
    renderForgotPassword, 
    handleSendResetEmail 
};