// super-admin/admin.js
// Super Admin Dashboard - Teacher Oversight

import { initSuperAdmin, logout } from './modules/auth.js';
import { 
    loadTeachers, 
    loadTeacherClasses, 
    loadClassStudents, 
    loadStudentProgress, 
    getStudentAttempts,
    addTeacher,
    removeTeacher
} from './modules/teachers.js';
import { db, collection, getDocs, doc, getDoc, deleteDoc } from './modules/auth.js';

let currentTeacher = null;
let currentClass = null;
let currentStudent = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initSuperAdmin(handleAuthState);
});

function handleAuthState(state, user) {
    const authSection = document.getElementById('authSection');
    const adminPanel = document.getElementById('adminPanel');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (state === 'authenticated') {
        authSection.style.display = 'none';
        adminPanel.style.display = 'block';
        logoutBtn.style.display = 'block';
        setupTabs();
        showTeachersView();
        loadAllClasses(); // Preload classes for the Classes tab
    } else if (state === 'unauthorized') {
        authSection.innerHTML = `
            <div class="error">⚠️ You are not authorized as Super Admin.</div>
            <button id="googleLoginBtn" class="logout-btn" style="background: #3b82f6;">Sign in with Google</button>
        `;
        document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
            const { signInWithGoogle } = await import('./modules/auth.js');
            await signInWithGoogle();
        });
        adminPanel.style.display = 'none';
        logoutBtn.style.display = 'none';
    } else {
        authSection.style.display = 'block';
        adminPanel.style.display = 'none';
        logoutBtn.style.display = 'none';
        document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
            const { signInWithGoogle } = await import('./modules/auth.js');
            await signInWithGoogle();
        });
    }
}

// Tab switching
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active class on buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active class on content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Load data for the tab
            if (tabId === 'teachers') {
                loadTeachersList();
            } else if (tabId === 'classes') {
                loadAllClasses();
            }
        });
    });
    
    // Add teacher button
    document.getElementById('addTeacherBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('teacherEmail')?.value;
        const name = document.getElementById('teacherName')?.value;
        
        if (!email) {
            alert('Please enter teacher email');
            return;
        }
        
        const addBtn = document.getElementById('addTeacherBtn');
        addBtn.textContent = 'Adding...';
        addBtn.disabled = true;
        
        await addTeacher(email, name);
        
        addBtn.textContent = 'Generate Code & Add';
        addBtn.disabled = false;
        
        document.getElementById('teacherEmail').value = '';
        document.getElementById('teacherName').value = '';
        loadTeachersList();
    });
}

// Navigation functions
function showTeachersView() {
    document.getElementById('teachersView').style.display = 'block';
    document.getElementById('teacherDetailView').style.display = 'none';
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'none';
    loadTeachersList();
}

function showTeacherDetailView(teacher) {
    currentTeacher = teacher;
    document.getElementById('teacherName').textContent = teacher.displayName || teacher.email;
    document.getElementById('teachersView').style.display = 'none';
    document.getElementById('teacherDetailView').style.display = 'block';
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'none';
    loadTeacherDetail(teacher);
}

function showClassDetailView(classItem) {
    currentClass = classItem;
    document.getElementById('className').textContent = classItem.name;
    document.getElementById('teacherDetailView').style.display = 'none';
    document.getElementById('classDetailView').style.display = 'block';
    document.getElementById('studentDetailView').style.display = 'none';
    loadClassDetail(classItem);
}

function showStudentDetailView(student) {
    currentStudent = student;
    document.getElementById('studentName').textContent = student.displayName || student.username;
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'block';
    loadStudentDetail(student);
}

