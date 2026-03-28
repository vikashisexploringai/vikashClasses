// teacher/dashboard.js
// Teacher Dashboard

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBhujqx9CZwK_NUrQgcUEX5wxKS0hYjXKc",
    authDomain: "vikash-classes-c98f8.firebaseapp.com",
    projectId: "vikash-classes-c98f8",
    storageBucket: "vikash-classes-c98f8.firebasestorage.app",
    messagingSenderId: "456891384843",
    appId: "1:456891384843:web:cf845b07c2884a4c64b30e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentTeacher = null;
let currentTeacherId = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const cancelResetBtn = document.getElementById('cancelResetBtn');
const confirmResetBtn = document.getElementById('confirmResetBtn');
const createClassBtn = document.getElementById('createClassBtn');
const createClassModal = document.getElementById('createClassModal');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const classDetailModal = document.getElementById('classDetailModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const generateNewCodeBtn = document.getElementById('generateNewCodeBtn');

// Toast notification function
function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Auth state listener
// teacher/dashboard.js - Auth state listener

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check if user exists in teachers collection
        const teacherQuery = query(collection(db, 'teachers'), where('email', '==', user.email));
        const teacherSnapshot = await getDocs(teacherQuery);
        
        if (teacherSnapshot.empty) {
            // User is not a teacher (might be student)
            showToast('This account is not registered as a teacher. Please use the student app.', 'error');
            await signOut(auth);
            loginSection.style.display = 'block';
            dashboard.style.display = 'none';
            logoutBtn.style.display = 'none';
            return;
        }
        
        currentTeacher = teacherSnapshot.docs[0].data();
        currentTeacherId = teacherSnapshot.docs[0].id;
        currentTeacher.id = currentTeacherId;
        
        loginSection.style.display = 'none';
        dashboard.style.display = 'block';
        logoutBtn.style.display = 'block';
        
        document.getElementById('teacherNameHeader').textContent = `Welcome, ${currentTeacher.displayName || currentTeacher.email}!`;
        document.getElementById('teacherCodeDisplay').innerHTML = `📌 Your Teacher Code: <strong>${currentTeacher.teacherCode}</strong> (Share this with students)`;
        
        loadClasses();
    } else {
        loginSection.style.display = 'block';
        dashboard.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
});


// Login
// Login
// Login
// Login - add loading state
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const originalButtonText = loginBtn.textContent;
    
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }
    
    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.7';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Success - dashboard will appear via auth state listener
        // No need to reset button as page will change
    } catch (error) {
        console.error('Login error:', error.code);
        
        // Reset button
        loginBtn.textContent = originalButtonText;
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
        
        // Handle error...
        if (error.code === 'auth/invalid-login-credentials') {
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods.length === 0) {
                    showToast('No account found with this email address', 'error');
                } else {
                    showToast('Incorrect password. Please try again.', 'error');
                }
            } catch (fetchError) {
                showToast('Invalid email or password', 'error');
            }
        } else {
            switch (error.code) {
                case 'auth/invalid-email':
                    showToast('Please enter a valid email address', 'error');
                    break;
                case 'auth/too-many-requests':
                    showToast('Too many failed attempts. Please try again later.', 'error');
                    break;
                case 'auth/user-disabled':
                    showToast('This account has been disabled. Contact support.', 'error');
                    break;
                default:
                    showToast('Login failed: ' + error.message, 'error');
            }
        }
    }
});



// Forgot Password - Show Modal
forgotPasswordLink.addEventListener('click', () => {
    forgotPasswordModal.style.display = 'flex';
    document.getElementById('resetEmail').value = document.getElementById('email').value || '';
    document.getElementById('resetTeacherCode').value = '';
});

// Cancel Reset Modal
cancelResetBtn.addEventListener('click', () => {
    forgotPasswordModal.style.display = 'none';
});

