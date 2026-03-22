// super-admin/modules/auth.js
// Super Admin authentication

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase config - REPLACE WITH YOUR NEW PROJECT CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBhujqx9CZwK_NUrQgcUEX5wxKS0hYjXKc",
  authDomain: "vikash-classes-c98f8.firebaseapp.com",
  projectId: "vikash-classes-c98f8",
  storageBucket: "vikash-classes-c98f8.firebasestorage.app",
  messagingSenderId: "456891384843",
  appId: "1:456891384843:web:cf845b07c2884a4c64b30e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Super Admin email (your Google account)
const SUPER_ADMIN_EMAIL = 'vikashisexploringai@gmail.com';

let currentAdmin = null;
let authListener = null;

export async function initSuperAdmin(onAuthChange) {
    if (authListener) return;
    
    authListener = onAuthStateChanged(auth, async (user) => {
        if (user && user.email === SUPER_ADMIN_EMAIL) {
            // Check if user has superAdmin claim
            const token = await user.getIdTokenResult();
            if (token.claims.superAdmin) {
                currentAdmin = user;
                onAuthChange('authenticated', user);
            } else {
                currentAdmin = null;
                onAuthChange('unauthorized', user);
            }
        } else if (user) {
            currentAdmin = null;
            onAuthChange('unauthorized', user);
        } else {
            currentAdmin = null;
            onAuthChange('unauthenticated', null);
        }
    });
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Google sign-in error:', error);
        return { success: false, error: error.message };
    }
}

export async function logout() {
    await auth.signOut();
}

export function getCurrentAdmin() {
    return currentAdmin;
}

export { db };