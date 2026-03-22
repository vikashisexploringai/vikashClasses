// js/auth/login.js
// Login view and handler

import { getAuth } from '../firebase/firebaseInit.js';
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



// js/auth/login.js - Updated handleLogin

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
        const { auth, initFirebase } = getAuth();
        
        // Wait for Firebase to be ready
        await initFirebase();
        
        // FIRST: Check if this email exists in students collection BEFORE login
        const db = getDb();
        const userQuery = await db.collection('users').where('email', '==', email).get();
        
        if (userQuery.empty) {
            // Not a student account
            showToast('This account is not registered as a student. Please use the teacher dashboard.', 'error');
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
            return;
        }
        
        // If it is a student, proceed with login
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


// Function for forgot username (now uses email instead)
function renderForgotUsername() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    updateState({ currentView: 'forgotUsername' });
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

// Make functions globally available
window.handleLogin = handleLogin;
window.renderLogin = renderLogin;
window.renderForgotUsername = renderForgotUsername;
window.handleFindUsername = handleFindUsername;

export { renderLogin, handleLogin, renderForgotUsername, handleFindUsername };