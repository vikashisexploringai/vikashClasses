// js/views/allActivity.js
// All Activity page - shows all quiz attempts

import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { formatTime, formatDate } from '../core/utils.js';
import { renderProgress } from './progress.js';

function renderAllActivity() {
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    const content = document.getElementById('main-content');
    
    updateHeader('📋 All Activity', true, 'renderProgress');
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    initFirebase().then(() => {
        const auth = getAuth();
        const user = auth ? auth.currentUser : null;
        
        if (!user) {
            renderProgress();
            return;
        }
        
        const db = getDb();
        if (!db) {
            content.innerHTML = '<div class="error-message">Database not initialized</div>';
            return;
        }
        
        db.collection('attempts')
            .where('userId', '==', user.uid)
            .orderBy('completedAt', 'desc')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    content.innerHTML = `
                        <div class="all-activity-container">
                            <div class="empty-state">No activity yet</div>
                            <button class="back-btn" onclick="window.renderProgress()">← Back to Progress</button>
                        </div>
                    `;
                    updateBottomNav('progress');
                    return;
                }
                
                let html = `
                    <div class="all-activity-container">
                        <div class="all-activity-list">
                `;
                
                snapshot.forEach(doc => {
                    const attempt = doc.data();
                    const dateStr = formatDate(attempt.completedAt);
                    const timeStr = attempt.timeSpent ? formatTime(attempt.timeSpent) : 'N/A';
                    
                    const subjectIcon = attempt.subject === 'math' ? '📐' : 
                                       attempt.subject === 'english' ? '📚' : 
                                       attempt.subject === 'chemistry' ? '⚗️' : 
                                       attempt.subject === 'physics' ? '⚡' : '🔬';
                    
                    const className = attempt.className || attempt.classId || 'Class';
                    const lessonName = attempt.lessonTitle || attempt.lessonId || 'Lesson';
                    
                    html += `
                        <div class="all-activity-item">
                            <div class="all-activity-item-header">
                                <span class="all-activity-item-title">
                                    ${subjectIcon} ${escapeHtml(className)} · ${escapeHtml(lessonName)}
                                </span>
                                <span class="all-activity-item-score">${attempt.score} pts</span>
                            </div>
                            <div class="all-activity-item-details">
                                <span>${attempt.questionsCorrect}/${attempt.totalQuestions} correct</span>
                                <span class="dot">•</span>
                                <span>${dateStr}</span>
                                <span class="dot">•</span>
                                <span>⏱️ ${timeStr}</span>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                        <button class="back-btn" onclick="window.renderProgress()">← Back to Progress</button>
                    </div>
                `;
                
                content.innerHTML = html;
                updateBottomNav('progress');
                
            })
            .catch(error => {
                console.error('Error loading all activity:', error);
                content.innerHTML = `
                    <div class="error-message">Failed to load activity</div>
                    <button class="back-btn" onclick="window.renderProgress()">← Back to Progress</button>
                `;
            });
    }).catch(error => {
        console.error('Firebase init error:', error);
        content.innerHTML = '<div class="error-message">Failed to initialize</div>';
    });
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make globally available
window.renderAllActivity = renderAllActivity;

export { renderAllActivity };