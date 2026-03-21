// js/app.js
// Main entry point - bootstraps the application

import { initFirebase, isInitialized } from './firebase/firebaseInit.js';
import { setupAuthListener } from './auth/auth.js';
import { loadConfig, loadClassConfig } from './core/config.js';
import { renderLogin } from './auth/login.js';
import { renderRegister, handleRegister } from './auth/register.js';
import { handleLogout } from './auth/logout.js';
import { 
    renderForgotUsername, 
    handleFindUsername, 
    renderForgotPassword, 
    handleVerifyIdentity, 
    handleCloudPasswordReset 
} from './auth/password.js';
import { renderClassSelection, selectClass } from './views/classSelection.js';
import { renderSubjects, selectSubject } from './views/subjects.js';
import { renderLessons, selectLesson } from './views/lessons.js';
import { renderProfile } from './views/profile.js';
import { renderProgress } from './views/progress.js';
import { renderSettings, setDarkMode, initDarkMode, renderChangePassword, handleChangePassword, confirmDeleteAccount, deleteAccount } from './views/settings.js';
import { checkAnswer, exitQuiz } from './quiz/quizEngine.js';

// Make functions globally available for inline onclick handlers
window.renderLogin = renderLogin;
window.renderRegister = renderRegister;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.renderForgotUsername = renderForgotUsername;
window.handleFindUsername = handleFindUsername;
window.renderForgotPassword = renderForgotPassword;
window.handleVerifyIdentity = handleVerifyIdentity;
window.handleCloudPasswordReset = handleCloudPasswordReset;
window.renderClassSelection = renderClassSelection;
window.selectClass = selectClass;
window.renderSubjects = renderSubjects;
window.selectSubject = selectSubject;
window.renderLessons = renderLessons;
window.selectLesson = selectLesson;
window.renderProfile = renderProfile;
window.renderProgress = renderProgress;
window.renderSettings = renderSettings;
window.setDarkMode = setDarkMode;
window.renderChangePassword = renderChangePassword;
window.handleChangePassword = handleChangePassword;
window.confirmDeleteAccount = confirmDeleteAccount;
window.deleteAccount = deleteAccount;
window.checkAnswer = checkAnswer;
window.exitQuiz = exitQuiz;

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 vikashClasses starting...');
    
    // Initialize Firebase first (wait for it to complete)
    await initFirebase();
    
    console.log('Firebase ready, isInitialized:', isInitialized());
    
    // Load configurations
    await loadConfig();
    await loadClassConfig();
    
    // Initialize dark mode
    initDarkMode();
    
    // Set up auth state listener
    setupAuthListener();
    
    // Initial render
    renderLogin();
    
    console.log('✅ vikashClasses ready');
});