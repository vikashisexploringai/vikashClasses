// js/quiz/quizEngine.js
// Core quiz engine - timer, scoring, navigation

import { showToast } from '../ui/toast.js';
import { getDb } from '../firebase/firebaseInit.js';
import { AppState } from '../core/state.js';
import { shuffleArray } from '../core/utils.js';
import { renderQuizQuestion, renderQuizComplete, clearQuizUI } from './quizRenderer.js';

// Make variables globally accessible for HTML onclick handlers
window.currentQuizData = null;
window.questionTimer = null;
window.timeRemaining = 0;
window.questionStartTime = 0;
window.quizStartTime = 0;

let currentFormatter = null;

async function startQuiz(lessonData) {
    window.quizStartTime = Date.now();
    
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'none';
    
    // Initialize quiz data
    window.currentQuizData = {
        ...lessonData,
        currentQuestion: 0,
        score: 0,
        timePerQuestion: 30,
        maxPointsPerQuestion: 100,
        questions: lessonData.questions || []
    };
    
    // Load formatter for first question
    const firstQuestion = window.currentQuizData.questions[0];
    const formatterModule = await loadFormatterForQuestion(firstQuestion);
    currentFormatter = formatterModule;
    
    renderQuizQuestion(window.currentQuizData, currentFormatter, checkAnswer, exitQuiz);
    startCircularTimer();
}

async function loadFormatterForQuestion(question) {
    const format = question.format || 'text';
    
    try {
        if (format === 'fraction' || format === 'surds' || format === 'mixed' || format === 'percentage') {
            const module = await import('../formatters/mathFormatter.js');
            return module.default;
        } else if (format === 'chemistry') {
            const module = await import('../formatters/chemistryFormatter.js');
            return module.default;
        } else {
            const module = await import('../formatters/defaultFormatter.js');
            return module.default;
        }
    } catch (error) {
        console.warn('Error loading formatter, using default', error);
        const module = await import('../formatters/defaultFormatter.js');
        return module.default;
    }
}

window.checkAnswer = async function(selectedOption, buttonElement) {
    if (!window.currentQuizData) return;
    
    if (window.questionTimer) clearInterval(window.questionTimer);
    
    const timeTaken = (Date.now() - window.questionStartTime) / 1000;
    const question = window.currentQuizData.questions[window.currentQuizData.currentQuestion];
    const isCorrect = (selectedOption === question.correct);
    
    if (isCorrect) {
        const pointsEarned = calculatePoints(timeTaken);
        buttonElement.classList.add('correct');
        window.currentQuizData.score += pointsEarned;
    } else {
        buttonElement.classList.add('wrong');
        highlightCorrectAnswer(question.correct);
    }
    
    updateScoreDisplay();
    disableAllButtons();
    
    setTimeout(() => moveToNextQuestion(), 500);
};

function calculatePoints(timeTaken) {
    const maxPoints = window.currentQuizData.maxPointsPerQuestion || 100;
    const timeLimit = window.currentQuizData.timePerQuestion || 30;
    
    let points = maxPoints * (1 - (timeTaken / timeLimit) * 0.5);
    points = Math.round(points);
    const minPoints = Math.round(maxPoints * 0.1);
    
    return Math.max(minPoints, points);
}

async function moveToNextQuestion() {
    if (!window.currentQuizData) return;
    
    if (window.questionTimer) clearInterval(window.questionTimer);
    
    if (window.currentQuizData.currentQuestion + 1 < window.currentQuizData.questions.length) {
        window.currentQuizData.currentQuestion++;
        
        // Load formatter for next question
        const nextQuestion = window.currentQuizData.questions[window.currentQuizData.currentQuestion];
        const formatterModule = await loadFormatterForQuestion(nextQuestion);
        currentFormatter = formatterModule;
        
        renderQuizQuestion(window.currentQuizData, currentFormatter, checkAnswer, exitQuiz);
        startCircularTimer();
    } else {
        showQuizComplete();
    }
}

function updateScoreDisplay() {
    const scoreHeaderEl = document.getElementById('quizScoreHeader');
    if (scoreHeaderEl && window.currentQuizData) {
        scoreHeaderEl.textContent = window.currentQuizData.score;
    }
}

function disableAllButtons() {
    document.querySelectorAll('.quiz-option-large').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
    });
}

function highlightCorrectAnswer(correctAnswer) {
    document.querySelectorAll('.quiz-option-large').forEach(btn => {
        if (btn.textContent.trim() === correctAnswer) {
            btn.classList.add('correct');
        }
    });
}

