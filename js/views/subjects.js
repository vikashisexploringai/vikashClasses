// js/views/subjects.js
// Subjects listing page

import { AppState } from '../core/state.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { renderLessons } from './lessons.js';

function renderSubjects() {
    console.log('renderSubjects called');
    console.log('AppState.currentClass:', AppState.currentClass);   
    const content = document.getElementById('main-content');
    
    updateHeader(AppState.currentClass.name, true, 'renderClassSelection');
    
    let html = '<div class="subjects-grid">';
    
    AppState.currentClass.subjects.forEach(subjectId => {
        const subject = AppState.config?.subjects.find(s => s.id === subjectId);
        if (!subject) return;
        
        html += `
            <div class="subject-card ${subject.id}" onclick="window.selectSubject('${subject.id}')">
                <div class="subject-header">
                    <span class="subject-icon">${subject.icon}</span>
                    <span class="subject-title">${subject.name}</span>
                </div>
                <div class="subject-description">${subject.description}</div>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    updateBottomNav('subjects');
}

function selectSubject(subjectId) {
    AppState.currentSubject = subjectId;
    renderLessons();
}

// Make globally available
window.selectSubject = selectSubject;
window.renderSubjects = renderSubjects;

export { renderSubjects, selectSubject };