// js/views/lessons.js
// Lessons listing page with TEST button

import { AppState } from '../core/state.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showToast } from '../ui/toast.js';
import { loadLesson } from '../data/lessonLoader.js';
import { startQuiz } from '../quiz/quizEngine.js';

async function renderLessons() {
    const subject = AppState.config?.subjects.find(s => s.id === AppState.currentSubject);
    const content = document.getElementById('main-content');
    
    updateHeader(subject.name, true, 'renderSubjects');
    
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Fetch lesson list (in future, this could come from manifest.json)
        const lessonList = await fetchLessonList();
        
        let html = '<div class="lessons-list">';
        
        lessonList.forEach(lesson => {
            const isTest = lesson.type === 'test';
            html += `
                <div class="lesson-card ${isTest ? 'test-card' : ''}" 
                     onclick="window.selectLesson('${lesson.id}', ${isTest})">
                    <span class="lesson-name">${lesson.name}</span>
                    <span class="lesson-arrow">→</span>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading lessons:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <p>Failed to load lessons</p>
                <button onclick="window.renderSubjects()" style="margin-top: 20px; padding: 10px 20px;">Go Back</button>
            </div>
        `;
    }
    
    updateBottomNav('subjects');
}

async function fetchLessonList() {
    // For now, return hardcoded list
    // In future, this can read from manifest.json
    return [
        { id: 'lesson1', name: 'Lesson 1', type: 'regular' },
        { id: 'lesson2', name: 'Lesson 2', type: 'regular' },
        { id: 'lesson3', name: 'Lesson 3', type: 'regular' },
        { id: 'test', name: '📝 TEST', type: 'test' }
    ];
}

async function selectLesson(lessonId, isTest = false) {
    if (isTest) {
        showToast('Test coming soon!', 'info');
        return;
    }
    
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const lessonData = await loadLesson(
            AppState.currentClass.id,
            AppState.currentSubject,
            lessonId
        );
        
        startQuiz(lessonData);
        
    } catch (error) {
        console.error('Error loading lesson:', error);
        showToast('Failed to load lesson', 'error');
        renderLessons();
    }
}

// Make globally available
window.selectLesson = selectLesson;
window.renderLessons = renderLessons;

export { renderLessons, selectLesson };