// teacher/student-subject.js
// Subject Progress - Shows all lessons in a subject with progress

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
let subjectId = null;
let studentName = null;
let studentData = null;
let allAttempts = [];

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
studentId = urlParams.get('studentId');
subjectId = urlParams.get('subjectId');
studentName = urlParams.get('studentName');

// DOM Elements
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const studentNameEl = document.getElementById('studentName');
const subjectNameEl = document.getElementById('subjectName');
const subjectStatsEl = document.getElementById('subjectStats');
const lessonsList = document.getElementById('lessonsList');

function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const teacherQuery = query(collection(db, 'teachers'), where('email', '==', user.email));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (teacherSnapshot.empty) {
        showToast('Access denied', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    if (!studentId || !subjectId) {
        showToast('Invalid request', 'error');
        setTimeout(() => window.location.href = 'class.html', 2000);
        return;
    }
    
    loadData();
});

async function loadData() {
    try {
        // Load student data
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        if (studentDoc.exists) {
            studentData = studentDoc.data();
        }
        
        const displayName = studentName || studentData?.displayName || studentData?.username || 'Student';
        studentNameEl.textContent = displayName;
        document.getElementById('pageTitle').textContent = `${displayName} - ${subjectId}`;
        
        // Load config for subject name
        const configResponse = await fetch('../config.json');
        const config = await configResponse.json();
        const subject = config.subjects.find(s => s.id === subjectId);
        subjectNameEl.textContent = `${subject?.icon || '📚'} ${subject?.name || subjectId}`;
        
        // Get all attempts for this student
        const attemptsSnapshot = await getDocs(query(
            collection(db, 'attempts'),
            where('userId', '==', studentId),
            where('subject', '==', subjectId)
        ));
        
        allAttempts = [];
        attemptsSnapshot.forEach(doc => {
            allAttempts.push({ id: doc.id, ...doc.data() });
        });
        
        // Calculate subject overall stats
        let totalScore = 0;
        let totalMax = 0;
        for (const attempt of allAttempts) {
            totalScore += attempt.score;
            totalMax += attempt.maxPossible;
        }
        const accuracy = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
        subjectStatsEl.innerHTML = `
            <div class="subject-accuracy">${accuracy}%</div>
            <div class="subject-stats-detail">${allAttempts.length} quizzes taken</div>
        `;
        
        // Group attempts by lesson
        const lessonStats = {};
        for (const attempt of allAttempts) {
            const lessonId = attempt.lessonId;
            if (!lessonStats[lessonId]) {
                lessonStats[lessonId] = {
                    attempts: [],
                    totalScore: 0,
                    totalMax: 0
                };
            }
            lessonStats[lessonId].attempts.push(attempt);
            lessonStats[lessonId].totalScore += attempt.score;
            lessonStats[lessonId].totalMax += attempt.maxPossible;
        }
        
        // Get lesson details from Firestore
        if (Object.keys(lessonStats).length === 0) {
            lessonsList.innerHTML = '<p>No quizzes taken in this subject yet.</p>';
            return;
        }
        
        let html = '';
        for (const lessonId of Object.keys(lessonStats)) {
            const stats = lessonStats[lessonId];
            const lessonAccuracy = stats.totalMax > 0 ? Math.round((stats.totalScore / stats.totalMax) * 100) : 0;
            const lastAttempt = stats.attempts.sort((a, b) => 
                (b.completedAt?.toDate?.() || 0) - (a.completedAt?.toDate?.() || 0)
            )[0];
            const lastDate = lastAttempt?.completedAt?.toDate() ? new Date(lastAttempt.completedAt.toDate()).toLocaleDateString() : 'N/A';
            const attemptCount = stats.attempts.length;
            
            // Get lesson title
            let lessonTitle = lessonId;
            try {
                const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
                if (lessonDoc.exists) {
                    lessonTitle = lessonDoc.data().title || lessonId;
                }
            } catch (e) {
                console.log('Could not fetch lesson title');
            }
            
            html += `
                <div class="lesson-card" onclick="window.viewLesson('${lessonId}', '${escapeHtml(lessonTitle)}')">
                    <div class="lesson-info">
                        <div class="lesson-name">📖 ${escapeHtml(lessonTitle)}</div>
                        <div class="lesson-stats">
                            ${attemptCount} attempt${attemptCount !== 1 ? 's' : ''} · Last: ${lastDate}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="lesson-score">${lessonAccuracy}%</div>
                        <button class="view-btn">View Details →</button>
                    </div>
                </div>
            `;
        }
        
        lessonsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading subject data:', error);
        lessonsList.innerHTML = '<div class="error">Failed to load progress</div>';
    }
}

// Navigate to lesson progress page
window.viewLesson = (lessonId, lessonTitle) => {
    window.location.href = `student-lesson.html?studentId=${studentId}&lessonId=${lessonId}&lessonTitle=${encodeURIComponent(lessonTitle)}&subjectId=${subjectId}&studentName=${encodeURIComponent(studentName || studentData?.displayName || studentData?.username)}`;
};

// Back button
backBtn.addEventListener('click', () => {
    window.location.href = `student-progress.html?studentId=${studentId}&studentName=${encodeURIComponent(studentName || studentData?.displayName || studentData?.username)}`;
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