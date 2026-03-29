// teacher/student-lesson.js
// Lesson Progress - Shows all attempts for a specific lesson with detailed answers

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
let lessonId = null;
let subjectId = null;
let lessonTitle = null;
let studentName = null;
let studentData = null;
let lessonData = null;

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
studentId = urlParams.get('studentId');
lessonId = urlParams.get('lessonId');
lessonTitle = urlParams.get('lessonTitle');
subjectId = urlParams.get('subjectId');
studentName = urlParams.get('studentName');

// DOM Elements
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const studentNameEl = document.getElementById('studentName');
const lessonTitleEl = document.getElementById('lessonTitle');
const lessonSubjectEl = document.getElementById('lessonSubject');
const attemptsList = document.getElementById('attemptsList');

function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
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
    
    if (!studentId || !lessonId) {
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
        document.getElementById('pageTitle').textContent = `${displayName} - ${lessonTitle || 'Lesson'}`;
        
        // Load lesson data
        const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
        if (lessonDoc.exists) {
            lessonData = lessonDoc.data();
            lessonTitleEl.textContent = lessonData.title || lessonTitle || 'Lesson';
        } else {
            lessonTitleEl.textContent = lessonTitle || 'Lesson';
        }
        
        // Load config for subject name
        const configResponse = await fetch('../config.json');
        const config = await configResponse.json();
        const subject = config.subjects.find(s => s.id === subjectId);
        lessonSubjectEl.textContent = `${subject?.icon || '📚'} ${subject?.name || subjectId}`;
        
        // Get all attempts for this lesson
        const attemptsSnapshot = await getDocs(query(
            collection(db, 'attempts'),
            where('userId', '==', studentId),
            where('lessonId', '==', lessonId)
        ));
        
        const attempts = [];
        attemptsSnapshot.forEach(doc => {
            attempts.push({ id: doc.id, ...doc.data() });
        });
        
        attempts.sort((a, b) => (b.completedAt?.toDate?.() || 0) - (a.completedAt?.toDate?.() || 0));
        
        if (attempts.length === 0) {
            attemptsList.innerHTML = '<p>No attempts for this lesson yet.</p>';
            return;
        }
        
        // Calculate stats
        let totalScore = 0;
        let totalMax = 0;
        let bestScore = 0;
        for (const attempt of attempts) {
            totalScore += attempt.score;
            totalMax += attempt.maxPossible;
            const percent = (attempt.score / attempt.maxPossible) * 100;
            if (percent > bestScore) bestScore = percent;
        }
        const avgAccuracy = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
        
        // Render stats row
        const statsHtml = `
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-value">${attempts.length}</div>
                    <div class="stat-label">Attempts</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${avgAccuracy}%</div>
                    <div class="stat-label">Average</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.round(bestScore)}%</div>
                    <div class="stat-label">Best</div>
                </div>
            </div>
        `;
        
        // Render each attempt
        let attemptsHtml = '';
        for (let i = 0; i < attempts.length; i++) {
            const attempt = attempts[i];
            const percent = Math.round((attempt.score / attempt.maxPossible) * 100);
            const date = attempt.completedAt?.toDate?.() || new Date(attempt.completedAt);
            const isBest = percent === Math.round(bestScore);
            
            attemptsHtml += `
                <div class="attempt-card">
                    <div class="attempt-header" onclick="toggleAttempt(${i})">
                        <div>
                            <strong>Attempt #${attempts.length - i}</strong>
                            ${isBest ? ' 🏆 Best Score' : ''}
                        </div>
                        <div style="text-align: right;">
                            <div class="attempt-score">${percent}%</div>
                            <div class="attempt-date">${formatDate(date)}</div>
                        </div>
                        <div class="chevron">▼</div>
                    </div>
                    <div id="attempt-details-${i}" class="attempt-details">
                        <div class="loading">Loading questions...</div>
                    </div>
                </div>
            `;
        }
        
        attemptsList.innerHTML = statsHtml + attemptsHtml;
        
        // Load question details for each attempt
        for (let i = 0; i < attempts.length; i++) {
            const attempt = attempts[i];
            await loadAttemptQuestions(i, attempt);
        }
        
    } catch (error) {
        console.error('Error loading lesson data:', error);
        attemptsList.innerHTML = '<div class="error">Failed to load attempts</div>';
    }
}

async function loadAttemptQuestions(index, attempt) {
    const detailsDiv = document.getElementById(`attempt-details-${index}`);
    if (!detailsDiv) return;
    
    // Get the user answers from the attempt
    const userAnswers = attempt.userAnswers || [];
    
    if (userAnswers.length === 0) {
        detailsDiv.innerHTML = '<p>Detailed answers not available for this attempt</p>';
        return;
    }
    
    let questionsHtml = '';
    for (let i = 0; i < userAnswers.length; i++) {
        const answer = userAnswers[i];
        const isCorrect = answer.isCorrect;
        
        questionsHtml += `
            <div class="question-item">
                <div class="question-status ${isCorrect ? 'status-correct' : 'status-wrong'}">
                    ${isCorrect ? '✓' : '✗'}
                </div>
                <div class="question-text">
                    <div>${escapeHtml(answer.questionText)}</div>
                    <div class="question-answer">
                        <strong>Your answer:</strong> ${escapeHtml(answer.userSelected || 'Not answered')}<br>
                        <strong>Correct answer:</strong> ${escapeHtml(answer.correctAnswer)}
                    </div>
                    ${answer.explanation ? `<div class="question-explanation" style="margin-top: 8px; font-size: 12px; color: #3b82f6;">💡 ${escapeHtml(answer.explanation)}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    detailsDiv.innerHTML = questionsHtml;
}

// Toggle attempt details
window.toggleAttempt = (index) => {
    const details = document.getElementById(`attempt-details-${index}`);
    const header = details?.previousElementSibling;
    const chevron = header?.querySelector('.chevron');
    
    if (details) {
        details.classList.toggle('open');
        if (chevron) {
            chevron.classList.toggle('open');
        }
    }
};

// Back button
backBtn.addEventListener('click', () => {
    window.location.href = `student-subject.html?studentId=${studentId}&subjectId=${subjectId}&studentName=${encodeURIComponent(studentName || studentData?.displayName || studentData?.username)}`;
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