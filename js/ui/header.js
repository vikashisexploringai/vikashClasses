// js/ui/header.js
// Header rendering with back button

function updateHeader(title, showBackButton = false, backFunction = null) {
    const header = document.getElementById('app-header');
    if (!header) return;
    
    if (showBackButton && backFunction) {
        header.innerHTML = `
            <div class="centered-header">
                <button class="header-back-btn" onclick="${backFunction}()">‹</button>
                <span class="header-title">${escapeHeaderText(title)}</span>
                <div class="header-placeholder"></div>
            </div>
        `;
    } else {
        header.innerHTML = `<h1>${escapeHeaderText(title)}</h1>`;
    }
}

function escapeHeaderText(text) {
    // Simple escape to prevent XSS
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { updateHeader };