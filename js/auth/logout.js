// js/auth/logout.js
// Logout functionality with confirmation modal

import { getAuth } from '../firebase/firebaseInit.js';
import { showToast } from '../ui/toast.js';
import { renderLogin } from './login.js';
import { renderSettings } from '../views/settings.js';

let previousContent = null;

function handleLogout() {
    const content = document.getElementById('main-content');
    previousContent = content.innerHTML;
    
    const logoutModalHTML = `
        <div class="logout-modal-overlay">
            <div class="logout-modal">
                <div class="logout-modal-icon">👋</div>
                <h3 class="logout-modal-title">Logout?</h3>
                <p class="logout-modal-message">
                    Are you sure you want to logout?
                </p>
                <div class="logout-modal-buttons">
                    <button class="logout-modal-cancel" onclick="window.cancelLogout()">Cancel</button>
                    <button class="logout-modal-confirm" onclick="window.confirmLogout()">Logout</button>
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = logoutModalHTML;
}

function cancelLogout() {
    const content = document.getElementById('main-content');
    if (previousContent) {
        content.innerHTML = previousContent;
    } else {
        renderSettings();
    }
}

async function confirmLogout() {
    try {
        showToast('Logging out...', 'info');
        const { auth } = getAuth();
        await auth.signOut();
        renderLogin();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to logout. Please try again.', 'error');
        cancelLogout();
    }
}

// Make globally available for modal buttons
window.cancelLogout = cancelLogout;
window.confirmLogout = confirmLogout;

export { handleLogout, cancelLogout, confirmLogout };