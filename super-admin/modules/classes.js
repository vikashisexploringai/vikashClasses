// super-admin/modules/classes.js
// Class management

import { db, collection, getDocs, addDoc, doc, deleteDoc } from './auth.js';
import { showToast } from './utils.js';

export async function loadClasses() {
    const listDiv = document.getElementById('classesList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '<div class="loading">Loading classes...</div>';
    
    try {
        const classesRef = collection(db, 'classes');
        const snapshot = await getDocs(classesRef);
        
        if (snapshot.empty) {
            listDiv.innerHTML = '<p>No classes created yet.</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(docSnap => {
            const classData = docSnap.data();
            html += `
                <div class="class-card">
                    <div class="class-info">
                        <strong>${escapeHtml(classData.name)}</strong><br>
                        <small>${escapeHtml(classData.description || 'No description')}</small><br>
                        <span class="class-code">ID: ${docSnap.id}</span>
                        <small> · Created: ${classData.createdAt?.toDate ? new Date(classData.createdAt.toDate()).toLocaleDateString() : 'N/A'}</small>
                    </div>
                    <div>
                        <button class="btn-danger" onclick="window.deleteClassById('${docSnap.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        listDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading classes:', error);
        listDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

export async function createClass(name, description = '') {
    try {
        await addDoc(collection(db, 'classes'), {
            name: name,
            description: description,
            createdAt: new Date(),
            subjects: [],
            isOpenClass: false
        });
        showToast(`Class "${name}" created successfully!`, 'success');
        return true;
    } catch (error) {
        console.error('Error creating class:', error);
        showToast('Failed to create class: ' + error.message, 'error');
        return false;
    }
}

export async function deleteClass(classId) {
    try {
        const classRef = doc(db, 'classes', classId);
        await deleteDoc(classRef);
        showToast('Class deleted successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting class:', error);
        showToast('Failed to delete class', 'error');
        return false;
    }
}

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}