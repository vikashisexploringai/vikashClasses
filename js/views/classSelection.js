// js/views/classSelection.js
// Class selection page - Home Tab

import { AppState, updateState } from '../core/state.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { renderSubjects } from './subjects.js';
import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

let currentStudentId = null;
let currentStudentData = null;
let currentTeacherClasses = [];

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
        
        // Get ALL classes for this teacher
        const classesQuery = await db.collection('classes')
            .where('teacherId', '==', teacherId)
            .get();
        
        const allTeacherClasses = [];
        classesQuery.forEach(doc => {
            allTeacherClasses.push({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                subjects: doc.data().subjects || [],
                enrollmentCode: doc.data().enrollmentCode
            });
        });
        currentTeacherClasses = allTeacherClasses;
        
        // Get enrolled classes from student data
        const enrolledClassIds = (currentStudentData.enrolledClasses || []).map(c => c.id);
        const enrolledClasses = allTeacherClasses.filter(c => enrolledClassIds.includes(c.id));
        const availableClasses = allTeacherClasses.filter(c => !enrolledClassIds.includes(c.id));
        
        renderTeacherView(teacherData, enrolledClasses, availableClasses);
        
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
    
    const btn = document.getElementById('enterTeacherCodeBtn');
    if (btn) {
        btn.onmouseover = () => btn.style.backgroundColor = '#2563eb';
        btn.onmouseout = () => btn.style.backgroundColor = '#3b82f6';
    }
}

