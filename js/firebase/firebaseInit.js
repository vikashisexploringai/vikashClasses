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
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK not loaded');
                showToast('Firebase SDK not loaded', 'error');
                reject(new Error('Firebase SDK not loaded'));
                return;
            }
            
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            auth = firebase.auth();
            
            // CRITICAL: Set database ID BEFORE creating any Firestore reference
            // Instead of firebase.firestore(), use the modular approach
            const { getFirestore } = firebase.firestore;
            
            // Get the Firestore instance and set database ID
            db = getFirestore(firebase.app());
            
            // Set the database ID using the internal method
            db._settings = {
                ...db._settings,
                databaseId: 'vikashclasses-db'
            };
            
            // Alternative: use the settings method
            db.settings({ databaseId: 'vikashclasses-db', merge: true });
            
            initialized = true;
            console.log('Firebase initialized, connected to vikashclasses-db');
            console.log('Database ID:', db._databaseId);
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