// Load Teachers List
async function loadTeachersList() {
    const listDiv = document.getElementById('teachersList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '<div class="loading">Loading teachers...</div>';
    
    const teachers = await loadTeachers();
    
    if (teachers.length === 0) {
        listDiv.innerHTML = '<p>No teachers added yet.</p>';
        return;
    }
    
    let html = '';
    for (const teacher of teachers) {
        const classes = await loadTeacherClasses(teacher.id);
        html += `
            <div class="teacher-card" onclick="window.viewTeacher('${teacher.id}')">
                <h3>${escapeHtml(teacher.displayName || teacher.email)}</h3>
                <div>${escapeHtml(teacher.email)}</div>
                <div class="teacher-code">📌 Teacher Code: ${teacher.teacherCode}</div>
                <div class="stats">
                    <span>📚 ${classes.length} classes</span>
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); window.deleteTeacher('${teacher.id}')">Remove</button>
            </div>
        `;
    }
    listDiv.innerHTML = html;
}

// Load Teacher Detail (shows all classes)
async function loadTeacherDetail(teacher) {
    const contentDiv = document.getElementById('teacherDetailContent');
    contentDiv.innerHTML = '<div class="loading">Loading classes...</div>';
    
    const classes = await loadTeacherClasses(teacher.id);
    
    let html = '';
    
    if (classes.length === 0) {
        html = '<p>No classes created yet.</p>';
    } else {
        for (const cls of classes) {
            const students = await loadClassStudents(cls.id);
            html += `
                <div class="class-card" onclick="window.viewClass('${cls.id}')">
                    <h3>📖 ${escapeHtml(cls.name)}</h3>
                    <div>${escapeHtml(cls.description || 'No description')}</div>
                    <div class="stats">
                        <span>👥 ${students.length} students</span>
                        <span>📅 Created: ${cls.createdAt?.toDate ? new Date(cls.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            `;
        }
    }
    
    contentDiv.innerHTML = html;
}

// Load Class Detail (shows all students)
async function loadClassDetail(classItem) {
    const contentDiv = document.getElementById('classDetailContent');
    contentDiv.innerHTML = '<div class="loading">Loading students...</div>';
    
    const students = await loadClassStudents(classItem.id);
    
    let html = '';
    
    if (students.length === 0) {
        html = '<p>No students enrolled yet.</p>';
    } else {
        for (const student of students) {
            html += `
                <div class="student-card" onclick="window.viewStudent('${student.id}')">
                    <h3>${escapeHtml(student.displayName || student.username)}</h3>
                    <div>@${escapeHtml(student.username)}</div>
                    <div>📧 ${escapeHtml(student.email)}</div>
                    <div class="stats">
                        <span>📅 Enrolled: ${student.enrolledAt?.toDate ? new Date(student.enrolledAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="progress-preview">📊 Click to view progress & attempts</div>
                </div>
            `;
        }
    }
    
    contentDiv.innerHTML = html;
}

// Load Student Detail (shows progress and attempts)
async function loadStudentDetail(student) {
    const contentDiv = document.getElementById('studentDetailContent');
    contentDiv.innerHTML = '<div class="loading">Loading student data...</div>';
    
    const progress = await loadStudentProgress(student.id);
    const attempts = await getStudentAttempts(student.id);
    
    const overall = progress.overall || { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 };
    const avgAccuracy = overall.quizzesTaken > 0 
        ? Math.round((overall.totalPoints / (overall.quizzesTaken * 100)) * 100) 
        : 0;
    
    let html = `
        <div class="card">
            <h3>📊 Overall Statistics</h3>
            <div class="stats" style="flex-wrap: wrap;">
                <div><strong>${overall.totalPoints}</strong> points</div>
                <div><strong>${overall.quizzesTaken}</strong> quizzes</div>
                <div><strong>${avgAccuracy}%</strong> accuracy</div>
                <div><strong>${formatTime(overall.totalTimeSpent || 0)}</strong> total time</div>
            </div>
        </div>
        
        <h3>📝 Recent Attempts</h3>
    `;
    
    if (attempts.length === 0) {
        html += '<p>No quiz attempts yet.</p>';
    } else {
        for (const attempt of attempts.slice(0, 10)) {
            html += `
                <div class="student-card" style="cursor: default;">
                    <div><strong>${escapeHtml(attempt.lessonTitle || attempt.lessonId)}</strong></div>
                    <div>Score: ${attempt.score}/${attempt.maxPossible} (${attempt.accuracy}%)</div>
                    <div>${attempt.questionsCorrect}/${attempt.totalQuestions} correct</div>
                    <div>⏱️ ${formatTime(attempt.timeSpent || 0)}</div>
                    <div class="stats">📅 ${attempt.completedAt?.toDate ? new Date(attempt.completedAt.toDate()).toLocaleString() : 'N/A'}</div>
                </div>
            `;
        }
    }
    
    contentDiv.innerHTML = html;
}

// Load all classes across all teachers
async function loadAllClasses() {
    const listDiv = document.getElementById('allClassesList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '<div class="loading">Loading classes...</div>';
    
    try {
        const classesRef = collection(db, 'classes');
        const snapshot = await getDocs(classesRef);
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p>No classes created yet.</p>';
            return;
        }
        
        let html = '';
        for (const docSnap of snapshot.docs) {
            const classData = docSnap.data();
            // Get teacher name
            let teacherName = 'Unknown';
            if (classData.teacherId) {
                const teacherDoc = await getDoc(doc(db, 'teachers', classData.teacherId));
                if (teacherDoc.exists) {
                    teacherName = teacherDoc.data().displayName || teacherDoc.data().email;
                }
            }
            const students = await loadClassStudents(docSnap.id);
            
            html += `
                <div class="class-card" onclick="window.viewAllClass('${docSnap.id}')">
                    <h3>📖 ${escapeHtml(classData.name)}</h3>
                    <div>${escapeHtml(classData.description || 'No description')}</div>
                    <div class="stats">
                        <span>👨‍🏫 Teacher: ${escapeHtml(teacherName)}</span>
                        <span>👥 ${students.length} students</span>
                        <span>📅 Created: ${classData.createdAt?.toDate ? new Date(classData.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); window.deleteClass('${docSnap.id}')">Delete</button>
                </div>
            `;
        }
        listDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading classes:', error);
        listDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Delete teacher
window.deleteTeacher = async (teacherId) => {
    if (!confirm('Remove this teacher? This will delete all their classes and data.')) return;
    await removeTeacher(teacherId);
    loadTeachersList();
    loadAllClasses(); // Refresh classes list too
};

// Delete class
window.deleteClass = async (classId) => {
    if (!confirm('Delete this class? This will delete all lessons and student enrollments.')) return;
    try {
        await deleteDoc(doc(db, 'classes', classId));
        showToast('Class deleted successfully', 'success');
        loadAllClasses();
        loadTeachersList(); // Refresh teachers list too
    } catch (error) {
        console.error('Error deleting class:', error);
        showToast('Failed to delete class', 'error');
    }
};

// View class from All Classes view
window.viewAllClass = async (classId) => {
    const classRef = doc(db, 'classes', classId);
    const classDoc = await getDoc(classRef);
    if (classDoc.exists) {
        showClassDetailView({ id: classDoc.id, ...classDoc.data() });
    }
};

// Make functions globally available for onclick handlers
window.viewTeacher = async (teacherId) => {
    const teachers = await loadTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) showTeacherDetailView(teacher);
};

window.viewClass = async (classId) => {
    const classes = await loadTeacherClasses(currentTeacher?.id);
    const classItem = classes.find(c => c.id === classId);
    if (classItem) showClassDetailView(classItem);
};

window.viewStudent = (studentId) => {
    loadClassStudents(currentClass?.id).then(students => {
        const student = students.find(s => s.id === studentId);
        if (student) showStudentDetailView(student);
    });
};

// Back buttons
document.getElementById('backToTeachersBtn')?.addEventListener('click', () => showTeachersView());
document.getElementById('backToTeacherBtn')?.addEventListener('click', () => showTeacherDetailView(currentTeacher));
document.getElementById('backToClassBtn')?.addEventListener('click', () => showClassDetailView(currentClass));

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logout();
    location.reload();
});

// Helper functions
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

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ef4444' : '#22c55e'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        animation: fadeInOut 3s ease forwards;
    `;
    
    // Add animation styles if not present
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}