// app.js - Main application controller

// ===== APP STATE =====
const AppState = {
    currentUser: null,
    currentView: 'login',
    currentClass: null,
    currentSubject: null,
    currentLesson: null,
    config: null,
    classConfig: null,
    progress: {}
};

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyACO39eJRrdbgowWcqgdp0DFkDPUhbQQfQ",
    authDomain: "database-367af.firebaseapp.com",
    projectId: "database-367af",
    storageBucket: "database-367af.firebasestorage.app",
    messagingSenderId: "246204653332",
    appId: "1:246204653332:web:8daf25ea24112de940ec01"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    await loadClassConfig();
    initDarkMode();
    renderLogin();
});

// ===== LOAD CONFIGURATIONS =====
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        AppState.config = await response.json();
        console.log('Config loaded:', AppState.config);
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

async function loadClassConfig() {
    try {
        const response = await fetch('class-config.json');
        AppState.classConfig = await response.json();
        console.log('Class config loaded:', AppState.classConfig);
    } catch (error) {
        console.error('Failed to load class config:', error);
    }
}

// ===== AUTH STATE OBSERVER =====
auth.onAuthStateChanged(async (user) => {
    if (user) {
        AppState.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
        
        await loadUserProgress(user.uid);
        
        if (['login', 'register'].includes(AppState.currentView)) {
            renderClassSelection();
        }
    } else {
        AppState.currentUser = null;
        if (!['login', 'register'].includes(AppState.currentView)) {
            renderLogin();
        }
    }
});

