// super-admin/modules/auth.js
// Super Admin authentication with Google Sign-In

import { initFirebase, getAuth, getDb } from '../../js/firebase/firebaseInit.js';
import { showToast } from '../../js/ui/toast.js';

// Set your Super Admin email here
export const SUPER_ADMIN_EMAIL = 'vikashsinghdeo@gmail.com'; // Replace with your email

let currentAdminUser = null;
let authStateListener = null;

export async function initAdminAuth(onAuthStateChange) {
    await initFirebase();
    const auth = getAuth();
    
    if (authStateListener) {
        authStateListener();
    }
    
    authStateListener = auth.onAuthStateChanged(async (user) => {
        if (user && user.email === SUPER_ADMIN_EMAIL) {
            currentAdminUser = user;
            if (onAuthStateChange) onAuthStateChange('authenticated', user);
        } else if (user) {
            // Logged in but not super admin
            currentAdminUser = null;
            if (onAuthStateChange) onAuthStateChange('unauthorized', user);
        } else {
            // Not logged in
            currentAdminUser = null;
            if (onAuthStateChange) onAuthStateChange('unauthenticated', null);
        }
    });
}

export async function signInWithGoogle() {
    const auth = getAuth();
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        if (user.email === SUPER_ADMIN_EMAIL) {
            showToast('Welcome, Super Admin!', 'success');
            return { success: true, user };
        } else {
            await auth.signOut();
            showToast('You are not authorized as Super Admin', 'error');
            return { success: false, error: 'Unauthorized' };
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
        showToast('Login failed: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

export async function logout() {
    const auth = getAuth();
    await auth.signOut();
    showToast('Logged out', 'info');
}

export function getCurrentAdmin() {
    return currentAdminUser;
}