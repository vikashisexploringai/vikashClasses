// js/views/progress.js
// Progress dashboard page

import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { formatTime, formatDate } from '../core/utils.js';
import { renderLogin } from '../auth/login.js';
import { renderAllActivity } from './allActivity.js';

function renderProgress() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('📊 Progress');
    
    // Make sure Firebase is initialized
    initFirebase().then(() => {
        const auth = getAuth();
        const user = auth ? auth.currentUser : null;
        
        if (!user) {
            renderLogin();
            return;
        }
        
        content.innerHTML = `<div class="loading-spinner"></div>`;
        
        const db = getDb();
        if (!db) {
            content.innerHTML = '<div class="error-message">Database not initialized</div>';
            return;
        }
        
        Promise.all([
            db.collection('users').doc(user.uid).get(),
            db.collection('attempts')
                .where('userId', '==', user.uid)
                .orderBy('completedAt', 'desc')
                .limit(5)
                .get()
        ]).then(([userDoc, attemptsSnapshot]) => {
            if (!userDoc.exists) {
                content.innerHTML = '<div class="error-message">User data not found</div>';
                return;
            }
            
            const userData = userDoc.data();
    const overall = userData.overall || { 
    totalPoints: 0, 
    totalMaxPossible: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAttempted: 0,
    quizzesTaken: 0, 
    totalTimeSpent: 0 
};

// Accuracy = (total correct answers / total questions attempted) × 100
const avgAccuracy = overall.totalQuestionsAttempted > 0
    ? Math.round((overall.totalCorrectAnswers / overall.totalQuestionsAttempted) * 100)
    : 0;
            
            let html = `
                <div class="progress-container">
                    <div class="stats-card">
                        <div class="stats-header">📈 Overall Statistics</div>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value">${overall.totalPoints}</div>
                                <div class="stat-label">Total Points</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overall.quizzesTaken}</div>
                                <div class="stat-label">Quizzes</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${avgAccuracy}%</div>
                                <div class="stat-label">Accuracy</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${formatTime(overall.totalTimeSpent || 0)}</div>
                                <div class="stat-label">Total Time</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-header">🕒 Recent Activity</div>
            `;
            
            if (attemptsSnapshot.empty) {
                html += '<div class="empty-state">No quizzes taken yet</div>';
            } else {
                html += `<div class="activity-list">`;
                attemptsSnapshot.forEach(doc => {
                    const attempt = doc.data();
                    const dateStr = formatDate(attempt.completedAt);
                    const subjectIcon = attempt.subject === 'math' ? '📐' : 
                                       attempt.subject === 'english' ? '📚' : 
                                       attempt.subject === 'chemistry' ? '⚗️' : 
                                       attempt.subject === 'physics' ? '⚡' : '🔬';
                    
                    html += `
                        <div class="activity-item">
                            <div class="activity-main">
                                <span class="activity-title">${subjectIcon} ${escapeHtml(attempt.lessonTitle || attempt.lessonId)}</span>
                                <span class="activity-score">${attempt.score} pts</span>
                            </div>
                            <div class="activity-details">
                                <span>${attempt.questionsCorrect}/${attempt.totalQuestions} correct</span>
                                <span>•</span>
                                <span>${dateStr}</span>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
            }
            
            html += `
                <button class="view-all-btn" onclick="window.viewAllActivity()">📋 View All Activity</button>
                </div>
                </div>
            `;
            
            content.innerHTML = html;
            updateBottomNav('progress');
            
        }).catch(error => {
            console.error('Error loading progress:', error);
            
            // Handle missing index error
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                content.innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 40px;">
                        <p>📊 Progress data is being prepared.</p>
                        <p style="font-size: 14px; margin-top: 8px;">Please wait a few minutes and refresh the page.</p>
                        <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">Refresh</button>
                    </div>
                `;
            } else {
                content.innerHTML = '<div class="error-message">Failed to load progress</div>';
            }
        });
    }).catch(error => {
        console.error('Firebase init error:', error);
        content.innerHTML = '<div class="error-message">Failed to initialize</div>';
    });
}


function viewAllActivity() {
    renderAllActivity();
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make globally available
window.viewAllActivity = viewAllActivity;

export { renderProgress, viewAllActivity };