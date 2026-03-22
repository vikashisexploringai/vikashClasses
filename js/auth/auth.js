// js/auth/auth.js
// Firebase authentication handlers

import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { updateState, resetState } from '../core/state.js';
import { showToast } from '../ui/toast.js';
import { renderLogin } from './login.js';
import { renderClassSelection } from '../views/classSelection.js';
import { AppState } from '../core/state.js';

let authStateListenerInitialized = false;

function setupAuthListener() {
    if (authStateListenerInitialized) return;
    
    // Make sure Firebase is initialized
    initFirebase().then(() => {
        const auth = getAuth();
        const db = getDb();
        
        if (!auth || !db) {
            console.error('Auth or DB not initialized');
            return;
        }
        
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User signed in:', user.email);
                
                try {
                    // Check if user exists in students collection (users)
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    
                    if (!userDoc.exists) {
                        // User is not a student (might be teacher)
                        console.log('User not found in students collection, signing out');
                        await auth.signOut();
                        showToast('This account is not registered as a student. Please use the teacher dashboard.', 'error');
                        renderLogin();
                        return;
                    }
                    
                    updateState({
                        currentUser: {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            ...userDoc.data()
                        }
                    });
                    
                    await loadUserProgress(user.uid);
                    
                    if (['login', 'register', 'forgotUsername', 'forgotPassword', 'resetPassword'].includes(AppState.currentView)) {
                        renderClassSelection();
                    }
                } catch (error) {
                    console.error('Error checking user document:', error);
                    await auth.signOut();
                    showToast('Error validating account. Please try again.', 'error');
                    renderLogin();
                }
            } else {
                console.log('User signed out');
                resetState();
                
                if (!['login', 'register', 'forgotUsername', 'forgotPassword', 'resetPassword'].includes(AppState.currentView)) {
                    renderLogin();
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