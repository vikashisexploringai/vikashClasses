// js/core/state.js
// Centralized app state management

const AppState = {
    // User
    currentUser: null,
    
    // Navigation
    currentView: 'login',
    
    // Class & Learning
    currentClass: null,
    currentSubject: null,
    currentLesson: null,
    
    // Configurations
    config: null,
    classConfig: null,
    
    // Progress
    progress: {},
    
    // Quiz (will be expanded later)
    quizData: null
};

// Helper to update state and optionally trigger actions
function updateState(newState) {
    Object.assign(AppState, newState);
    console.log('AppState updated:', AppState);
    
    // You can add event listeners here later if needed
}

// Helper to reset state on logout
function resetState() {
    AppState.currentUser = null;
    AppState.currentClass = null;
    AppState.currentSubject = null;
    AppState.currentLesson = null;
    AppState.currentView = 'login';
    AppState.quizData = null;
}

export { AppState, updateState, resetState };