// js/views/lessons.js
// Lessons listing page with TEST button

import { AppState, updateState } from '../core/state.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { startQuiz } from '../quiz/quizEngine.js';
import { getAuth, getDb, initFirebase } from '../firebase/firebaseInit.js';

let currentSubjectId = null;
let currentClassId = null;
let currentStudentId = null;

async function renderLessons() {
    const subject = AppState.config?.subjects.find(s => s.id === AppState.currentSubject);
    const content = document.getElementById('main-content');
    
    updateHeader(subject.name, true, 'renderSubjects');
    
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    await initFirebase();
    const auth = getAuth();
    const user = auth?.currentUser;
    
    if (!user) {
        showToast('Please login', 'error');
        return;
    }
    
    currentStudentId = user.uid;
    currentSubjectId = AppState.currentSubject;
    currentClassId = AppState.currentClass?.id;
    
    const db = getDb();
    
    try {
        // Get all lessons for this subject and class
        const lessonsRef = db.collection('lessons');
        const lessonsQuery = await lessonsRef
            .where('subjectId', '==', currentSubjectId)
            .where('classId', '==', currentClassId)
            .get();
        
        if (lessonsQuery.empty) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p>No lessons available yet.</p>
                    <button class="back-button" onclick="window.renderSubjects()">← Back to Subjects</button>
                </div>
            `;
            updateBottomNav('subjects');
            return;
        }
        
        // Get all lesson IDs
        const lessons = [];
        lessonsQuery.forEach(doc => {
            lessons.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Get student's attempts for these lessons
        const lessonIds = lessons.map(l => l.id);
        
        // Get attempts
        let attempts = [];
        if (lessonIds.length > 0) {
            const attemptsSnapshot = await db.collection('attempts')
                .where('userId', '==', currentStudentId)
                .get();
            
            attempts = attemptsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(attempt => lessonIds.includes(attempt.lessonId));
        }
        
        // Calculate stats for each lesson
        const lessonsWithStats = lessons.map(lesson => {
            const lessonAttempts = attempts.filter(a => a.lessonId === lesson.id);
            const bestAttempt = lessonAttempts.reduce((best, a) => 
                (a.score > (best?.score || 0)) ? a : best, null);
            const lastAttempt = lessonAttempts.sort((a, b) => 
                (b.completedAt?.toDate?.() || 0) - (a.completedAt?.toDate?.() || 0)
            )[0];
            
            return {
                ...lesson,
                bestScore: bestAttempt ? Math.round((bestAttempt.score / bestAttempt.maxPossible) * 100) : null,
                lastScore: lastAttempt ? Math.round((lastAttempt.score / lastAttempt.maxPossible) * 100) : null,
                lastAttemptDate: lastAttempt?.completedAt?.toDate() || null,
                attemptCount: lessonAttempts.length
            };
        });
        
        // Render lessons
        renderLessonsList(lessonsWithStats);
        
    } catch (error) {
        console.error('Error loading lessons:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <p>Failed to load lessons</p>
                <button class="back-button" onclick="window.renderSubjects()">← Back to Subjects</button>
            </div>
        `;
    }
    
    updateBottomNav('subjects');
}

