// js/firebase/firebaseInit.js
// Firebase initialization for vikashclasses app

import { showToast } from '../ui/toast.js';

// NEW Firebase configuration for vikashclasses project
const firebaseConfig = {
  apiKey: "AIzaSyBhujqx9CZwK_NUrQgcUEX5wxKS0hYjXKc",
  authDomain: "vikash-classes-c98f8.firebaseapp.com",
  projectId: "vikash-classes-c98f8",
  storageBucket: "vikash-classes-c98f8.firebasestorage.app",
  messagingSenderId: "456891384843",
  appId: "1:456891384843:web:cf845b07c2884a4c64b30e"
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
            db = firebase.firestore(); // Uses default database
            
            initialized = true;
            console.log('✅ Firebase initialized with vikashclasses project');
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