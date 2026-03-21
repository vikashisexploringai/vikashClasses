// js/views/profile.js
// User profile page

import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { handleLogout } from '../auth/logout.js';
import { renderLogin } from '../auth/login.js';

function renderProfile() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('Profile');
    
    // Make sure Firebase is initialized
    initFirebase().then(() => {
        const auth = getAuth();
        const user = auth ? auth.currentUser : null;
        
        if (!user) {
            renderLogin();
            return;
        }
        
        const db = getDb();
        if (!db) {
            content.innerHTML = '<div class="error-message">Database not initialized</div>';
            return;
        }
        
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) {
                content.innerHTML = '<div class="error-message">User data not found</div>';
                return;
            }
            
            const userData = doc.data();
            const displayName = userData.displayName || 'User';
            const username = userData.username || 'username';
            const dob = userData.dateOfBirth || { day: '?', month: '?', year: '?' };
            const createdAt = userData.createdAt ? new Date(userData.createdAt.toDate()) : new Date();
            
            const joinMonth = createdAt.toLocaleString('default', { month: 'long' });
            const joinYear = createdAt.getFullYear();
            const dobString = `${dob.day} ${new Date(2000, dob.month-1).toLocaleString('default', { month: 'long' })} ${dob.year}`;
            
            const html = `
                <div class="profile-container">
                    <div class="profile-avatar">
                        <div class="avatar-circle">
                            <span class="avatar-text">${escapeHtml(displayName.charAt(0))}</span>
                        </div>
                    </div>
                    
                    <div class="profile-name">
                        <h2>${escapeHtml(displayName)}</h2>
                        <p class="profile-username">@${escapeHtml(username)}</p>
                    </div>
                    
                    <div class="profile-card">
                        <div class="profile-card-icon">🎂</div>
                        <div class="profile-card-content">
                            <div class="profile-card-label">Date of Birth</div>
                            <div class="profile-card-value">${escapeHtml(dobString)}</div>
                        </div>
                    </div>
                    
                    <div class="profile-card">
                        <div class="profile-card-icon">📅</div>
                        <div class="profile-card-content">
                            <div class="profile-card-label">Member Since</div>
                            <div class="profile-card-value">${escapeHtml(joinMonth)} ${escapeHtml(joinYear)}</div>
                        </div>
                    </div>
                    
                    <button class="logout-btn" onclick="window.handleLogout()">
                        <span class="logout-icon">🚪</span>
                        Logout
                    </button>
                </div>
            `;
            
            content.innerHTML = html;
            updateBottomNav('profile');
        }).catch(error => {
            console.error('Error fetching user data:', error);
            content.innerHTML = '<div class="error-message">Failed to load profile</div>';
        });
    }).catch(error => {
        console.error('Firebase init error:', error);
        content.innerHTML = '<div class="error-message">Failed to initialize</div>';
    });
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { renderProfile };