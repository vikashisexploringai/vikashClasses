// teacher/class.js
// Class Management Page

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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

let classId = null;
let classData = null;
let currentTeacherId = null;

// DOM Elements
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const classNameHeader = document.getElementById('classNameHeader');
const classNameInput = document.getElementById('className');
const classDescription = document.getElementById('classDescription');
const saveClassDetailsBtn = document.getElementById('saveClassDetailsBtn');
const enrollmentCodeSpan = document.getElementById('enrollmentCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const generateNewCodeBtn = document.getElementById('generateNewCodeBtn');
const subjectsList = document.getElementById('subjectsList');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const studentsList = document.getElementById('studentsList');
const viewAllStudentsBtn = document.getElementById('viewAllStudentsBtn');

// Modals
const addSubjectModal = document.getElementById('addSubjectModal');
const cancelSubjectBtn = document.getElementById('cancelSubjectBtn');
const confirmSubjectBtn = document.getElementById('confirmSubjectBtn');
const newSubjectName = document.getElementById('newSubjectName');
const newSubjectIcon = document.getElementById('newSubjectIcon');
const lessonsModal = document.getElementById('lessonsModal');
const closeLessonsBtn = document.getElementById('closeLessonsBtn');
const studentProgressModal = document.getElementById('studentProgressModal');
const closeProgressBtn = document.getElementById('closeProgressBtn');

// Toast function
function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
classId = urlParams.get('id');

if (!classId) {
    window.location.href = 'index.html';
}

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verify user is a teacher
    const teacherQuery = query(collection(db, 'teachers'), where('email', '==', user.email));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (teacherSnapshot.empty) {
        showToast('Access denied', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    currentTeacherId = teacherSnapshot.docs[0].id;
    loadClassData();
});

// Load class data
async function loadClassData() {
    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists) {
            showToast('Class not found', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        classData = classDoc.data();
        
        // Verify teacher owns this class
        if (classData.teacherId !== currentTeacherId) {
            showToast('Access denied', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Update UI
        classNameHeader.textContent = classData.name;
        classNameInput.value = classData.name;
        classDescription.value = classData.description || '';
        enrollmentCodeSpan.textContent = classData.enrollmentCode || 'Not set';
        
        // Load subjects
        loadSubjects();
        
        // Load students (show first 5)
        loadStudents(5);
        
    } catch (error) {
        console.error('Error loading class:', error);
        showToast('Failed to load class', 'error');
    }
}

// Load subjects for this class
async function loadSubjects() {
    subjectsList.innerHTML = '<div class="loading">Loading subjects...</div>';
    
    try {
        const subjectsRef = collection(db, 'subjects');
        const q = query(subjectsRef, where('classId', '==', classId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            subjectsList.innerHTML = '<p>No subjects added yet. Click "Add Subject" to get started.</p>';
            return;
        }
        
        let html = '';
        for (const docSnap of snapshot.docs) {
            const subject = docSnap.data();
            
            // Count lessons for this subject
            const lessonsRef = collection(db, 'lessons');
            const lessonsQuery = query(lessonsRef, where('subjectId', '==', docSnap.id));
            const lessonsSnapshot = await getDocs(lessonsQuery);
            
            html += `
                <div class="subject-card">
                    <div>
                        <div class="subject-name">${subject.icon || '📚'} ${escapeHtml(subject.name)}</div>
                        <div class="subject-stats">${lessonsSnapshot.size} lessons</div>
                    </div>
                    <div>
                        <button class="btn-secondary manage-lessons-btn" data-subject-id="${docSnap.id}" data-subject-name="${escapeHtml(subject.name)}">Manage Lessons</button>
                    </div>
                </div>
            `;
        }
        subjectsList.innerHTML = html;
        
        // Add event listeners to manage lessons buttons
        document.querySelectorAll('.manage-lessons-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subjectId = btn.dataset.subjectId;
                const subjectName = btn.dataset.subjectName;
                showLessonsModal(subjectId, subjectName);
            });
        });
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        subjectsList.innerHTML = '<div class="error">Failed to load subjects</div>';
    }
}

// Load students (limit = number of students to show)
async function loadStudents(limit = 5) {
    studentsList.innerHTML = '<div class="loading">Loading students...</div>';
    
    try {
        const enrolledStudentIds = classData.enrolledStudents || [];
        
        if (enrolledStudentIds.length === 0) {
            studentsList.innerHTML = '<p>No students enrolled yet.</p>';
            return;
        }
        
        const studentsToShow = enrolledStudentIds.slice(0, limit);
        let html = '';
        
        for (const studentId of studentsToShow) {
            const studentDoc = await getDoc(doc(db, 'users', studentId));
            if (studentDoc.exists) {
                const student = studentDoc.data();
                html += `
                    <div class="student-item">
                        <div>
                            <strong>${escapeHtml(student.displayName || student.username)}</strong>
                            <div style="font-size: 12px; color: #64748b;">@${escapeHtml(student.username)}</div>
                        </div>
                        <button class="btn-secondary view-student-btn" data-student-id="${studentId}" data-student-name="${escapeHtml(student.displayName || student.username)}">View Progress</button>
                    </div>
                `;
            }
        }
        
        studentsList.innerHTML = html;
        
        // Add event listeners to view student buttons
        document.querySelectorAll('.view-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const studentId = btn.dataset.studentId;
                const studentName = btn.dataset.studentName;
                showStudentProgress(studentId, studentName);
            });
        });
        
        // Show "View All" button if there are more students
        if (enrolledStudentIds.length > limit) {
            viewAllStudentsBtn.style.display = 'block';
        } else {
            viewAllStudentsBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading students:', error);
        studentsList.innerHTML = '<div class="error">Failed to load students</div>';
    }
}

