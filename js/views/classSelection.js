// js/views/classSelection.js
// Class selection page - Home Tab

import { AppState, updateState } from '../core/state.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { renderSubjects } from './subjects.js';
import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';

let currentStudentId = null;
let currentStudentData = null;

async function renderClassSelection() {
    updateState({ currentView: 'classSelection' });
    const content = document.getElementById('main-content');
    
    updateHeader('My Classes');
    
    await initFirebase();
    const auth = getAuth();
    const user = auth?.currentUser;
    
    if (!user) {
        content.innerHTML = '<div class="loading-spinner"></div>';
        return;
    }
    
    currentStudentId = user.uid;
    const db = getDb();
    
    try {
        const userDoc = await db.collection('users').doc(currentStudentId).get();
        
        if (!userDoc.exists) {
            content.innerHTML = '<div class="error-message">User data not found</div>';
            return;
        }
        
        currentStudentData = userDoc.data();
        const teacherId = currentStudentData.currentTeacherId;
        
        // If no teacher linked, show prompt
        if (!teacherId) {
            renderNoTeacherView();
            return;
        }
        
        // Get teacher details
        const teacherDoc = await db.collection('teachers').doc(teacherId).get();
        
        if (!teacherDoc.exists) {
            renderNoTeacherView();
            return;
        }
        
        const teacherData = teacherDoc.data();
        const teacherClasses = currentStudentData.enrolledClasses || [];
        
        renderTeacherView(teacherData, teacherClasses);
        
    } catch (error) {
        console.error('Error loading class selection:', error);
        content.innerHTML = '<div class="error-message">Failed to load classes</div>';
    }
    
    updateBottomNav('classSelection');
}

