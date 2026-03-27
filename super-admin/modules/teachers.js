// super-admin/modules/teachers.js
// Teacher management with Auth account creation (using separate auth instance)

import { httpsCallable } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { generateRandomCode, showToast } from './utils.js';
import { auth as superAdminAuth } from './auth.js';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBhujqx9CZwK_NUrQgcUEX5wxKS0hYjXKc",
  authDomain: "vikash-classes-c98f8.firebaseapp.com",
  projectId: "vikash-classes-c98f8",
  storageBucket: "vikash-classes-c98f8.firebasestorage.app",
  messagingSenderId: "456891384843",
  appId: "1:456891384843:web:cf845b07c2884a4c64b30e"
};

// Create a SEPARATE app instance for teacher creation
const teacherApp = initializeApp(firebaseConfig, 'teacherApp');
const teacherAuth = getAuth(teacherApp);
const db = getFirestore(teacherApp);

// Function to get the current Super Admin's ID token
async function getSuperAdminToken() {
    const user = superAdminAuth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
}

// Create a callable function that includes the token
async function callDeleteUser(uid) {
    const token = await getSuperAdminToken();
    if (!token) {
        throw new Error('Super Admin not authenticated');
    }
    
    const response = await fetch('https://us-central1-vikash-classes-c98f8.cloudfunctions.net/deleteUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: { uid } })
    });
    
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete user');
    }
    return result.result;
}

console.log('Super Admin logged in:', superAdminAuth.currentUser?.email);

const TEACHER_CODE_PREFIX = 'TEACH-';

export function generateTeacherCode() {
    return TEACHER_CODE_PREFIX + generateRandomCode(6);
}

function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password + '@1';
}

export async function loadTeachers() {
    const teachersRef = collection(db, 'teachers');
    const snapshot = await getDocs(teachersRef);
    
    const teachers = [];
    snapshot.forEach(doc => {
        teachers.push({ id: doc.id, ...doc.data() });
    });
    return teachers;
}

export async function addTeacher(email, displayName) {
    const teacherCode = generateTeacherCode();
    const tempPassword = generateTempPassword();
    let authUid = null;
    
    try {
        // Check if teacher already exists in Firestore
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('email', '==', email));
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            showToast('Teacher already exists', 'error');
            return false;
        }
        
        // Create teacher user using the separate auth instance
        try {
            const userCredential = await createUserWithEmailAndPassword(teacherAuth, email, tempPassword);
            authUid = userCredential.user.uid;
            console.log('Teacher user created with UID:', authUid);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                showToast('Email already has an Auth account', 'info');
            } else {
                throw authError;
            }
        }
        
        // Add teacher to Firestore - INCLUDING authUid
        await addDoc(collection(db, 'teachers'), {
            email: email,
            displayName: displayName || email.split('@')[0],
            teacherCode: teacherCode,
            createdAt: new Date(),
            isActive: true,
            hasSetupPassword: false,
            authUid: authUid
        });
        
        // Also store in superAdmin settings for validation
        try {
            const settingsRef = doc(db, 'superAdmin', 'settings');
            const settingsDoc = await getDoc(settingsRef);
            
            let teacherCodes = {};
            if (settingsDoc.exists) {
                const data = settingsDoc.data();
                if (data && data.teacherCodes) {
                    teacherCodes = data.teacherCodes;
                }
            }
            
            teacherCodes[teacherCode] = {
                email: email,
                displayName: displayName || email.split('@')[0],
                createdAt: new Date(),
                used: false,
                tempPassword: tempPassword,
                authUid: authUid
            };
            
            await setDoc(settingsRef, { teacherCodes: teacherCodes }, { merge: true });
            
        } catch (settingsError) {
            console.warn('Could not update superAdmin settings:', settingsError);
        }
        
        showToast(`Teacher added! Code: ${teacherCode}\nTemporary password: ${tempPassword}`, 'success');
        return true;
        
    } catch (error) {
        console.error('Error adding teacher:', error);
        showToast('Failed to add teacher: ' + error.message, 'error');
        return false;
    }
}

