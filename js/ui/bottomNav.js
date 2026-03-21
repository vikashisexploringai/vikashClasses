// js/ui/bottomNav.js
// Bottom navigation bar

function updateBottomNav(activeView) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    
    // Hide nav on auth pages
    const authViews = ['login', 'register', 'forgotUsername', 'forgotPassword', 'resetPassword'];
    if (authViews.includes(activeView)) {
        nav.style.display = 'none';
        return;
    }
    
    nav.style.display = 'flex';
    nav.innerHTML = `
        <button class="nav-item ${activeView === 'classSelection' ? 'active' : ''}" onclick="window.renderClassSelection && window.renderClassSelection()">
            <span class="nav-icon">🏠</span>
            <span>Classes</span>
        </button>
        <button class="nav-item ${activeView === 'progress' ? 'active' : ''}" onclick="window.renderProgress && window.renderProgress()">
            <span class="nav-icon">📊</span>
            <span>Progress</span>
        </button>
        <button class="nav-item ${activeView === 'profile' ? 'active' : ''}" onclick="window.renderProfile && window.renderProfile()">
            <span class="nav-icon">👤</span>
            <span>Profile</span>
        </button>
        <button class="nav-item ${activeView === 'settings' ? 'active' : ''}" onclick="window.renderSettings && window.renderSettings()">
            <span class="nav-icon">⚙️</span>
            <span>Settings</span>
        </button>
    `;
}

export { updateBottomNav };