function renderNoTeacherView() {
    const content = document.getElementById('main-content');
    
    const html = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 24px;">🔑</div>
            <h2 style="margin-bottom: 12px; font-size: 24px;">No Teacher Linked</h2>
            <p style="color: #64748b; margin-bottom: 32px; line-height: 1.5;">
                You haven't linked to a teacher yet.<br>
                Ask your teacher for their code to get started.
            </p>
            <button id="enterTeacherCodeBtn" style="background: #3b82f6; color: white; border: none; padding: 14px 32px; border-radius: 30px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                ✨ Enter Teacher Code
            </button>
        </div>
    `;
    
    content.innerHTML = html;
    
    document.getElementById('enterTeacherCodeBtn')?.addEventListener('click', () => {
        showTeacherCodeModal('enter');
    });
    
    // Add hover effect
    const btn = document.getElementById('enterTeacherCodeBtn');
    if (btn) {
        btn.onmouseover = () => btn.style.backgroundColor = '#2563eb';
        btn.onmouseout = () => btn.style.backgroundColor = '#3b82f6';
    }
}


function renderTeacherView(teacher, classes) {
    const content = document.getElementById('main-content');
    
    let classesHtml = '';
    
    if (classes.length === 0) {
        classesHtml = '<p style="text-align: center; color: #64748b; padding: 40px;">No classes available yet.</p>';
    } else {
        classesHtml = `
            <div class="classes-grid">
                ${classes.map(cls => `
                    <div class="class-card" onclick="window.selectClass('${cls.id}')">
                        <div class="class-header" style="border-left-color: #3b82f6">
                            <span class="class-name">${escapeHtml(cls.name)}</span>
                        </div>
                        <div class="class-description">${escapeHtml(cls.description || 'No description')}</div>
                        <div class="class-subjects">
                            ${cls.subjects?.map(s => {
                                const subject = AppState.config?.subjects.find(sub => sub.id === s);
                                return `<span class="subject-tag">${subject?.icon} ${subject?.name}</span>`;
                            }).join('') || '<span>No subjects</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    const html = `
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 20px;">👩‍🏫</span>
                        <span style="font-size: 14px; color: #64748b;">Your Teacher</span>
                    </div>
                    <div style="font-weight: 700; font-size: 20px;">${escapeHtml(teacher.displayName || teacher.email)}</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Code: <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${teacher.teacherCode}</span></div>
                </div>
                <button id="changeTeacherCodeBtn" style="background: #64748b; color: white; padding: 10px 20px; border: none; border-radius: 30px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                    🔄 Change Code
                </button>
            </div>
        </div>
        
        <h3 style="margin-bottom: 16px; font-size: 18px;">📚 My Classes</h3>
        ${classesHtml}
    `;
    
    content.innerHTML = html;
    
    const changeBtn = document.getElementById('changeTeacherCodeBtn');
    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            showTeacherCodeModal('change');
        });
        changeBtn.onmouseover = () => changeBtn.style.backgroundColor = '#475569';
        changeBtn.onmouseout = () => changeBtn.style.backgroundColor = '#64748b';
    }
}


function showTeacherCodeModal(action) {
    const modal = document.getElementById('teacherCodeModal');
    const messageEl = document.getElementById('teacherCodeModalMessage');
    const input = document.getElementById('teacherCodeInput');
    const submitBtn = document.getElementById('submitTeacherCodeBtn');
    const cancelBtn = document.getElementById('cancelTeacherCodeBtn');
    
    if (action === 'change') {
        messageEl.innerHTML = 'Enter the new teacher code. This will replace your current teacher and classes.';
    } else {
        messageEl.innerHTML = 'Enter the code provided by your teacher to get started.';
    }
    
    input.value = '';
    modal.style.display = 'flex';
    input.focus();
    
    // Remove existing listeners
    const newSubmitBtn = submitBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newCancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    newSubmitBtn.addEventListener('click', async () => {
        const teacherCode = input.value.trim().toUpperCase();
        
        if (!teacherCode) {
            showToast('Please enter a teacher code', 'error');
            return;
        }
        
        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = 'Verifying...';
        newSubmitBtn.style.opacity = '0.7';
        
        const success = await linkTeacher(teacherCode);
        
        newSubmitBtn.disabled = false;
        newSubmitBtn.textContent = 'Submit';
        newSubmitBtn.style.opacity = '1';
        
        if (success) {
            modal.style.display = 'none';
            renderClassSelection();
        }
    });
    
    // Add hover effects
    newCancelBtn.onmouseover = () => newCancelBtn.style.backgroundColor = '#e2e8f0';
    newCancelBtn.onmouseout = () => newCancelBtn.style.backgroundColor = '#f1f5f9';
    newSubmitBtn.onmouseover = () => newSubmitBtn.style.backgroundColor = '#2563eb';
    newSubmitBtn.onmouseout = () => newSubmitBtn.style.backgroundColor = '#3b82f6';
}


async function linkTeacher(teacherCode) {
    const db = getDb();
    
    try {
        // Find teacher by code
        const teacherQuery = await db.collection('teachers')
            .where('teacherCode', '==', teacherCode)
            .get();
        
        if (teacherQuery.empty) {
            showToast('Invalid teacher code', 'error');
            return false;
        }
        
        const teacherDoc = teacherQuery.docs[0];
        const teacherData = teacherDoc.data();
        
        // Get all classes for this teacher
        const classesQuery = await db.collection('classes')
            .where('teacherId', '==', teacherDoc.id)
            .get();
        
        const enrolledClasses = [];
        classesQuery.forEach(doc => {
            enrolledClasses.push({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                subjects: doc.data().subjects || []
            });
        });
        
        // Update user document
        await db.collection('users').doc(currentStudentId).update({
            currentTeacherId: teacherDoc.id,
            currentTeacherCode: teacherCode,
            currentTeacherName: teacherData.displayName || teacherData.email,
            teacherLinkedAt: firebase.firestore.FieldValue.serverTimestamp(),
            enrolledClasses: enrolledClasses
        });
        
        showToast(`Linked to ${teacherData.displayName || teacherData.email}!`, 'success');
        return true;
        
    } catch (error) {
        console.error('Error linking teacher:', error);
        showToast('Failed to link teacher', 'error');
        return false;
    }
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make globally available
window.selectClass = async (classId) => {
    // Find class from enrolledClasses
    const classData = currentStudentData?.enrolledClasses?.find(c => c.id === classId);
    if (classData) {
        // Store current class in AppState
        updateState({ 
            currentClass: {
                id: classId,
                name: classData.name,
                subjects: classData.subjects
            }
        });
        renderSubjects();
    }
};

window.renderClassSelection = renderClassSelection;

export { renderClassSelection };