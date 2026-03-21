// js/core/config.js
// Load app configurations

import { AppState, updateState } from './state.js';

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        updateState({ config });
        console.log('Config loaded:', config);
        return config;
    } catch (error) {
        console.error('Failed to load config:', error);
        showConfigError('Failed to load app configuration');
        return null;
    }
}

async function loadClassConfig() {
    try {
        const response = await fetch('class-config.json');
        const classConfig = await response.json();
        updateState({ classConfig });
        console.log('Class config loaded:', classConfig);
        return classConfig;
    } catch (error) {
        console.error('Failed to load class config:', error);
        showConfigError('Failed to load class configuration');
        return null;
    }
}

function showConfigError(message) {
    const content = document.getElementById('main-content');
    if (content) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">Retry</button>
            </div>
        `;
    }
}

export { loadConfig, loadClassConfig };