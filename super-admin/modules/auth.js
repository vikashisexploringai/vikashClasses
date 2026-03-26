// super-admin/modules/auth.js
// Super Admin authentication

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBhujqx9CZwK_NUrQgcUEX5wxKS0hYjXKc",
  authDomain: "vikash-classes-c98f8.firebaseapp.com",
  projectId: "vikash-classes-c98f8",
  storageBucket: "vikash-classes-c98f8.firebasestorage.app",
  messagingSenderId: "456891384843",
  appId: "1:456891384843:web:cf845b07c2884a4c64b30e"
};

// Initialize Firebase (compat style)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Initialize Functions
const functions = firebase.functions ? firebase.functions() : null;

// Super Admin email
const SUPER_ADMIN_EMAIL = 'vikashisexploringai@gmail.com';

let currentAdmin = null;
let authListener = null;

export async function initSuperAdmin(onAuthChange) {
    if (authListener) return;
    
    authListener = auth.onAuthStateChanged(async (user) => {
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
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
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

// Export auth, db, and functions for use in other modules
export { auth, db, functions };