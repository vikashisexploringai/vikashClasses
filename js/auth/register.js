// js/auth/register.js
// Registration view and handler

import { getAuth, getDb } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { showInlineMessage, clearInlineMessages } from '../ui/modals.js';
import { AppState, updateState } from '../core/state.js';
import { renderLogin } from './login.js';

function renderRegister() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    AppState.currentView = 'register';
    const content = document.getElementById('main-content');
    
    updateHeader('Create Account');
    
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
                <h2>Join vikashClasses</h2>
                
                <div class="form-group">
                    <label for="fullName">Full Name</label>
                    <input type="text" id="fullName" placeholder="e.g., John Doe" class="auth-input">
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" placeholder="student@example.com" class="auth-input">
                    <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">We'll use this for password reset</small>
                </div>
                
                <div class="form-group">
                    <label for="username">Choose Username</label>
                    <input type="text" id="username" placeholder="e.g., johndoe123" class="auth-input">
                    <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">Letters, numbers, and underscores only</small>
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
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="At least 6 characters" class="auth-input">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" placeholder="Re-enter password" class="auth-input">
                </div>
                
                <div class="form-row">
                    <label class="checkbox-label">
                        <input type="checkbox" id="rememberMe" checked>
                        <span>Remember me</span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="hasTeacherCode">
                        <span>I have a teacher code</span>
                    </label>
                </div>
                
                <div id="teacherCodeField" style="display: none;">
                    <div class="form-group">
                        <label for="teacherCode">Teacher Code</label>
                        <input type="text" id="teacherCode" placeholder="e.g., TEACH-ABC123" class="auth-input">
                        <small>Enter the code provided by your teacher</small>
                    </div>
                </div>
                
                <button class="auth-btn" onclick="window.handleRegister()">Create Account</button>
                
                <div class="auth-links">
                    <button class="link-btn" onclick="window.renderLogin()">Already have an account? Login</button>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    updateBottomNav('register');
    
    // Show/hide teacher code field
    document.getElementById('hasTeacherCode')?.addEventListener('change', (e) => {
        const teacherCodeField = document.getElementById('teacherCodeField');
        if (teacherCodeField) {
            teacherCodeField.style.display = e.target.checked ? 'block' : 'none';
        }
    });
}

async function handleRegister() {
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const username = document.getElementById('username')?.value;
    const day = document.getElementById('dobDay')?.value;
    const month = document.getElementById('dobMonth')?.value;
    const year = document.getElementById('dobYear')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    const hasTeacherCode = document.getElementById('hasTeacherCode')?.checked;
    const teacherCode = hasTeacherCode ? document.getElementById('teacherCode')?.value : null;
    
    clearInlineMessages();
    let hasError = false;
    
    if (!fullName) { showInlineMessage('fullName', 'Please enter full name'); hasError = true; }
    if (!email) { showInlineMessage('email', 'Please enter email address'); hasError = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineMessage('email', 'Please enter a valid email address');
        hasError = true;
    }
    if (!username) { showInlineMessage('username', 'Please choose a username'); hasError = true; }
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showInlineMessage('username', 'Username can only contain letters, numbers, and underscores');
        hasError = true;
    }
    
    if (!day || !month || !year) { showInlineMessage('dobDay', 'Please select date of birth'); hasError = true; }
    if (!password) { showInlineMessage('password', 'Please enter password'); hasError = true; }
    else if (password.length < 6) { showInlineMessage('password', 'Password must be at least 6 characters'); hasError = true; }
    
    if (!confirmPassword) { showInlineMessage('confirmPassword', 'Please confirm password'); hasError = true; }
    else if (password !== confirmPassword) { showInlineMessage('confirmPassword', 'Passwords do not match'); hasError = true; }
    
    if (hasError) return;
    
    try {
        const registerBtn = document.querySelector('.auth-btn');
        registerBtn.textContent = 'Checking username...';
        registerBtn.disabled = true;
        
        const db = getDb();
        const auth = getAuth();
        
        // Check if username already exists
        const snapshot = await db.collection('users').where('username', '==', username).get();
        
        if (!snapshot.empty) {
            showInlineMessage('username', 'Username already taken. Please choose another.');
            registerBtn.textContent = 'Create Account';
            registerBtn.disabled = false;
            return;
        }
        
        registerBtn.textContent = 'Creating account...';
        
        // STEP 1: Create user in Firebase Auth
        console.log('Creating user with email:', email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('User created:', user.uid);
        
        // STEP 2: Update profile
        await user.updateProfile({ displayName: fullName });
        console.log('Profile updated');
        
        // STEP 3: Set persistence
        await auth.setPersistence(
            rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
        );
        
        // STEP 4: Create user document in Firestore
        const userData = {
            uid: user.uid,
            username: username,
            displayName: fullName,
            email: email,
            dateOfBirth: { day: parseInt(day), month: parseInt(month), year: parseInt(year) },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            enrolledClasses: [],
            overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 }
        };
        
        if (teacherCode) {
            userData.teacherCode = teacherCode;
            userData.teacherCodeProvidedAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        console.log('Writing to Firestore...');
        await db.collection('users').doc(user.uid).set(userData);
        console.log('Firestore write complete');
        
        showToast('Account created successfully!', 'success');
        
        // Force a small delay to ensure auth state propagates
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'auth/email-already-in-use') {
            showInlineMessage('email', 'Email already registered. Please use a different email or login.');
        } else if (error.code === 'auth/weak-password') {
            showInlineMessage('password', 'Password is too weak. Use at least 6 characters.');
        } else if (error.code === 'auth/invalid-email') {
            showInlineMessage('email', 'Invalid email address.');
        } else {
            showToast('Registration failed: ' + error.message, 'error');
        }
        
        const registerBtn = document.querySelector('.auth-btn');
        registerBtn.textContent = 'Create Account';
        registerBtn.disabled = false;
    }
}

// Make functions globally available
window.renderRegister = renderRegister;
window.handleRegister = handleRegister;

export { renderRegister, handleRegister };