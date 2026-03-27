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
        
        // js/auth/auth.js - Updated auth state listener

auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User signed in:', user.email);
        
        // Check if user exists in students collection
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Check if this is a brand new user (created within last 5 seconds)
            const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
            const isNewUser = creationTime && (Date.now() - creationTime.getTime() < 5000);
            
            if (isNewUser) {
                // New user, wait a moment for Firestore to be written
                console.log('New user detected, waiting for Firestore document...');
                setTimeout(async () => {
                    const retryDoc = await db.collection('users').doc(user.uid).get();
                    if (retryDoc.exists) {
                        updateState({
                            currentUser: {
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName,
                                ...retryDoc.data()
                            }
                        });
                        await loadUserProgress(user.uid);
                        if (['login', 'register', 'forgotUsername', 'forgotPassword', 'resetPassword'].includes(AppState.currentView)) {
                            renderClassSelection();
                        }
                    } else {
                        console.log('User not found in students collection, signing out');
                        await auth.signOut();
                        showToast('This account is not registered as a student. Please use the teacher dashboard.', 'error');
                        renderLogin();
                    }
                }, 2000);
                return;
            } else {
                // Existing user without document - not a student
                console.log('User not found in students collection, signing out');
                await auth.signOut();
                showToast('This account is not registered as a student. Please use the teacher dashboard.', 'error');
                renderLogin();
                return;
            }
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