// Show lessons modal
async function showLessonsModal(subjectId, subjectName) {
    const lessonsListDiv = document.getElementById('lessonsList');
    const lessonsModalTitle = document.getElementById('lessonsModalTitle');
    lessonsModalTitle.textContent = `${subjectName} - Lessons`;
    lessonsListDiv.innerHTML = '<div class="loading">Loading lessons...</div>';
    lessonsModal.style.display = 'flex';
    
    try {
        const lessonsRef = collection(db, 'lessons');
        const q = query(lessonsRef, where('subjectId', '==', subjectId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            lessonsListDiv.innerHTML = '<p>No lessons yet. Add lessons to this subject.</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(docSnap => {
            const lesson = docSnap.data();
            html += `
                <div class="subject-card" style="margin-bottom: 8px;">
                    <div>
                        <div><strong>📖 ${escapeHtml(lesson.title)}</strong></div>
                        <div style="font-size: 12px; color: #64748b;">${lesson.questions?.length || 0} questions</div>
                    </div>
                    <div>
                        <button class="btn-warning" style="padding: 4px 12px;">Edit</button>
                        <button class="btn-danger" style="padding: 4px 12px;">Delete</button>
                    </div>
                </div>
            `;
        });
        lessonsListDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading lessons:', error);
        lessonsListDiv.innerHTML = '<div class="error">Failed to load lessons</div>';
    }
}