function renderTeacherView(teacher, enrolledClasses, availableClasses) {
    const content = document.getElementById('main-content');
    
    // Enrolled Classes Section
    let enrolledHtml = '';
    if (enrolledClasses.length === 0) {
        enrolledHtml = '<p style="text-align: center; color: #64748b; padding: 20px;">No enrolled classes yet. Use enrollment codes to join classes.</p>';
    } else {
        enrolledHtml = `
            <div class="classes-grid">
                ${enrolledClasses.map(cls => `
                    <div class="class-card" onclick="window.selectClass('${cls.id}')">
                        <div class="class-header" style="border-left-color: #22c55e;">
                            <span class="class-name">${escapeHtml(cls.name)}</span>
                            <span style="background: #22c55e20; color: #22c55e; padding: 2px 8px; border-radius: 20px; font-size: 12px;">Enrolled</span>
                        </div>
                        <div class="class-description">${escapeHtml(cls.description || 'No description')}</div>
                        <div class="class-subjects">
                            ${cls.subjects?.map(s => {
                                const subject = AppState.config?.subjects.find(sub => sub.id === s);
                                return `<span class="subject-tag">${subject?.icon} ${subject?.name}</span>`;
                            }).join('') || '<span>No subjects</span>'}
                        </div>
                        <div style="margin-top: 12px;">
                            <button class="enter-class-btn" onclick="event.stopPropagation(); window.selectClass('${cls.id}')">📖 Enter Class</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Available Classes Section
    let availableHtml = '';
    if (availableClasses.length === 0) {
        availableHtml = '<p style="text-align: center; color: #64748b; padding: 20px;">No available classes at the moment.</p>';
    } else {
        availableHtml = `
            <div class="classes-grid">
                ${availableClasses.map(cls => `
                    <div class="class-card available-class" onclick="event.stopPropagation(); window.showEnrollModal('${cls.id}', '${escapeHtml(cls.name)}')">
                        <div class="class-header" style="border-left-color: #f59e0b;">
                            <span class="class-name">${escapeHtml(cls.name)}</span>
                            <span style="background: #f59e0b20; color: #f59e0b; padding: 2px 8px; border-radius: 20px; font-size: 12px;">Available</span>
                        </div>
                        <div class="class-description">${escapeHtml(cls.description || 'No description')}</div>
                        <div class="class-subjects">
                            ${cls.subjects?.map(s => {
                                const subject = AppState.config?.subjects.find(sub => sub.id === s);
                                return `<span class="subject-tag">${subject?.icon} ${subject?.name}</span>`;
                            }).join('') || '<span>No subjects</span>'}
                        </div>
                        <div style="margin-top: 12px;">
                            <button class="enroll-class-btn" onclick="event.stopPropagation(); window.showEnrollModal('${cls.id}', '${escapeHtml(cls.name)}')">🔑 Enroll with Code</button>
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
                <div style="display: flex; gap: 12px;">
                    <button id="refreshClassesBtn" style="background: #f1f5f9; color: #475569; padding: 10px 20px; border: none; border-radius: 30px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        🔄 Refresh
                    </button>
                    <button id="changeTeacherCodeBtn" style="background: #64748b; color: white; padding: 10px 20px; border: none; border-radius: 30px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        🔄 Change Code
                    </button>
                </div>
            </div>
        </div>
        
        <h3 style="margin-bottom: 16px; font-size: 18px;">📚 My Classes</h3>
        ${enrolledHtml}
        
        <h3 style="margin: 32px 0 16px 0; font-size: 18px;">🔓 Available Classes</h3>
        ${availableHtml}
    `;
    
    content.innerHTML = html;
    
    const refreshBtn = document.getElementById('refreshClassesBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            renderClassSelection();
            showToast('Classes refreshed!', 'success');
        });
        refreshBtn.onmouseover = () => refreshBtn.style.backgroundColor = '#e2e8f0';
        refreshBtn.onmouseout = () => refreshBtn.style.backgroundColor = '#f1f5f9';
    }
    
    const changeBtn = document.getElementById('changeTeacherCodeBtn');
    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            showTeacherCodeModal('change');
        });
        changeBtn.onmouseover = () => changeBtn.style.backgroundColor = '#475569';
        changeBtn.onmouseout = () => changeBtn.style.backgroundColor = '#64748b';
    }
}

// Show Enrollment Modal
window.showEnrollModal = (classId, className) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3 style="margin-top: 0; margin-bottom: 16px; text-align: center;">🔑 Enroll in ${escapeHtml(className)}</h3>
            <p style="color: #64748b; margin-bottom: 20px; text-align: center; font-size: 14px;">
                Enter the enrollment code provided by your teacher.
            </p>
            <div class="form-group">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Enrollment Code</label>
                <input type="text" id="enrollmentCodeInput" placeholder="XXXX-XXXX" autocomplete="off" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px; text-align: center; letter-spacing: 1px;">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button id="cancelEnrollBtn" style="flex: 1; padding: 12px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; color: #475569;">Cancel</button>
                <button id="confirmEnrollBtn" style="flex: 1; padding: 12px; background: #3b82f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; color: white;">Enroll</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#enrollmentCodeInput');
    const cancelBtn = modal.querySelector('#cancelEnrollBtn');
    const confirmBtn = modal.querySelector('#confirmEnrollBtn');
    
    input.focus();
    
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    confirmBtn.addEventListener('click', async () => {
        const enrollmentCode = input.value.trim().toUpperCase();
        
        if (!enrollmentCode) {
            showToast('Please enter an enrollment code', 'error');
            return;
        }
        
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Verifying...';
        confirmBtn.style.opacity = '0.7';
        
        const success = await enrollInClass(classId, enrollmentCode);
        
        if (success) {
            modal.remove();
            renderClassSelection();
        } else {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Enroll';
            confirmBtn.style.opacity = '1';
        }
    });
};

// Enroll in class
async function enrollInClass(classId, enrollmentCode) {
    const db = getDb();
    
    try {
        // Find the class and verify the enrollment code
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists) {
            showToast('Class not found', 'error');
            return false;
        }
        
        const classData = classDoc.data();
        
        if (classData.enrollmentCode !== enrollmentCode) {
            showToast('Invalid enrollment code', 'error');
            return false;
        }
        
        // Check if student is already enrolled
        const enrolledClassIds = (currentStudentData.enrolledClasses || []).map(c => c.id);
        if (enrolledClassIds.includes(classId)) {
            showToast('You are already enrolled in this class', 'info');
            return true;
        }
        
        // Add class to enrolledClasses
        const updatedEnrolledClasses = [...(currentStudentData.enrolledClasses || []), {
            id: classId,
            name: classData.name,
            description: classData.description,
            subjects: classData.subjects || [],
            enrolledAt: new Date()
        }];
        
        await db.collection('users').doc(currentStudentId).update({
            enrolledClasses: updatedEnrolledClasses
        });
        
        showToast(`Successfully enrolled in ${classData.name}!`, 'success');
        return true;
        
    } catch (error) {
        console.error('Error enrolling in class:', error);
        showToast('Failed to enroll', 'error');
        return false;
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
    
    newCancelBtn.onmouseover = () => newCancelBtn.style.backgroundColor = '#e2e8f0';
    newCancelBtn.onmouseout = () => newCancelBtn.style.backgroundColor = '#f1f5f9';
    newSubmitBtn.onmouseover = () => newSubmitBtn.style.backgroundColor = '#2563eb';
    newSubmitBtn.onmouseout = () => newSubmitBtn.style.backgroundColor = '#3b82f6';
}

async function linkTeacher(teacherCode) {
    const db = getDb();
    
    try {
        const teacherQuery = await db.collection('teachers')
            .where('teacherCode', '==', teacherCode)
            .get();
        
        if (teacherQuery.empty) {
            showToast('Invalid teacher code', 'error');
            return false;
        }
        
        const teacherDoc = teacherQuery.docs[0];
        const teacherData = teacherDoc.data();
        
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
    const classData = currentStudentData?.enrolledClasses?.find(c => c.id === classId);
    if (classData) {
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