// super-admin/admin.js
// Super Admin Dashboard - Teacher Oversight

import { initSuperAdmin, logout } from './modules/auth.js';
import { loadTeachers, loadTeacherClasses, loadClassStudents, loadStudentProgress, getStudentAttempts } from './modules/teachers.js';

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
    
    if (state === 'authenticated') {
        authSection.style.display = 'none';
        adminPanel.style.display = 'block';
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
    } else {
        authSection.style.display = 'block';
        adminPanel.style.display = 'none';
        document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
            const { signInWithGoogle } = await import('./modules/auth.js');
            await signInWithGoogle();
        });
    }
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
    document.getElementById('teachersView').style.display = 'none';
    document.getElementById('teacherDetailView').style.display = 'block';
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'none';
    loadTeacherDetail(teacher);
}

function showClassDetailView(classItem) {
    currentClass = classItem;
    document.getElementById('teacherDetailView').style.display = 'none';
    document.getElementById('classDetailView').style.display = 'block';
    loadClassDetail(classItem);
}

function showStudentDetailView(student) {
    currentStudent = student;
    document.getElementById('classDetailView').style.display = 'none';
    document.getElementById('studentDetailView').style.display = 'block';
    loadStudentDetail(student);
}

// Load Teachers List
async function loadTeachersList() {
    const listDiv = document.getElementById('teachersList');
    listDiv.innerHTML = '<div class="loading">Loading teachers...</div>';
    
    const teachers = await loadTeachers();
    
    if (teachers.length === 0) {
        listDiv.innerHTML = '<p>No teachers added yet.</p>';
        return;
    }
    
    let html = '';
    for (const teacher of teachers) {
        // Get class count
        const classes = await loadTeacherClasses(teacher.id);
        html += `
            <div class="teacher-card" onclick="window.viewTeacher('${teacher.id}')">
                <h3>${escapeHtml(teacher.displayName || teacher.email)}</h3>
                <div>${escapeHtml(teacher.email)}</div>
                <div class="teacher-code">📌 Teacher Code: ${teacher.teacherCode}</div>
                <div class="stats">
                    <span>📚 ${classes.length} classes</span>
                    <span>👥 Loading students...</span>
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
    
    let html = `
        <div class="card">
            <h2>👩‍🏫 ${escapeHtml(teacher.displayName || teacher.email)}</h2>
            <div>📧 ${escapeHtml(teacher.email)}</div>
            <div class="teacher-code">📌 Teacher Code: ${teacher.teacherCode}</div>
        </div>
        <h2>📚 Classes (${classes.length})</h2>
    `;
    
    if (classes.length === 0) {
        html += '<p>No classes created yet.</p>';
    } else {
        for (const cls of classes) {
            // Get student count for this class
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
    
    let html = `
        <div class="card">
            <h2>📖 ${escapeHtml(classItem.name)}</h2>
            <div>${escapeHtml(classItem.description || 'No description')}</div>
        </div>
        <h2>👥 Students (${students.length})</h2>
    `;
    
    if (students.length === 0) {
        html += '<p>No students enrolled yet.</p>';
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
            <h2>👤 ${escapeHtml(student.displayName || student.username)}</h2>
            <div>@${escapeHtml(student.username)}</div>
            <div>📧 ${escapeHtml(student.email)}</div>
            <div>📅 Member since: ${student.createdAt?.toDate ? new Date(student.createdAt.toDate()).toLocaleDateString() : 'N/A'}</div>
        </div>
        
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
    // Student object already passed from class detail
    // We need to get full student data
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