function renderLessonsList(lessons) {
    const content = document.getElementById('main-content');
    
    let lessonsHtml = '';
    
    for (const lesson of lessons) {
        const questionCount = lesson.questions?.length || 0;
        const bestScore = lesson.bestScore;
        const lastScore = lesson.lastScore;
        const lastDate = lesson.lastAttemptDate;
        
        let statsHtml = `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">📊 ${questionCount} questions`;
        
        if (lastScore !== null) {
            statsHtml += ` · Last: ${lastScore}%`;
            if (lastDate) {
                statsHtml += ` (${formatDate(lastDate)})`;
            }
        }
        if (bestScore !== null && bestScore !== lastScore) {
            statsHtml += ` · Best: ${bestScore}%`;
        }
        statsHtml += `</div>`;
        
        lessonsHtml += `
            <div class="lesson-card" onclick="window.startLesson('${lesson.id}')">
                <div class="lesson-info">
                    <div class="lesson-name">📖 ${escapeHtml(lesson.title)}</div>
                    <div class="lesson-description">${escapeHtml(lesson.description || 'No description')}</div>
                    ${statsHtml}
                </div>
                <button class="start-quiz-btn" onclick="event.stopPropagation(); window.startLesson('${lesson.id}')">Start Quiz →</button>
            </div>
        `;
    }
    
    // Add TEST card at the end
    lessonsHtml += `
        <div class="lesson-card test-card" onclick="window.startTest()">
            <div class="lesson-info">
                <div class="lesson-name">📝 TEST</div>
                <div class="lesson-description">Mixed questions from all lessons in this subject</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">🎲 Randomly selected questions</div>
            </div>
            <button class="start-quiz-btn test-btn" onclick="event.stopPropagation(); window.startTest()">Start Test →</button>
        </div>
    `;
    
    const html = `
        <div class="lessons-container">
            <div class="lessons-list">
                ${lessonsHtml}
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function formatDate(date) {
    if (!date) return '';
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// Start a specific lesson
async function startLesson(lessonId) {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    const db = getDb();
    
    try {
        const lessonDoc = await db.collection('lessons').doc(lessonId).get();
        
        if (!lessonDoc.exists) {
            showToast('Lesson not found', 'error');
            renderLessons();
            return;
        }
        
        const lessonData = lessonDoc.data();
        lessonData.id = lessonDoc.id;
        
        // Format lesson data for quiz engine
        const quizData = {
            title: lessonData.title,
            description: lessonData.description,
            questions: lessonData.questions || [],
            maxPointsPerQuestion: 100,
            timePerQuestion: 30,
            lessonId: lessonData.id
        };
        
        startQuiz(quizData);
        
    } catch (error) {
        console.error('Error loading lesson:', error);
        showToast('Failed to load lesson', 'error');
        renderLessons();
    }
}

// Start test (random questions from all lessons)
async function startTest() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    const db = getDb();
    const TEST_QUESTION_COUNT = 20;
    
    try {
        // Get all lessons for this subject
        const lessonsSnapshot = await db.collection('lessons')
            .where('subjectId', '==', currentSubjectId)
            .where('classId', '==', currentClassId)
            .get();
        
        if (lessonsSnapshot.empty) {
            showToast('No lessons available for test', 'error');
            renderLessons();
            return;
        }
        
        // Collect all questions from all lessons
        let allQuestions = [];
        lessonsSnapshot.forEach(doc => {
            const lesson = doc.data();
            if (lesson.questions && lesson.questions.length > 0) {
                allQuestions = [...allQuestions, ...lesson.questions];
            }
        });
        
        if (allQuestions.length === 0) {
            showToast('No questions available for test', 'error');
            renderLessons();
            return;
        }
        
        // Randomly select questions
        const shuffled = [...allQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        const selectedQuestions = shuffled.slice(0, Math.min(TEST_QUESTION_COUNT, shuffled.length));
        
        // Format test data
        const testData = {
            title: `${AppState.config?.subjects.find(s => s.id === currentSubjectId)?.name} - Test`,
            description: `Random ${selectedQuestions.length} questions from all lessons`,
            questions: selectedQuestions,
            maxPointsPerQuestion: 100,
            timePerQuestion: 30,
            lessonId: 'test',
            isTest: true
        };
        
        startQuiz(testData);
        
    } catch (error) {
        console.error('Error starting test:', error);
        showToast('Failed to start test', 'error');
        renderLessons();
    }
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available on window
window.startLesson = startLesson;
window.startTest = startTest;
window.renderLessons = renderLessons;

export { renderLessons, startLesson, startTest };