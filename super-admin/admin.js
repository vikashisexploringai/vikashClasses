// super-admin/admin.js
// Main entry point for Super Admin

import { initSuperAdmin, getCurrentAdmin, logout } from './modules/auth.js';
import { loadTeachers, addTeacher, generateNewTeacherCode, removeTeacher } from './modules/teachers.js';
import { loadClasses, createClass, deleteClass } from './modules/classes.js';

let currentTab = 'teachers';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initSuperAdmin(handleAuthState);
});

function handleAuthState(state, user) {
    const userInfoDiv = document.getElementById('userInfo');
    const authSection = document.getElementById('authSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (state === 'authenticated') {
        userInfoDiv.innerHTML = `
            <span>👑 ${user.displayName || user.email}</span>
            <button onclick="window.adminLogout()" class="btn-secondary" style="margin-left: 12px;">Logout</button>
        `;
        authSection.style.display = 'none';
        adminPanel.style.display = 'block';
        setupTabs();
        loadTeachers();
        loadClasses();
    } else if (state === 'unauthorized') {
        userInfoDiv.innerHTML = `
            <span>⚠️ ${user?.email || 'Unknown'}</span>
            <button onclick="window.adminLogout()" class="btn-secondary" style="margin-left: 12px;">Logout</button>
        `;
        authSection.innerHTML = `
            <div class="error">⚠️ You are not authorized as Super Admin.</div>
            <button id="googleLoginBtn" class="btn-primary">Sign in with Google</button>
        `;
        document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
            const { signInWithGoogle } = await import('./modules/auth.js');
            await signInWithGoogle();
        });
        adminPanel.style.display = 'none';
    } else {
        userInfoDiv.innerHTML = '';
        authSection.style.display = 'block';
        adminPanel.style.display = 'none';
        document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
            const { signInWithGoogle } = await import('./modules/auth.js');
            await signInWithGoogle();
        });
    }
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            currentTab = tabId;
            
            // Update active class
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show correct tab
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Refresh data
            if (tabId === 'teachers') {
                loadTeachers();
            } else if (tabId === 'classes') {
                loadClasses();
            }
        });
    });
    
    // Add teacher button
    document.getElementById('addTeacherBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('teacherEmail')?.value;
        const name = document.getElementById('teacherName')?.value;
        
        if (!email) {
            alert('Please enter teacher email');
            return;
        }
        
        const addBtn = document.getElementById('addTeacherBtn');
        addBtn.textContent = 'Adding...';
        addBtn.disabled = true;
        
        await addTeacher(email, name);
        
        addBtn.textContent = 'Generate Code & Add';
        addBtn.disabled = false;
        
        document.getElementById('teacherEmail').value = '';
        document.getElementById('teacherName').value = '';
        loadTeachers();
    });
    
    // Create class button
    document.getElementById('createClassBtn')?.addEventListener('click', async () => {
        const name = document.getElementById('className')?.value;
        const description = document.getElementById('classDescription')?.value;
        
        if (!name) {
            alert('Please enter class name');
            return;
        }
        
        const createBtn = document.getElementById('createClassBtn');
        createBtn.textContent = 'Creating...';
        createBtn.disabled = true;
        
        await createClass(name, description);
        
        createBtn.textContent = 'Create Class';
        createBtn.disabled = false;
        
        document.getElementById('className').value = '';
        document.getElementById('classDescription').value = '';
        loadClasses();
    });
}

// Make functions globally available
window.adminLogout = async () => {
    await logout();
    location.reload();
};

window.generateNewCodeForTeacher = async (teacherId) => {
    await generateNewTeacherCode(teacherId);
    loadTeachers();
};

window.removeTeacherById = async (teacherId) => {
    if (confirm('Remove this teacher? This will delete all their data.')) {
        await removeTeacher(teacherId);
        loadTeachers();
    }
};

window.deleteClassById = async (classId) => {
    if (confirm('Delete this class? This will delete all lessons and data.')) {
        await deleteClass(classId);
        loadClasses();
    }
};