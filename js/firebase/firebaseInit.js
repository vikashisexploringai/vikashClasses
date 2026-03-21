// js/firebase/firebaseInit.js
// Firebase initialization and database setup

import { showToast } from '../ui/toast.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyACO39eJRrdbgowWcqgdp0DFkDPUhbQQfQ",
    authDomain: "database-367af.firebaseapp.com",
    projectId: "database-367af",
    storageBucket: "database-367af.firebasestorage.app",
    messagingSenderId: "246204653332",
    appId: "1:246204653332:web:8daf25ea24112de940ec01"
};

let auth = null;
let db = null;
let initialized = false;
let initPromise = null;

function initFirebase() {
    if (initialized) return Promise.resolve({ auth, db });
    if (initPromise) return initPromise;
    
    initPromise = new Promise((resolve, reject) => {
        try {
            // Check if firebase is available
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK not loaded');
                showToast('Firebase SDK not loaded', 'error');
                reject(new Error('Firebase SDK not loaded'));
                return;
            }
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            auth = firebase.auth();
            db = firebase.firestore();
            
            // Connect to vikashclasses database
            db.settings({
                databaseId: "vikashclasses-db"
            });
            
            initialized = true;
            console.log('Firebase initialized, connected to vikashclasses-db');
            resolve({ auth, db });
            
        } catch (error) {
            console.error('Firebase initialization error:', error);
            showToast('Failed to initialize app', 'error');
            reject(error);
        }
    });
    
    return initPromise;
}

function getAuth() {
    return auth;
}

function getDb() {
    return db;
}

function isInitialized() {
    return initialized;
}

export { initFirebase, getAuth, getDb, isInitialized };