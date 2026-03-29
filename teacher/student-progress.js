// teacher/student-progress.js
// Student Progress Overview - Shows all subjects with progress

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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

let studentId = null;
let studentData = null;
let allAttempts = [];

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
studentId = urlParams.get('studentId');
const studentName = urlParams.get('studentName');

// DOM Elements
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const studentNameEl = document.getElementById('studentName');
const subjectsList = document.getElementById('subjectsList');

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
    
    if (!studentId) {
        showToast('No student selected', 'error');
        setTimeout(() => window.location.href = 'class.html', 2000);
        return;
    }
    
    loadStudentData();
});

// Load student data
async function loadStudentData() {
    try {
        // Get student document
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        
        if (!studentDoc.exists) {
            showToast('Student not found', 'error');
            setTimeout(() => window.location.href = 'class.html', 2000);
            return;
        }
        
        studentData = studentDoc.data();
        
        // Set student name
        const displayName = studentName || studentData.displayName || studentData.username;
        studentNameEl.textContent = displayName;
        document.getElementById('pageTitle').textContent = `${displayName} - Progress`;
        
        // Get all attempts for this student
        const attemptsSnapshot = await getDocs(query(
            collection(db, 'attempts'),
            where('userId', '==', studentId)
        ));
        
        allAttempts = [];
        attemptsSnapshot.forEach(doc => {
            allAttempts.push({ id: doc.id, ...doc.data() });
        });
        
        // Calculate overall stats
        const overall = studentData.overall || { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 };
        const avgAccuracy = overall.quizzesTaken > 0 
            ? Math.round((overall.totalPoints / (overall.quizzesTaken * 100)) * 100) 
            : 0;
        
        document.getElementById('totalPoints').textContent = overall.totalPoints;
        document.getElementById('totalQuizzes').textContent = overall.quizzesTaken;
        document.getElementById('avgAccuracy').textContent = `${avgAccuracy}%`;
        document.getElementById('totalTime').textContent = formatTime(overall.totalTimeSpent || 0);
        
        // Load config for subject names
        const configResponse = await fetch('../config.json');
        const config = await configResponse.json();
        const subjectMap = {};
        config.subjects.forEach(s => { subjectMap[s.id] = s; });
        
        // Group attempts by subject
        const subjectStats = {};
        
        for (const attempt of allAttempts) {
            const subjectId = attempt.subject;
            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    totalScore: 0,
                    maxPossible: 0,
                    quizCount: 0,
                    lessonIds: new Set()
                };
            }
            
            subjectStats[subjectId].totalScore += attempt.score;
            subjectStats[subjectId].maxPossible += attempt.maxPossible;
            subjectStats[subjectId].quizCount++;
            if (attempt.lessonId) {
                subjectStats[subjectId].lessonIds.add(attempt.lessonId);
            }
        }
        
        // Get all subjects that have attempts or are in config
        const subjects = Object.keys(subjectStats).length > 0 ? Object.keys(subjectStats) : [];
        
        if (subjects.length === 0) {
            subjectsList.innerHTML = '<p>No quiz attempts yet.</p>';
            return;
        }
        
        // Render subjects
        let html = '';
        for (const subjectId of subjects) {
            const stats = subjectStats[subjectId];
            const accuracy = stats.maxPossible > 0 ? Math.round((stats.totalScore / stats.maxPossible) * 100) : 0;
            const subject = subjectMap[subjectId] || { name: subjectId, icon: '📚' };
            
            html += `
                <div class="subject-card" onclick="window.viewSubject('${subjectId}')">
                    <div class="subject-info">
                        <div class="subject-name">${subject.icon} ${subject.name}</div>
                        <div class="subject-stats">
                            ${stats.lessonIds.size} lessons · ${stats.quizCount} quizzes
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="progress-bar-container">
                            <div class="progress-fill" style="width: ${accuracy}%"></div>
                        </div>
                        <div class="subject-score">${accuracy}%</div>
                        <button class="view-btn">View Lessons →</button>
                    </div>
                </div>
            `;
        }
        
        subjectsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading student data:', error);
        subjectsList.innerHTML = '<div class="error">Failed to load progress</div>';
    }
}

// Navigate to subject page
window.viewSubject = (subjectId) => {
    window.location.href = `student-subject.html?studentId=${studentId}&subjectId=${subjectId}&studentName=${encodeURIComponent(studentName || studentData?.displayName || studentData?.username)}`;
};

// Back button
backBtn.addEventListener('click', () => {
    window.location.href = 'class.html';
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