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
        showTeachersView();
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

// Navigation functions
function showTeachersView() {
    document.getElementById('teachersView').style.display = 'block';
    document.getElementById('teacherDetailView').style.display = 'none';
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'none';
    loadTeachersList();
}

function showTeacherDetailView(teacher) {
    console.log('showTeacherDetailView called with:', teacher);
    currentTeacher = teacher;
    const teacherNameElement = document.getElementById('teacherName');
    console.log('teacherNameElement found:', teacherNameElement);
    const nameToShow = teacher.displayName || teacher.email || 'Unknown Teacher';
    console.log('Setting teacher name to:', nameToShow);
    if (teacherNameElement) {
        teacherNameElement.textContent = nameToShow;
        console.log('After setting, textContent is:', teacherNameElement.textContent);
    } else {
        console.error('teacherName element NOT found!');
    }
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
            <div class="teacher-card">
                <div class="teacher-name">${escapeHtml(teacher.displayName || teacher.email)}</div>
                <div class="teacher-email">${escapeHtml(teacher.email)}</div>
                <div class="teacher-code">📌 Teacher Code: ${teacher.teacherCode}</div>
                <div class="stats">📚 ${classes.length} classes</div>
                <div class="button-group">
                    <button class="view-btn" onclick="window.viewTeacher('${teacher.id}')">View Classes</button>
                    <button class="delete-btn" onclick="window.deleteTeacher('${teacher.id}')">Remove</button>
                </div>
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
    
    if (classes.length === 0) {
        contentDiv.innerHTML = '<p>No classes created yet.</p>';
        return;
    }
    
    let html = '';
    for (const cls of classes) {
        const students = await loadClassStudents(cls.id);
        html += `
            <div class="class-card" onclick="window.viewClass('${cls.id}')">
                <div class="class-name">📖 ${escapeHtml(cls.name)}</div>
                <div class="class-description">${escapeHtml(cls.description || 'No description')}</div>
                <div class="stats-detail">
                    <span>👥 ${students.length} students</span>
                    <span>📅 Created: ${cls.createdAt?.toDate ? new Date(cls.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
        `;
    }
    contentDiv.innerHTML = html;
}

// Load Class Detail (shows all students)
async function loadClassDetail(classItem) {
    const contentDiv = document.getElementById('classDetailContent');
    contentDiv.innerHTML = '<div class="loading">Loading students...</div>';
    
    const students = await loadClassStudents(classItem.id);
    
    if (students.length === 0) {
        contentDiv.innerHTML = '<p>No students enrolled yet.</p>';
        return;
    }
    
    let html = '';
    for (const student of students) {
        html += `
            <div class="student-card" onclick="window.viewStudent('${student.id}')">
                <div class="student-name">👤 ${escapeHtml(student.displayName || student.username)}</div>
                <div class="student-username">@${escapeHtml(student.username)}</div>
                <div class="stats-detail">
                    <span>📧 ${escapeHtml(student.email)}</span>
                    <span>📅 Enrolled: ${student.enrolledAt?.toDate ? new Date(student.enrolledAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="progress-preview">📊 Click to view progress & attempts</div>
            </div>
        `;
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
            <div class="stats-detail">
                <div><strong>${overall.totalPoints}</strong> points</div>
                <div><strong>${overall.quizzesTaken}</strong> quizzes</div>
                <div><strong>${avgAccuracy}%</strong> accuracy</div>
                <div><strong>${formatTime(overall.totalTimeSpent || 0)}</strong> total time</div>
            </div>
        </div>
        
        <h3 style="margin: 20px 0 12px 0;">📝 Recent Attempts</h3>
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
                    <div class="stats-detail">📅 ${attempt.completedAt?.toDate ? new Date(attempt.completedAt.toDate()).toLocaleString() : 'N/A'}</div>
                </div>
            `;
        }
    }
    
    contentDiv.innerHTML = html;
}

// Delete teacher
window.deleteTeacher = async (teacherId) => {
    if (!confirm('Remove this teacher? This will delete all their classes and data.')) return;
    await removeTeacher(teacherId);
    loadTeachersList();
};

// Make functions globally available for onclick handlers
window.viewTeacher = async (teacherId) => {
    const teachers = await loadTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    console.log('Teacher object:', teacher);
    console.log('Teacher name:', teacher.displayName);
    console.log('Teacher email:', teacher.email);
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