// ===== CLASS SELECTION PAGE =====
function renderClassSelection() {
    AppState.currentView = 'classSelection';
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
            <div class="class-card" onclick="selectClass('${cls.id}')">
                <div class="class-header" style="border-left-color: ${cls.theme}">
                    <span class="class-name">${cls.name}</span>
                    <span class="${badgeClass}">${badge}</span>
                </div>
                <div class="class-description">${cls.description}</div>
                <div class="class-subjects">
                    ${cls.subjects.map(s => {
                        const subject = AppState.config.subjects.find(sub => sub.id === s);
                        return `<span class="subject-tag" style="background: ${subject?.color}20; color: ${subject?.color}">${subject?.icon} ${subject?.name}</span>`;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    updateBottomNav('home');
}

// ===== SELECT CLASS (WITH CODE VERIFICATION) =====
async function selectClass(classId) {
    const classData = AppState.classConfig.classes.find(c => c.id === classId);
    const requiresCode = AppState.classConfig.requireCodeForAll || classData.codeRequired;
    
    if (!requiresCode || !classData.code) {
        // No code needed - direct access
        AppState.currentClass = classData;
        renderSubjects();
        return;
    }
    
    // Show code entry modal
    showCodeModal(classData);
}

// ===== CODE ENTRY MODAL =====
function showCodeModal(classData) {
    const modalHtml = `
        <div class="modal-overlay" id="codeModal">
            <div class="modal-content">
                <div class="modal-icon">🔒</div>
                <h3 class="modal-title">Enter Class Code</h3>
                <p class="modal-subtitle">${classData.name}</p>
                <input type="text" id="classCode" class="modal-input" placeholder="Enter code" autofocus>
                <div class="modal-error" id="codeError"></div>
                <div class="modal-buttons">
                    <button class="modal-cancel" onclick="closeModal()">Cancel</button>
                    <button class="modal-submit" onclick="verifyCode('${classData.id}')">Submit</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('codeModal');
    if (modal) modal.remove();
}

function verifyCode(classId) {
    const enteredCode = document.getElementById('classCode').value;
    const classData = AppState.classConfig.classes.find(c => c.id === classId);
    const errorEl = document.getElementById('codeError');
    
    if (enteredCode === classData.code) {
        AppState.currentClass = classData;
        closeModal();
        renderSubjects();
    } else {
        errorEl.textContent = 'Incorrect code. Please try again.';
    }
}

// ===== SUBJECTS PAGE =====
function renderSubjects() {
    AppState.currentView = 'subjects';
    const content = document.getElementById('main-content');
    
    updateHeader(AppState.currentClass.name, true, 'renderClassSelection()');
    
    let html = '<div class="subjects-grid">';
    
    AppState.currentClass.subjects.forEach(subjectId => {
        const subject = AppState.config.subjects.find(s => s.id === subjectId);
        html += `
            <div class="subject-card" onclick="renderLessons('${subject.id}')" style="border-top-color: ${subject.color}">
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
    updateBottomNav('home');
}

// ===== LESSONS PAGE (with TEST at the end) =====
async function renderLessons(subjectId) {
    AppState.currentView = 'lessons';
    AppState.currentSubject = subjectId;
    
    const subject = AppState.config.subjects.find(s => s.id === subjectId);
    const content = document.getElementById('main-content');
    
    updateHeader(subject.name, true, 'renderSubjects()');
    
    // In a real implementation, you'd fetch lesson list from data directory
    // For now, we'll use placeholder lessons
    const lessons = [
        { id: 'lesson1', name: 'Lesson 1', type: 'regular' },
        { id: 'lesson2', name: 'Lesson 2', type: 'regular' },
        { id: 'lesson3', name: 'Lesson 3', type: 'regular' },
        { id: 'lesson4', name: 'Lesson 4', type: 'regular' },
        { id: 'test', name: '📝 TEST', type: 'test' }
    ];
    
    let html = '<div class="lessons-list">';
    
    lessons.forEach(lesson => {
        const isTest = lesson.type === 'test';
        html += `
            <div class="lesson-card ${isTest ? 'test-card' : ''}" 
                 onclick="${isTest ? 'renderTest()' : `renderQuiz('${lesson.id}')`}">
                <span class="lesson-name">${lesson.name}</span>
                <span class="lesson-arrow">→</span>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    updateBottomNav('subjects');
}

// ===== PLACEHOLDER FUNCTIONS =====
function renderQuiz(lessonId) {
    showToast('Quiz coming soon!', 'info');
}

function renderTest() {
    showToast('Test coming soon!', 'info');
}

// ===== HELPER FUNCTIONS (copied from your original app.js) =====
function updateHeader(title, showBackButton = false, backFunction = null) {
    const header = document.getElementById('app-header');
    if (!header) return;
    
    if (showBackButton) {
        header.innerHTML = `
            <div class="centered-header">
                <button class="header-back-btn" onclick="${backFunction}">‹</button>
                <span class="header-title">${title}</span>
                <div class="header-placeholder"></div>
            </div>
        `;
    } else {
        header.innerHTML = `<h1>${title}</h1>`;
    }
}

function updateBottomNav(activeView) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    
    if (['login', 'register'].includes(activeView)) {
        nav.style.display = 'none';
        return;
    }
    
    nav.style.display = 'flex';
    nav.innerHTML = `
        <button class="nav-item ${activeView === 'home' ? 'active' : ''}" onclick="renderClassSelection()">
            <span class="nav-icon">🏠</span>
            <span>Classes</span>
        </button>
        <button class="nav-item ${activeView === 'progress' ? 'active' : ''}" onclick="renderProgress()">
            <span class="nav-icon">📊</span>
            <span>Progress</span>
        </button>
        <button class="nav-item ${activeView === 'profile' ? 'active' : ''}" onclick="renderProfile()">
            <span class="nav-icon">👤</span>
            <span>Profile</span>
        </button>
    `;
}

function showToast(message, type = 'info') {
    // Simplified toast - you can copy the full function from your original app.js
    alert(message);
}

async function loadUserProgress(uid) {
    // Simplified - will expand later
    console.log('Loading progress for:', uid);
}

function renderLogin() {
    // Placeholder - copy from your original app.js
    document.getElementById('main-content').innerHTML = '<div>Login Page (copy from original)</div>';
}

function renderProgress() {
    showToast('Progress coming soon!', 'info');
}

function renderProfile() {
    showToast('Profile coming soon!', 'info');
}

function initDarkMode() {
    // Copy from original
}

// Make functions globally available
window.selectClass = selectClass;
window.verifyCode = verifyCode;
window.closeModal = closeModal;
window.renderLessons = renderLessons;
window.renderQuiz = renderQuiz;
window.renderTest = renderTest;
window.renderClassSelection = renderClassSelection;
