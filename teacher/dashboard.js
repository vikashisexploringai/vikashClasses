// teacher/dashboard.js
// Teacher Dashboard

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
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
const createClassBtn = document.getElementById('createClassBtn');
const createClassModal = document.getElementById('createClassModal');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const classDetailModal = document.getElementById('classDetailModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const generateNewCodeBtn = document.getElementById('generateNewCodeBtn');

// Auth state listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const teacherQuery = query(collection(db, 'teachers'), where('email', '==', user.email));
        const teacherSnapshot = await getDocs(teacherQuery);
        
        if (!teacherSnapshot.empty) {
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
            alert('You are not registered as a teacher.');
            signOut(auth);
            loginSection.style.display = 'block';
            dashboard.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    } else {
        loginSection.style.display = 'block';
        dashboard.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
});

// Login
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Forgot Password
forgotPasswordLink.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Check your inbox (and spam folder).');
    } catch (error) {
        alert('Failed to send reset email: ' + error.message);
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
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
    
    if (!name) {
        alert('Please enter a class name');
        return;
    }
    
    const enrollmentCode = generateRandomCode();
    
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
        
        alert(`Class "${name}" created! Enrollment code: ${enrollmentCode}`);
        createClassModal.style.display = 'none';
        document.getElementById('newClassName').value = '';
        document.getElementById('newClassDescription').value = '';
        loadClasses();
        
    } catch (error) {
        alert('Failed to create class: ' + error.message);
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
        alert('Student removed from class');
    } catch (error) {
        alert('Failed to remove student: ' + error.message);
    }
}

generateNewCodeBtn.addEventListener('click', async () => {
    if (!window.currentClassId) return;
    const newCode = generateRandomCode();
    try {
        const classRef = doc(db, 'classes', window.currentClassId);
        await updateDoc(classRef, { enrollmentCode: newCode });
        document.getElementById('modalClassCode').textContent = newCode;
        alert(`New enrollment code generated: ${newCode}`);
    } catch (error) {
        alert('Failed to generate new code: ' + error.message);
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
});

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}