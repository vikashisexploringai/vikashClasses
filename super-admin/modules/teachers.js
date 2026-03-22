// super-admin/modules/teachers.js
// Teacher management

import { db, collection, getDocs, addDoc, query, where, doc, deleteDoc, setDoc, getDoc } from './auth.js';
import { generateRandomCode, showToast } from './utils.js';

const TEACHER_CODE_PREFIX = 'TEACH-';

export function generateTeacherCode() {
    return TEACHER_CODE_PREFIX + generateRandomCode(6);
}

export async function loadTeachers() {
    const listDiv = document.getElementById('teachersList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '<div class="loading">Loading teachers...</div>';
    
    try {
        const teachersRef = collection(db, 'teachers');
        const snapshot = await getDocs(teachersRef);
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p>No teachers added yet.</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(docSnap => {
            const teacher = docSnap.data();
            html += `
                <div class="teacher-card">
                    <div class="teacher-info">
                        <strong>${escapeHtml(teacher.displayName || teacher.email)}</strong><br>
                        <small>${escapeHtml(teacher.email)}</small><br>
                        <span class="teacher-code">📌 Teacher Code: <strong>${teacher.teacherCode}</strong></span>
                        <small> · Share this code with students for registration</small><br>
                        <small>📅 Added: ${teacher.createdAt?.toDate ? new Date(teacher.createdAt.toDate()).toLocaleDateString() : 'N/A'}</small>
                    </div>
                    <div>
                        <button class="btn-danger" onclick="window.removeTeacherById('${docSnap.id}')">Remove</button>
                    </div>
                </div>
            `;
        });
        listDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading teachers:', error);
        listDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

export async function addTeacher(email, displayName) {
    const teacherCode = generateTeacherCode();
    
    try {
        // Check if teacher exists
        const teachersRef = collection(db, 'teachers');
        const q = query(teachersRef, where('email', '==', email));
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            showToast('Teacher already exists', 'error');
            return false;
        }
        
        // Add teacher
        await addDoc(collection(db, 'teachers'), {
            email: email,
            displayName: displayName || email.split('@')[0],
            teacherCode: teacherCode,
            createdAt: new Date(),
            isActive: true,
            classes: []
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
                used: false
            };
            
            await setDoc(settingsRef, { teacherCodes: teacherCodes }, { merge: true });
            
        } catch (settingsError) {
            console.warn('Could not update superAdmin settings:', settingsError);
        }
        
        showToast(`Teacher added! Code: ${teacherCode}`, 'success');
        return true;
        
    } catch (error) {
        console.error('Error adding teacher:', error);
        showToast('Failed to add teacher: ' + error.message, 'error');
        return false;
    }
}

export async function removeTeacher(teacherId) {
    try {
        // Get teacher to get their code
        const teacherRef = doc(db, 'teachers', teacherId);
        const teacherDoc = await getDoc(teacherRef);
        const teacherData = teacherDoc.data();
        
        // Remove from teachers collection
        await deleteDoc(teacherRef);
        
        // Remove from superAdmin settings
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

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}