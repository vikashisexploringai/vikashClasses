// js/auth/login.js
// Login view and handler

import { getAuth, initFirebase } from '../firebase/firebaseInit.js';
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
                <h2>Login to vikashClasses</h2>
                
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" placeholder="Enter your username" class="auth-input">
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
                    <button class="link-btn" onclick="window.renderForgotUsername()">Forgot Username?</button>
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
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    
    clearInlineMessages();
    
    if (!username || !password) {
        if (!username) showInlineMessage('username', 'Please enter username');
        if (!password) showInlineMessage('password', 'Please enter password');
        return;
    }
    
    try {
        const loginBtn = document.querySelector('.auth-btn');
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        const email = `${username}@mathriyaz.local`;
        
        // Ensure Firebase is initialized
        await initFirebase();
        
        const auth = getAuth();
        
        if (!auth) {
            throw new Error('Auth not initialized');
        }
        
        await auth.setPersistence(
            rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
        );
        
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Login successful!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'auth/user-not-found') {
            showInlineMessage('username', 'Username not found');
        } else if (error.code === 'auth/wrong-password') {
            showInlineMessage('password', 'Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
            showInlineMessage('username', 'Invalid username format');
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