// super-admin/admin.js
// Main Super Admin application

import { initAdminAuth, signInWithGoogle, logout, getCurrentAdmin } from './modules/auth.js';
import { loadTeachers, addTeacher, generateNewTeacherCode, removeTeacher } from './modules/teachers.js';

let currentTab = 'teachers';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initAdminAuth(handleAuthState);
});

function handleAuthState(state, user) {
    const userInfoDiv = document.getElementById('userInfo');
    const adminContent = document.getElementById('adminContent');
    
    if (state === 'authenticated') {
        userInfoDiv.innerHTML = `
            <div class="user-info">
                <span>👑 ${user.displayName || user.email}</span>
                <button onclick="window.adminLogout()" class="btn-secondary">Logout</button>
            </div>
        `;
        renderDashboard();
    } else if (state === 'unauthorized') {
        userInfoDiv.innerHTML = `
            <div class="user-info">
                <span>⚠️ Signed in as: ${user.email}</span>
                <button onclick="window.adminLogout()" class="btn-secondary">Logout</button>
            </div>
        `;
        adminContent.innerHTML = `
            <div class="error-message">
                ⚠️ You are not authorized to access the Super Admin panel.
                <br><br>
                <button onclick="window.location.href='../index.html'" class="btn-primary">Back to Student App</button>
            </div>
        `;
    } else {
        userInfoDiv.innerHTML = '';
        adminContent.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <h2>🔐 Admin Access Required</h2>
                <p style="margin: 20px 0;">Sign in with your Google account to access the Super Admin Dashboard.</p>
                <button id="googleSignInBtn" class="google-login-btn">
                    <span>🔑</span> Sign in with Google
                </button>
            </div>
        `;
        
        document.getElementById('googleSignInBtn')?.addEventListener('click', async () => {
            await signInWithGoogle();
        });
    }
}

async function renderDashboard() {
    const adminContent = document.getElementById('adminContent');
    
    adminContent.innerHTML = `
        <div class="admin-tabs">
            <button class="tab-btn ${currentTab === 'teachers' ? 'active' : ''}" data-tab="teachers">👩‍🏫 Teachers</button>
            <button class="tab-btn ${currentTab === 'openclasses' ? 'active' : ''}" data-tab="openclasses">🌍 Open Classes</button>
        </div>
        <div id="tab-teachers" class="tab-content ${currentTab === 'teachers' ? 'active' : ''}">
            <div class="add-teacher-form">
                <h3>➕ Add New Teacher</h3>
                <div class="form-row">
                    <input type="email" id="teacherEmail" placeholder="teacher@example.com">
                    <input type="text" id="teacherName" placeholder="Full Name (optional)">
                    <button id="addTeacherBtn" class="btn-primary">Generate Code & Add</button>
                </div>
            </div>
            <div id="teachersList">
                <div class="loading">Loading teachers...</div>
            </div>
        </div>
        <div id="tab-openclasses" class="tab-content ${currentTab === 'openclasses' ? 'active' : ''}">
            <div class="loading">Open Classes management coming soon...</div>
        </div>
    `;
    
    // Add tab event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.dataset.tab;
            renderDashboard();
        });
    });
    
    // Load teachers
    await renderTeachersList();
    
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
        
        await renderTeachersList();
    });
}

async function renderTeachersList() {
    const teachersList = document.getElementById('teachersList');
    if (!teachersList) return;
    
    teachersList.innerHTML = '<div class="loading">Loading teachers...</div>';
    
    const teachers = await loadTeachers();
    
    if (teachers.length === 0) {
        teachersList.innerHTML = '<p>No teachers added yet.</p>';
        return;
    }
    
    teachersList.innerHTML = teachers.map(teacher => `
        <div class="teacher-card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div class="teacher-info">
                    <div class="teacher-name">${escapeHtml(teacher.displayName || teacher.email)}</div>
                    <div class="teacher-email">${escapeHtml(teacher.email)}</div>
                    <div>
                        <span class="teacher-code">Code: ${teacher.teacherCode || 'N/A'}</span>
                        <span class="teacher-meta">Created: ${teacher.createdAt?.toDate ? new Date(teacher.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div class="teacher-actions">
                    <button class="btn-warning" onclick="window.generateNewCodeForTeacher('${teacher.id}')">New Code</button>
                    <button class="btn-danger" onclick="window.removeTeacherById('${teacher.id}')">Remove</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.generateNewCodeForTeacher = async (teacherId) => {
    await generateNewTeacherCode(teacherId);
    await renderTeachersList();
};

window.removeTeacherById = async (teacherId) => {
    if (confirm('Are you sure you want to remove this teacher? This will delete all their classes and data.')) {
        await removeTeacher(teacherId);
        await renderTeachersList();
    }
};

window.adminLogout = async () => {
    await logout();
};

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}