// Confirm Reset - Verify teacher code first
confirmResetBtn.addEventListener('click', async () => {
    const email = document.getElementById('resetEmail').value.trim();
    const teacherCode = document.getElementById('resetTeacherCode').value.trim().toUpperCase();
    
    if (!email || !teacherCode) {
        showToast('Please enter both email and teacher code', 'error');
        return;
    }
    
    confirmResetBtn.disabled = true;
    confirmResetBtn.textContent = 'Verifying...';
    
    try {
        const q = query(collection(db, 'teachers'), where('teacherCode', '==', teacherCode));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            showToast('Invalid teacher code. Please check with your administrator.', 'error');
            confirmResetBtn.disabled = false;
            confirmResetBtn.textContent = 'Send Reset Email';
            return;
        }
        
        const teacherData = snapshot.docs[0].data();
        
        if (teacherData.email !== email) {
            showToast('This teacher code is not associated with this email address.', 'error');
            confirmResetBtn.disabled = false;
            confirmResetBtn.textContent = 'Send Reset Email';
            return;
        }
        
        await sendPasswordResetEmail(auth, email);
        showToast('Password reset email sent! Check your inbox (and spam folder).', 'success');
        forgotPasswordModal.style.display = 'none';
        
    } catch (error) {
        console.error('Password reset error:', error.code);
        
        switch (error.code) {
            case 'auth/user-not-found':
                showToast('No account found with this email address', 'error');
                break;
            case 'auth/invalid-email':
                showToast('Please enter a valid email address', 'error');
                break;
            case 'auth/too-many-requests':
                showToast('Too many requests. Please try again later.', 'error');
                break;
            default:
                showToast('Failed to send reset email: ' + error.message, 'error');
        }
    } finally {
        confirmResetBtn.disabled = false;
        confirmResetBtn.textContent = 'Send Reset Email';
    }
});


// Logout
// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        
        // Clear the login form fields
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        // Remove autofill by adding a random attribute to form
        const loginForm = document.getElementById('loginSection');
        const randomName = 'autocomplete-' + Math.random().toString(36).substring(2, 8);
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        // Temporarily disable autocomplete
        emailInput.setAttribute('autocomplete', 'off');
        passwordInput.setAttribute('autocomplete', 'off');
        
        // Add a random name to prevent browser matching
        emailInput.setAttribute('name', randomName);
        passwordInput.setAttribute('name', randomName + '-pwd');
        
        // Show logout confirmation
        showToast('Logged out successfully', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to logout', 'error');
    }
});

// Load classes
async function loadClasses() {
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '<div class="loading">Loading classes...</div>';
    
    try {
        const q = query(collection(db, 'classes'), where('teacherId', '==', currentTeacherId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            classesList.innerHTML = '<p>No classes created yet. Click "Create New Class" to get started.</p>';
            return;
        }
        
        let html = '';
        for (const docSnap of snapshot.docs) {
            const classData = docSnap.data();
            const students = await getClassStudents(docSnap.id);
            
            html += `
                <div class="class-card" onclick="window.showClassDetail('${docSnap.id}', '${escapeHtml(classData.name)}', '${classData.enrollmentCode || 'N/A'}')">
                    <div class="class-name">📖 ${escapeHtml(classData.name)}</div>
                    <div class="class-description">${escapeHtml(classData.description || 'No description')}</div>
                    <div class="class-stats">👥 ${students.length} students enrolled</div>
                    <div class="class-code">🔑 Code: ${classData.enrollmentCode || 'Not set'}</div>
                </div>
            `;
        }
        classesList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading classes:', error);
        classesList.innerHTML = '<div class="error">Failed to load classes</div>';
    }
}

async function getClassStudents(classId) {
    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        if (!classDoc.exists) return [];
        const classData = classDoc.data();
        return classData.enrolledStudents || [];
    } catch (error) {
        console.error('Error getting students:', error);
        return [];
    }
}

// Create class
createClassBtn.addEventListener('click', () => {
    createClassModal.style.display = 'flex';
});

cancelCreateBtn.addEventListener('click', () => {
    createClassModal.style.display = 'none';
    document.getElementById('newClassName').value = '';
    document.getElementById('newClassDescription').value = '';
});

