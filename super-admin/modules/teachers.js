// super-admin/modules/teachers.js
// Teacher management with Auth account creation

import { auth, db } from './auth.js';
import { generateRandomCode, showToast } from './utils.js';

const TEACHER_CODE_PREFIX = 'TEACH-';

function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password + '@1';
}

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
    const snapshot = await db.collection('teachers').get();
    
    const teachers = [];
    snapshot.forEach(doc => {
        teachers.push({ id: doc.id, ...doc.data() });
    });
    return teachers;
}

// super-admin/modules/teachers.js - updated addTeacher function

export async function addTeacher(email, displayName) {
    const teacherCode = generateTeacherCode();
    const tempPassword = generateTempPassword();
    
    try {
        // Check if teacher already exists in Firestore
        const existing = await db.collection('teachers').where('email', '==', email).get();
        
        if (!existing.empty) {
            showToast('Teacher already exists', 'error');
            return false;
        }
        
        // Create Firebase Auth user FIRST
        let userCredential;
        let authUser = null;
        
        try {
            // Try to create the auth user
            userCredential = await auth.createUserWithEmailAndPassword(email, tempPassword);
            authUser = userCredential.user;
            showToast(`Auth user created with temporary password: ${tempPassword}`, 'info');
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                // User exists in Auth, get their info
                showToast('Email already has an Auth account. Linking to Firestore.', 'info');
                // We'll still need the UID - we can get it by signing in temporarily
                // For now, we'll proceed without UID
                authUser = { uid: null };
            } else {
                throw authError;
            }
        }
        
        // Add teacher to Firestore
        const teacherRef = await db.collection('teachers').add({
            email: email,
            displayName: displayName || email.split('@')[0],
            teacherCode: teacherCode,
            createdAt: new Date(),
            isActive: true,
            classes: [],
            authUid: authUser?.uid || null,
            hasSetupPassword: false
        });
        
        // Also store in superAdmin settings for validation
        try {
            const settingsRef = db.collection('superAdmin').doc('settings');
            const settingsDoc = await settingsRef.get();
            
            let teacherCodes = {};
            if (settingsDoc.exists) {
                teacherCodes = settingsDoc.data().teacherCodes || {};
            }
            
            teacherCodes[teacherCode] = {
                email: email,
                displayName: displayName || email.split('@')[0],
                createdAt: new Date(),
                used: false,
                tempPassword: tempPassword,
                hasAuthAccount: !!authUser
            };
            
            await settingsRef.set({ teacherCodes: teacherCodes }, { merge: true });
            
        } catch (settingsError) {
            console.warn('Could not update superAdmin settings:', settingsError);
        }
        
        const message = `Teacher added! Code: ${teacherCode}\n\n`;
        const passwordMessage = authUser ? `Temporary password: ${tempPassword}\n\nPlease share this with the teacher.` : `Teacher already has an Auth account. No password needed.`;
        
        showToast(message + passwordMessage, 'success');
        return true;
        
    } catch (error) {
        console.error('Error adding teacher:', error);
        showToast('Failed to add teacher: ' + error.message, 'error');
        return false;
    }
}

export async function removeTeacher(teacherId) {
    try {
        const teacherRef = db.collection('teachers').doc(teacherId);
        const teacherDoc = await teacherRef.get();
        const teacherData = teacherDoc.data();
        
        await teacherRef.delete();
        
        try {
            const settingsRef = db.collection('superAdmin').doc('settings');
            const settingsDoc = await settingsRef.get();
            
            if (settingsDoc.exists) {
                const teacherCodes = settingsDoc.data().teacherCodes || {};
                if (teacherData?.teacherCode) {
                    delete teacherCodes[teacherData.teacherCode];
                    await settingsRef.set({ teacherCodes: teacherCodes }, { merge: true });
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
        const snapshot = await db.collection('classes').where('teacherId', '==', teacherId).get();
        
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
        const classDoc = await db.collection('classes').doc(classId).get();
        
        if (!classDoc.exists) return [];
        
        const classData = classDoc.data();
        const studentIds = classData.enrolledStudents || [];
        
        const students = [];
        for (const studentId of studentIds) {
            const studentDoc = await db.collection('users').doc(studentId).get();
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
        const userDoc = await db.collection('users').doc(studentId).get();
        
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
        const snapshot = await db.collection('attempts').where('userId', '==', studentId).get();
        
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