// Show student progress modal
async function showStudentProgress(studentId, studentName) {
    const studentNameModal = document.getElementById('studentNameModal');
    const studentProgressContent = document.getElementById('studentProgressContent');
    studentNameModal.textContent = studentName;
    studentProgressContent.innerHTML = '<div class="loading">Loading progress...</div>';
    studentProgressModal.style.display = 'flex';
    
    try {
        // Get student data
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        const studentData = studentDoc.data();
        const overall = studentData.overall || { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 };
        const avgAccuracy = overall.quizzesTaken > 0 
            ? Math.round((overall.totalPoints / (overall.quizzesTaken * 100)) * 100) 
            : 0;
        
        // Get recent attempts
        const attemptsRef = collection(db, 'attempts');
        const q = query(attemptsRef, where('userId', '==', studentId), where('classId', '==', classId));
        const attemptsSnapshot = await getDocs(q);
        
        let attemptsHtml = '';
        if (attemptsSnapshot.empty) {
            attemptsHtml = '<p>No attempts in this class yet.</p>';
        } else {
            attemptsHtml = '<div style="margin-top: 16px;"><strong>Recent Attempts:</strong></div>';
            attemptsSnapshot.forEach(docSnap => {
                const attempt = docSnap.data();
                attemptsHtml += `
                    <div style="border-top: 1px solid #e2e8f0; padding: 8px 0;">
                        <div>📖 ${escapeHtml(attempt.lessonTitle || attempt.lessonId)}</div>
                        <div>Score: ${attempt.score}/${attempt.maxPossible} (${attempt.accuracy}%)</div>
                        <div style="font-size: 12px; color: #64748b;">${attempt.completedAt?.toDate ? new Date(attempt.completedAt.toDate()).toLocaleString() : 'N/A'}</div>
                    </div>
                `;
            });
        }
        
        studentProgressContent.innerHTML = `
            <div>
                <div><strong>Total Points:</strong> ${overall.totalPoints}</div>
                <div><strong>Quizzes Taken:</strong> ${overall.quizzesTaken}</div>
                <div><strong>Accuracy:</strong> ${avgAccuracy}%</div>
                <div><strong>Total Time:</strong> ${formatTime(overall.totalTimeSpent || 0)}</div>
            </div>
            ${attemptsHtml}
        `;
        
    } catch (error) {
        console.error('Error loading student progress:', error);
        studentProgressContent.innerHTML = '<div class="error">Failed to load progress</div>';
    }
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// Save class details
saveClassDetailsBtn.addEventListener('click', async () => {
    const newName = classNameInput.value.trim();
    const newDescription = classDescription.value.trim();
    
    if (!newName) {
        showToast('Class name is required', 'error');
        return;
    }
    
    saveClassDetailsBtn.disabled = true;
    saveClassDetailsBtn.textContent = 'Saving...';
    
    try {
        await updateDoc(doc(db, 'classes', classId), {
            name: newName,
            description: newDescription
        });
        
        classNameHeader.textContent = newName;
        showToast('Class details saved!', 'success');
        
    } catch (error) {
        console.error('Error saving class:', error);
        showToast('Failed to save', 'error');
    } finally {
        saveClassDetailsBtn.disabled = false;
        saveClassDetailsBtn.textContent = 'Save Changes';
    }
});

// Generate new enrollment code
generateNewCodeBtn.addEventListener('click', async () => {
    const newCode = generateRandomCode();
    
    try {
        await updateDoc(doc(db, 'classes', classId), {
            enrollmentCode: newCode
        });
        
        enrollmentCodeSpan.textContent = newCode;
        showToast(`New enrollment code: ${newCode}`, 'success');
        
    } catch (error) {
        console.error('Error generating code:', error);
        showToast('Failed to generate code', 'error');
    }
});

// Copy enrollment code
copyCodeBtn.addEventListener('click', () => {
    const code = enrollmentCodeSpan.textContent;
    navigator.clipboard.writeText(code);
    showToast('Code copied to clipboard!', 'success');
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

// Add subject
addSubjectBtn.addEventListener('click', () => {
    newSubjectName.value = '';
    newSubjectIcon.value = '';
    addSubjectModal.style.display = 'flex';
});

cancelSubjectBtn.addEventListener('click', () => {
    addSubjectModal.style.display = 'none';
});

confirmSubjectBtn.addEventListener('click', async () => {
    const name = newSubjectName.value.trim();
    const icon = newSubjectIcon.value.trim() || '📚';
    
    if (!name) {
        showToast('Subject name is required', 'error');
        return;
    }
    
    confirmSubjectBtn.disabled = true;
    confirmSubjectBtn.textContent = 'Adding...';
    
    try {
        await addDoc(collection(db, 'subjects'), {
            name: name,
            icon: icon,
            classId: classId,
            teacherId: currentTeacherId,
            createdAt: new Date()
        });
        
        showToast(`Subject "${name}" added!`, 'success');
        addSubjectModal.style.display = 'none';
        loadSubjects();
        
    } catch (error) {
        console.error('Error adding subject:', error);
        showToast('Failed to add subject', 'error');
    } finally {
        confirmSubjectBtn.disabled = false;
        confirmSubjectBtn.textContent = 'Add Subject';
    }
});

// View all students
viewAllStudentsBtn.addEventListener('click', () => {
    loadStudents(100); // Load all students
    viewAllStudentsBtn.style.display = 'none';
});

// Modal close buttons
closeLessonsBtn.addEventListener('click', () => {
    lessonsModal.style.display = 'none';
});

closeProgressBtn.addEventListener('click', () => {
    studentProgressModal.style.display = 'none';
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === addSubjectModal) addSubjectModal.style.display = 'none';
    if (e.target === lessonsModal) lessonsModal.style.display = 'none';
    if (e.target === studentProgressModal) studentProgressModal.style.display = 'none';
});

// Back button
backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}