export async function removeTeacher(teacherId) {
    try {
        const teacherRef = doc(db, 'teachers', teacherId);
        const teacherDoc = await getDoc(teacherRef);
        const teacherData = teacherDoc.data();
        
        if (!teacherData) {
            showToast('Teacher not found', 'error');
            return false;
        }
        
        // 1. Get all classes for this teacher
        const classesRef = collection(db, 'classes');
        const classesQuery = query(classesRef, where('teacherId', '==', teacherId));
        const classesSnapshot = await getDocs(classesQuery);
        
        // 2. Delete all classes for this teacher
        let classCount = 0;
        for (const classDoc of classesSnapshot.docs) {
            await deleteDoc(doc(db, 'classes', classDoc.id));
            classCount++;
        }
        
        // 3. Delete the teacher from Firestore
        await deleteDoc(teacherRef);
        
        // 4. Delete the teacher's Auth account using Super Admin session
        let authDeleted = false;
        if (teacherData.authUid) {
            console.log('🔍 DEBUG: Found authUid:', teacherData.authUid);
            console.log('🔍 DEBUG: Super Admin email:', superAdminAuth.currentUser?.email);
            
            try {
                const result = await callDeleteUser(teacherData.authUid);
                console.log('✅ DEBUG: deleteUser result:', result);
                authDeleted = true;
            } catch (authError) {
                console.error('❌ DEBUG: deleteUser error:', authError);
                console.error('❌ DEBUG: Error message:', authError.message);
            }
        } else {
            console.log('🔍 DEBUG: No authUid found for this teacher');
        }
        
        // 5. Remove from superAdmin settings
        try {
            const settingsRef = doc(db, 'superAdmin', 'settings');
            const settingsDoc = await getDoc(settingsRef);
            
            if (settingsDoc.exists && teacherData.teacherCode) {
                const teacherCodes = settingsDoc.data().teacherCodes || {};
                delete teacherCodes[teacherData.teacherCode];
                await setDoc(settingsRef, { teacherCodes: teacherCodes }, { merge: true });
            }
        } catch (settingsError) {
            console.warn('Could not update superAdmin settings:', settingsError);
        }
        
        // Build success message
        let message = `Teacher removed successfully`;
        if (classCount > 0) {
            message += `\nDeleted ${classCount} class(es)`;
        }
        if (authDeleted) {
            message += `\nAuth account deleted`;
        } else if (teacherData.authUid) {
            message += `\nNote: Auth account could not be deleted automatically. Please delete manually from Firebase Console.`;
        }
        
        showToast(message, 'success');
        return true;
        
    } catch (error) {
        console.error('Error removing teacher:', error);
        showToast('Failed to remove teacher: ' + error.message, 'error');
        return false;
    }
}

// Load all classes for a specific teacher
export async function loadTeacherClasses(teacherId) {
    try {
        const classesRef = collection(db, 'classes');
        const q = query(classesRef, where('teacherId', '==', teacherId));
        const snapshot = await getDocs(q);
        
        const classes = [];
        snapshot.forEach(doc => {
            classes.push({ id: doc.id, ...doc.data() });
        });
        return classes;
    } catch (error) {
        console.error('Error loading teacher classes:', error);
        return [];
    }
}

// Load all students enrolled in a class
export async function loadClassStudents(classId) {
    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists) return [];
        
        const classData = classDoc.data();
        const studentIds = classData.enrolledStudents || [];
        
        const students = [];
        for (const studentId of studentIds) {
            const studentRef = doc(db, 'users', studentId);
            const studentDoc = await getDoc(studentRef);
            if (studentDoc.exists) {
                students.push({ id: studentDoc.id, ...studentDoc.data() });
            }
        }
        return students;
    } catch (error) {
        console.error('Error loading class students:', error);
        return [];
    }
}

// Load student progress
export async function loadStudentProgress(studentId) {
    try {
        const userRef = doc(db, 'users', studentId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists) {
            return userDoc.data().progress || { overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 } };
        }
        return { overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 } };
    } catch (error) {
        console.error('Error loading student progress:', error);
        return { overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 } };
    }
}

// Get student quiz attempts
export async function getStudentAttempts(studentId) {
    try {
        const attemptsRef = collection(db, 'attempts');
        const q = query(attemptsRef, where('userId', '==', studentId));
        const snapshot = await getDocs(q);
        
        const attempts = [];
        snapshot.forEach(doc => {
            attempts.push({ id: doc.id, ...doc.data() });
        });
        return attempts.sort((a, b) => {
            if (!a.completedAt || !b.completedAt) return 0;
            return b.completedAt.toDate() - a.completedAt.toDate();
        });
    } catch (error) {
        console.error('Error loading student attempts:', error);
        return [];
    }
}