// js/auth/login.js
// Login view and handler

import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { showInlineMessage, clearInlineMessages } from '../ui/modals.js';
import { updateState } from '../core/state.js';

function renderLogin() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    updateState({ currentView: 'login' });
    const content = document.getElementById('main-content');
    
    updateHeader('Welcome Back');
    
    const html = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Login to Vikash Classes</h2>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" placeholder="student@example.com" class="auth-input">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" class="auth-input">
                </div>
                
                <div class="form-row">
                    <label class="checkbox-label">
                        <input type="checkbox" id="rememberMe" checked>
                        <span>Remember me</span>
                    </label>
                </div>
                
                <button class="auth-btn" onclick="window.handleLogin()">Login</button>
                
                <div class="auth-links">
                    <button class="link-btn" onclick="window.renderForgotPassword()">Forgot Password?</button>
                    <button class="link-btn" onclick="window.renderRegister()">Create Account</button>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    updateBottomNav('login');
}

async function handleLogin() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    
    clearInlineMessages();
    
    if (!email || !password) {
        if (!email) showInlineMessage('email', 'Please enter your email');
        if (!password) showInlineMessage('password', 'Please enter your password');
        return;
    }
    
    try {
        const loginBtn = document.querySelector('.auth-btn');
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        const { auth } = getAuth();
        const db = getDb();
        
        await initFirebase();
        
        // Check if this email exists in students collection BEFORE login
        const userQuery = await db.collection('users').where('email', '==', email).get();
        
        if (userQuery.empty) {
            showToast('No student account found with this email', 'error');
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
            return;
        }
        
        // Proceed with login
        await auth.setPersistence(
            rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
        );
        
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Login successful!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-login-credentials') {
            showInlineMessage('email', 'Invalid email or password');
        } else if (error.code === 'auth/wrong-password') {
            showInlineMessage('password', 'Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
            showInlineMessage('email', 'Please enter a valid email address');
        } else if (error.code === 'auth/too-many-requests') {
            showInlineMessage('email', 'Too many failed attempts. Please try again later.');
        } else {
            showToast(error.message, 'error');
        }
        
        const loginBtn = document.querySelector('.auth-btn');
        loginBtn.textContent = 'Login';
        loginBtn.disabled = false;
    }
}

// Make functions globally available
window.handleLogin = handleLogin;
window.renderLogin = renderLogin;

export { renderLogin, handleLogin };