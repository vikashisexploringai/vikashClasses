// super-admin/modules/teachers.js
// Teacher management with Auth account creation

import { db, auth, collection, getDocs, addDoc, query, where, doc, deleteDoc, setDoc, getDoc } from './auth.js';
import { generateRandomCode, showToast } from './utils.js';

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
    snapshot.forEach(docSnap => {
        teachers.push({ id: docSnap.id, ...docSnap.data() });
    });
    return teachers;
}

export async function addTeacher(email, displayName) {
    const teacherCode = generateTeacherCode();
    const tempPassword = generateTempPassword();
    
    try {
        // Check if teacher already exists in Firestore
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('email', '==', email));
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            showToast('Teacher already exists', 'error');
            return false;
        }
        
        // Create Firebase Auth user using compat auth
        let userCredential;
        
        try {
            userCredential = await auth.createUserWithEmailAndPassword(email, tempPassword);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                // Email already exists in Auth, just add to Firestore
                showToast('Email already registered. Adding to Firestore only.', 'info');
                userCredential = { user: { uid: null, email: email } };
            } else {
                throw authError;
            }
        }
        
        const uid = userCredential.user?.uid || email;
        
        // Add teacher to Firestore
        await addDoc(collection(db, 'teachers'), {
            email: email,
            displayName: displayName || email.split('@')[0],
            teacherCode: teacherCode,
            createdAt: new Date(),
            isActive: true,
            classes: [],
            authUid: uid
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
                tempPassword: tempPassword
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
        
        await deleteDoc(teacherRef);
        
        try {
            const settingsRef = doc(db, 'superAdmin', 'settings');
            const settingsDoc = await getDoc(settingsRef);
            
            if (settingsDoc.exists) {
                const teacherCodes = settingsDoc.data().teacherCodes || {};
                if (teacherData?.teacherCode) {
                    delete teacherCodes[teacherData.teacherCode];
                    await setDoc(settingsRef, { teacherCodes: teacherCodes }, { merge: true });
                }
            }
        } catch (settingsError) {
            console.warn('Could not update superAdmin settings:', settingsError);
        }
        
        showToast('Teacher removed successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error removing teacher:', error);
        showToast('Failed to remove teacher', 'error');
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
        snapshot.forEach(docSnap => {
            classes.push({ id: docSnap.id, ...docSnap.data() });
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
        snapshot.forEach(docSnap => {
            attempts.push({ id: docSnap.id, ...docSnap.data() });
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

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}