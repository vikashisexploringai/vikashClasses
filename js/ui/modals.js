// js/ui/modals.js
// Modal dialogs and inline messages

// ===== INLINE MESSAGES =====
function showInlineMessage(inputId, message, type = 'error') {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const existingMessage = input.parentElement.querySelector('.inline-message');
    if (existingMessage) existingMessage.remove();
    
    input.classList.add('input-error');
    
    const messageEl = document.createElement('div');
    messageEl.className = `inline-message inline-${type}`;
    messageEl.textContent = message;
    
    input.parentElement.appendChild(messageEl);
    
    input.addEventListener('input', function clearError() {
        input.classList.remove('input-error');
        if (messageEl.parentElement) messageEl.remove();
        input.removeEventListener('input', clearError);
    }, { once: true });
}

function clearInlineMessages() {
    document.querySelectorAll('.inline-message').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// ===== CODE ENTRY MODAL =====
function showCodeModal(classData, onSuccess) {
    console.log('📱 Showing code modal for:', classData.name);
    
    const modalHtml = `
        <div class="modal-overlay" id="codeModal">
            <div class="modal-content">
                <div class="modal-icon">🔒</div>
                <h3 class="modal-title">Enter Class Code</h3>
                <p class="modal-subtitle">${escapeHtml(classData.name)}</p>
                <input type="text" id="classCodeInput" class="modal-input" placeholder="Enter code" autofocus>
                <div class="modal-error" id="codeErrorMsg"></div>
                <div class="modal-buttons">
                    <button class="modal-cancel" id="modalCancelBtn">Cancel</button>
                    <button class="modal-submit" id="modalSubmitBtn">Submit</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('codeModal');
    const codeInput = document.getElementById('classCodeInput');
    const errorMsg = document.getElementById('codeErrorMsg');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const submitBtn = document.getElementById('modalSubmitBtn');
    
    codeInput.focus();
    
    cancelBtn.onclick = () => {
        console.log('❌ Cancelled code entry');
        modal.remove();
    };
    
    submitBtn.onclick = () => {
        const enteredCode = codeInput.value.trim();
        console.log('📝 Entered code:', enteredCode);
        console.log('🔑 Expected code:', classData.code);
        
        if (enteredCode === classData.code) {
            console.log('✅ Code correct!');
            modal.remove();
            onSuccess(classData);
        } else {
            console.log('❌ Code incorrect');
            errorMsg.textContent = 'Incorrect code. Please try again.';
            codeInput.value = '';
            codeInput.focus();
        }
    };
    
    codeInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitBtn.click();
    }
};

}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { showInlineMessage, clearInlineMessages, showCodeModal };