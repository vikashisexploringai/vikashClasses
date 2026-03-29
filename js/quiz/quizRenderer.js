// js/quiz/quizRenderer.js
// Quiz UI rendering functions

function renderQuizQuestion(quizData, formatter, onAnswerCallback, onExitCallback) {
    const content = document.getElementById('main-content');
    const currentQuestion = quizData.questions[quizData.currentQuestion];
    
    const formattedQuestion = formatter.formatQuestion(
        currentQuestion.question,
        currentQuestion.format
    );
    
    const formattedOptions = formatter.formatOptions(
        currentQuestion.options,
        currentQuestion.format
    );
    
    const html = `
        <div class="quiz-header-blue">
            <div class="quiz-header-left">
                <button class="quiz-back-btn-white" onclick="(${onExitCallback.toString()})()">‹</button>
                <span class="quiz-subchapter-name">${escapeHtml(quizData.title)}</span>
            </div>
            <div class="quiz-level-blue">Lesson</div>
        </div>

        <div class="quiz-header-white">
            <div class="quiz-progress-white">${quizData.currentQuestion + 1}/${quizData.questions.length}</div>
            <div class="quiz-score-header" id="quizScoreHeader">${quizData.score}</div>
            <div class="quiz-timer-row">
                <div class="circular-timer" id="circularTimer">
                    <svg width="36" height="36" viewBox="0 0 40 40">
                        <circle class="timer-circle-bg" cx="20" cy="20" r="16"></circle>
                        <circle class="timer-circle-progress" id="timerCircleProgress" cx="20" cy="20" r="16" stroke-dasharray="100.53" stroke-dashoffset="0"></circle>
                    </svg>
                    <div class="timer-circle-text" id="timerText">${quizData.timePerQuestion}</div>
                </div>
            </div>
        </div>

        <div class="quiz-question" id="quizQuestion">${formattedQuestion}</div>

        <div class="quiz-options-large" id="quizOptions">
            ${renderOptions(formattedOptions, onAnswerCallback)}
        </div>
    `;
    
    content.innerHTML = html;
}

function renderOptions(options, onAnswerCallback) {
    return options.map(opt => `
        <button class="quiz-option-large" onclick="window.checkAnswer && window.checkAnswer('${escapeHtml(opt.value).replace(/'/g, "\\'")}', this)">
            ${opt.display}
        </button>
    `).join('');
}

function renderQuizComplete(quizData, onExitCallback, onRestartCallback) {
    const content = document.getElementById('main-content');
    
    const html = `
        <div class="quiz-complete">
            <div class="completion-icon">🏆</div>
            <div class="score-display">${quizData.score}</div>
            <div class="questions-correct">${quizData.currentQuestion + 1}/${quizData.questions.length}</div>
            <div class="button-row">
                <button class="try-again-btn" onclick="window.restartQuiz()">Try Again</button>
                <button class="next-level-btn" onclick="window.exitQuiz()">Done</button>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function clearQuizUI() {
    const content = document.getElementById('main-content');
    if (content) {
        content.innerHTML = '<div class="loading-spinner"></div>';
    }
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available for HTML onclick handlers
window.clearQuizUI = clearQuizUI;

export { renderQuizQuestion, renderQuizComplete, clearQuizUI };