function startCircularTimer() {
    if (!window.currentQuizData) return;
    
    if (window.questionTimer) clearInterval(window.questionTimer);
    
    window.timeRemaining = window.currentQuizData.timePerQuestion || 30;
    window.questionStartTime = Date.now();
    
    const timerText = document.getElementById('timerText');
    const timerCircle = document.getElementById('timerCircleProgress');
    const totalTime = window.currentQuizData.timePerQuestion || 30;
    
    if (!timerText || !timerCircle) return;
    
    const circumference = 2 * Math.PI * 16;
    timerCircle.style.strokeDasharray = circumference;
    timerCircle.style.strokeDashoffset = '0';
    
    window.questionTimer = setInterval(() => {
        if (!window.currentQuizData) {
            clearInterval(window.questionTimer);
            return;
        }
        
        window.timeRemaining -= 0.1;
        
        if (window.timeRemaining <= 0) {
            clearInterval(window.questionTimer);
            timerText.textContent = '0';
            timerCircle.style.stroke = '#ef4444';
            handleTimeOut();
            return;
        }
        
        timerText.textContent = Math.ceil(window.timeRemaining);
        
        const progress = window.timeRemaining / totalTime;
        const dashOffset = circumference * (1 - progress);
        timerCircle.style.strokeDashoffset = dashOffset;
        
        if (progress < 0.25) {
            timerCircle.style.stroke = '#ef4444';
        } else if (progress < 0.5) {
            timerCircle.style.stroke = '#f59e0b';
        } else {
            timerCircle.style.stroke = '#3b82f6';
        }
        
    }, 100);
}

function handleTimeOut() {
    disableAllButtons();
    setTimeout(() => moveToNextQuestion(), 500);
}

function showQuizComplete() {
    if (!window.currentQuizData) return;
    
    if (window.questionTimer) clearInterval(window.questionTimer);
    
    saveQuizProgress();
    
    renderQuizComplete(window.currentQuizData, exitQuiz, () => {
        window.currentQuizData.currentQuestion = 0;
        window.currentQuizData.score = 0;
        startQuiz(window.currentQuizData);
    });
}

async function saveQuizProgress() {
    if (!window.currentQuizData || !AppState.currentUser) {
        console.log('No quiz data or user, skipping save');
        return;
    }
    
    const user = AppState.currentUser;
    const totalQuestions = window.currentQuizData.questions.length;
    const maxPossible = totalQuestions * (window.currentQuizData.maxPointsPerQuestion || 100);
    const accuracy = Math.round((window.currentQuizData.score / maxPossible) * 100);
    const questionsCorrect = Math.round(window.currentQuizData.score / (maxPossible / totalQuestions));
    const totalTimeSpent = Math.round((Date.now() - window.quizStartTime) / 1000);
    
    try {
        const { getDb } = await import('../firebase/firebaseInit.js');
        const db = getDb();
        
        if (!db) {
            console.error('Database not initialized');
            return;
        }
        
        const attemptData = {
            userId: user.uid,
            username: user.displayName || 'user',
            displayName: user.displayName || 'User',
            classId: AppState.currentClass?.id,
            className: AppState.currentClass?.name,
            subject: AppState.currentSubject,
            lessonId: window.currentQuizData.lessonId,
            lessonTitle: window.currentQuizData.title,
            score: window.currentQuizData.score,
            maxPossible: maxPossible,
            accuracy: accuracy,
            questionsCorrect: questionsCorrect,
            totalQuestions: totalQuestions,
            timeSpent: totalTimeSpent,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('attempts').add(attemptData);
        
        // Update user overall stats
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const overall = userData.overall || { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 };
            
            overall.totalPoints = (overall.totalPoints || 0) + window.currentQuizData.score;
            overall.quizzesTaken = (overall.quizzesTaken || 0) + 1;
            overall.totalTimeSpent = (overall.totalTimeSpent || 0) + totalTimeSpent;
            
            await userRef.update({ overall });
        }
        
        console.log('✅ Quiz progress saved');
        
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

window.exitQuiz = function() {
    if (window.questionTimer) clearInterval(window.questionTimer);
    
    const appHeader = document.getElementById('app-header');
    if (appHeader) appHeader.style.display = 'flex';
    
    clearQuizUI();
    
    // Navigate back to lessons
    import('../views/lessons.js').then(module => {
        module.renderLessons();
    });
};

export { startQuiz, checkAnswer, exitQuiz };