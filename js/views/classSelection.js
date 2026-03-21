// js/views/classSelection.js
// Class selection page

import { AppState, updateState } from '../core/state.js';
import { updateHeader } from '../ui/header.js';
import { updateBottomNav } from '../ui/bottomNav.js';
import { showCodeModal } from '../ui/modals.js';
import { renderSubjects } from './subjects.js';

function renderClassSelection() {
    updateState({ currentView: 'classSelection' });
    const content = document.getElementById('main-content');
    
    updateHeader('Select Your Class');
    
    if (!AppState.classConfig) {
        content.innerHTML = '<div class="loading-spinner"></div>';
        return;
    }
    
    let html = '<div class="classes-grid">';
    
    AppState.classConfig.classes.forEach(cls => {
        const requiresCode = AppState.classConfig.requireCodeForAll || cls.codeRequired;
        const badge = requiresCode ? '🔒 Code Required' : '🔓 Open Access';
        const badgeClass = requiresCode ? 'code-badge' : 'open-badge';
        
        html += `
            <div class="class-card" onclick="window.selectClass('${cls.id}')">
                <div class="class-header" style="border-left-color: ${cls.theme || '#667eea'}">
                    <span class="class-name">${cls.name}</span>
                    <span class="${badgeClass}">${badge}</span>
                </div>
                <div class="class-description">${cls.description}</div>
                <div class="class-subjects">
                    ${cls.subjects.map(s => {
                        const subject = AppState.config?.subjects.find(sub => sub.id === s);
                        return `<span class="subject-tag" style="background: ${subject?.color}20; color: ${subject?.color}">${subject?.icon} ${subject?.name}</span>`;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    updateBottomNav('classSelection');
}

function selectClass(classId) {
    console.log('🔍 selectClass called with:', classId);
    
    const classData = AppState.classConfig.classes.find(c => c.id === classId);
    console.log('📦 Class data:', classData);
    
    const requiresCode = AppState.classConfig.requireCodeForAll || classData.codeRequired;
    console.log('🔒 Requires code:', requiresCode);
    
    if (!requiresCode || !classData.code) {
        console.log('✅ No code needed, opening class');
        updateState({ currentClass: classData });
        renderSubjects();
        return;
    }
    
    // Show code modal from modals.js
    showCodeModal(classData, (verifiedClass) => {
        console.log('✅ Code verified, opening class');
        updateState({ currentClass: verifiedClass });
        renderSubjects();
    });
}

// Make globally available for onclick handlers
window.selectClass = selectClass;
window.renderClassSelection = renderClassSelection;

export { renderClassSelection, selectClass };