confirmCreateBtn.addEventListener('click', async () => {
    const name = document.getElementById('newClassName').value;
    const description = document.getElementById('newClassDescription').value;
    const originalButtonText = confirmCreateBtn.textContent;
    
    if (!name) {
        showToast('Please enter a class name', 'error');
        return;
    }
    
    const enrollmentCode = generateRandomCode();
    
    // Show loading state
    confirmCreateBtn.disabled = true;
    confirmCreateBtn.textContent = 'Creating...';
    confirmCreateBtn.style.opacity = '0.7';
    
    try {
        await addDoc(collection(db, 'classes'), {
            name: name,
            description: description,
            teacherId: currentTeacherId,
            teacherName: currentTeacher.displayName || currentTeacher.email,
            createdAt: new Date(),
            enrollmentCode: enrollmentCode,
            enrolledStudents: []
        });
        
        showToast(`Class "${name}" created! Enrollment code: ${enrollmentCode}`, 'success');
        createClassModal.style.display = 'none';
        document.getElementById('newClassName').value = '';
        document.getElementById('newClassDescription').value = '';
        loadClasses();
        
    } catch (error) {
        showToast('Failed to create class: ' + error.message, 'error');
    } finally {
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = originalButtonText;
        confirmCreateBtn.style.opacity = '1';
    }
});


function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Show class detail modal
window.showClassDetail = async (classId, className, currentCode) => {
    document.getElementById('modalClassName').textContent = className;
    document.getElementById('modalClassCode').textContent = currentCode;
    
    const studentsList = document.getElementById('modalStudentsList');
    studentsList.innerHTML = '<div class="loading">Loading students...</div>';
    
    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        const classData = classDoc.data();
        const studentIds = classData.enrolledStudents || [];
        
        if (studentIds.length === 0) {
            studentsList.innerHTML = '<p>No students enrolled yet.</p>';
        } else {
            let html = '';
            for (const studentId of studentIds) {
                const studentDoc = await getDoc(doc(db, 'users', studentId));
                if (studentDoc.exists) {
                    const student = studentDoc.data();
                    html += `
                        <div class="student-item">
                            <div>
                                <strong>${escapeHtml(student.displayName || student.username)}</strong>
                                <div style="font-size: 12px; color: #64748b;">@${escapeHtml(student.username)} · ${escapeHtml(student.email)}</div>
                            </div>
                            <button class="remove-student-btn" data-class-id="${classId}" data-student-id="${studentId}">Remove</button>
                        </div>
                    `;
                }
            }
            studentsList.innerHTML = html;
            
            document.querySelectorAll('.remove-student-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const cId = btn.dataset.classId;
                    const sId = btn.dataset.studentId;
                    if (confirm('Remove this student from the class?')) {
                        await removeStudentFromClass(cId, sId);
                        showClassDetail(cId, className, currentCode);
                    }
                });
            });
        }
        
        window.currentClassId = classId;
        
    } catch (error) {
        console.error('Error loading students:', error);
        studentsList.innerHTML = '<div class="error">Failed to load students</div>';
    }
    
    classDetailModal.style.display = 'flex';
};

async function removeStudentFromClass(classId, studentId) {
    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        const classData = classDoc.data();
        const updatedStudents = (classData.enrolledStudents || []).filter(id => id !== studentId);
        await updateDoc(classRef, { enrolledStudents: updatedStudents });
        showToast('Student removed from class', 'success');
    } catch (error) {
        showToast('Failed to remove student: ' + error.message, 'error');
    }
}

generateNewCodeBtn.addEventListener('click', async () => {
    if (!window.currentClassId) return;
    const newCode = generateRandomCode();
    try {
        const classRef = doc(db, 'classes', window.currentClassId);
        await updateDoc(classRef, { enrollmentCode: newCode });
        document.getElementById('modalClassCode').textContent = newCode;
        showToast(`New enrollment code generated: ${newCode}`, 'success');
    } catch (error) {
        showToast('Failed to generate new code: ' + error.message, 'error');
    }
});

closeModalBtn.addEventListener('click', () => {
    classDetailModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === createClassModal) {
        createClassModal.style.display = 'none';
    }
    if (e.target === classDetailModal) {
        classDetailModal.style.display = 'none';
    }
    if (e.target === forgotPasswordModal) {
        forgotPasswordModal.style.display = 'none';
    }
});

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}