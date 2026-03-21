// js/auth/auth.js
// Firebase authentication handlers

import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { updateState, resetState } from '../core/state.js';
import { showToast } from '../ui/toast.js';

let authStateListenerInitialized = false;

function setupAuthListener() {
    if (authStateListenerInitialized) return;
    
    // Make sure Firebase is initialized
    initFirebase().then(() => {
        const auth = getAuth();
        if (!auth) {
            console.error('Auth not initialized');
            return;
        }
        
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User signed in:', user.email);
                updateState({
                    currentUser: {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    }
                });
                
                await loadUserProgress(user.uid);
                
                // Navigate to class selection if on auth page
                const currentView = window.AppState?.currentView || 'login';
                const authViews = ['login', 'register', 'forgotUsername', 'forgotPassword', 'resetPassword'];
                if (authViews.includes(currentView)) {
                    // Dynamic import to avoid circular dependency
                    import('../views/classSelection.js').then(module => {
                        module.renderClassSelection();
                    });
                }
            } else {
                console.log('User signed out');
                resetState();
                
                // Navigate to login if not on auth page
                const currentView = window.AppState?.currentView || 'login';
                const authViews = ['login', 'register', 'forgotUsername', 'forgotPassword', 'resetPassword'];
                if (!authViews.includes(currentView)) {
                    // Dynamic import to avoid circular dependency
                    import('./login.js').then(module => {
                        module.renderLogin();
                    });
                }
            }
        });
        
        authStateListenerInitialized = true;
    }).catch(error => {
        console.error('Firebase init error in auth listener:', error);
    });
}

async function loadUserProgress(uid) {
    const db = getDb();
    if (!db) return;
    
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            updateState({
                progress: userData.progress || {},
                userDisplayName: userData.displayName
            });
            console.log('User progress loaded');
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
    }
}

function getCurrentUser() {
    const auth = getAuth();
    return auth ? auth.currentUser : null;
}

export { setupAuthListener, loadUserProgress, getCurrentUser };