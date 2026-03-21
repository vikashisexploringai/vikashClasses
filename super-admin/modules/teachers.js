// super-admin/modules/teachers.js
// Teacher management functions

import { getDb } from '../../js/firebase/firebaseInit.js';
import { showToast } from '../../js/ui/toast.js';

// Generate random teacher code
export function generateTeacherCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TEACH-';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Load all teachers
export async function loadTeachers() {
    const db = getDb();
    if (!db) return [];
    
    try {
        const teachersSnapshot = await db.collection('teachers').get();
        const teachers = [];
        teachersSnapshot.forEach(doc => {
            teachers.push({ id: doc.id, ...doc.data() });
        });
        return teachers;
    } catch (error) {
        console.error('Error loading teachers:', error);
        showToast('Failed to load teachers', 'error');
        return [];
    }
}

// Add new teacher
export async function addTeacher(email, displayName) {
    const db = getDb();
    const teacherCode = generateTeacherCode();
    
    try {
        // Check if teacher already exists
        const existingTeacher = await db.collection('teachers')
            .where('email', '==', email)
            .get();
        
        if (!existingTeacher.empty) {
            showToast('Teacher already exists', 'error');
            return { success: false, error: 'Teacher already exists' };
        }
        
        // Create teacher record
        await db.collection('teachers').doc().set({
            email: email,
            displayName: displayName || email.split('@')[0],
            teacherCode: teacherCode,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            classes: []
        });
        
        // Store in superAdmin settings
        const superAdminRef = db.collection('superAdmin').doc('settings');
        const superAdminDoc = await superAdminRef.get();
        const currentCodes = superAdminDoc.exists ? superAdminDoc.data().teacherCodes || {} : {};
        
        currentCodes[teacherCode] = {
            email: email,
            displayName: displayName || email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            used: false
        };
        
        await superAdminRef.set({ teacherCodes: currentCodes }, { merge: true });
        
        showToast(`Teacher added! Code: ${teacherCode}`, 'success');
        return { success: true, teacherCode };
        
    } catch (error) {
        console.error('Error adding teacher:', error);
        showToast('Failed to add teacher: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Generate new code for existing teacher
export async function generateNewTeacherCode(teacherId) {
    const db = getDb();
    const newCode = generateTeacherCode();
    
    try {
        await db.collection('teachers').doc(teacherId).update({
            teacherCode: newCode
        });
        
        showToast(`New code generated: ${newCode}`, 'success');
        return { success: true, newCode };
        
    } catch (error) {
        console.error('Error generating new code:', error);
        showToast('Failed to generate new code', 'error');
        return { success: false, error: error.message };
    }
}

// Remove teacher
export async function removeTeacher(teacherId) {
    const db = getDb();
    
    try {
        // Get teacher to get their code
        const teacherDoc = await db.collection('teachers').doc(teacherId).get();
        const teacherData = teacherDoc.data();
        
        // Remove from teachers collection
        await db.collection('teachers').doc(teacherId).delete();
        
        // Remove from superAdmin settings
        const superAdminRef = db.collection('superAdmin').doc('settings');
        const superAdminDoc = await superAdminRef.get();
        const currentCodes = superAdminDoc.exists ? superAdminDoc.data().teacherCodes || {} : {};
        
        if (teacherData?.teacherCode) {
            delete currentCodes[teacherData.teacherCode];
            await superAdminRef.set({ teacherCodes: currentCodes }, { merge: true });
        }
        
        showToast('Teacher removed successfully', 'success');
        return { success: true };
        
    } catch (error) {
        console.error('Error removing teacher:', error);
        showToast('Failed to remove teacher', 'error');
        return { success: false, error: error.message };
    }
}