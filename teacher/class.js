// teacher/class.js
// Class Management Page

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBhujqx9CZwK_NUrQgcUEX5wxKS0hYjXKc",
    authDomain: "vikash-classes-c98f8.firebaseapp.com",
    projectId: "vikash-classes-c98f8",
    storageBucket: "vikash-classes-c98f8.firebasestorage.app",
    messagingSenderId: "456891384843",
    appId: "1:456891384843:web:cf845b07c2884a4c64b30e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let classId = null;
let classData = null;
let currentTeacherId = null;
let currentSubjectId = null;
let currentSubjectName = null;

// DOM Elements
const backBtn = document.getElementById('backBtn');
const logoutBtn = document.getElementById('logoutBtn');
const classNameHeader = document.getElementById('classNameHeader');
const classNameInput = document.getElementById('className');
const classDescription = document.getElementById('classDescription');
const saveClassDetailsBtn = document.getElementById('saveClassDetailsBtn');
const enrollmentCodeSpan = document.getElementById('enrollmentCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const generateNewCodeBtn = document.getElementById('generateNewCodeBtn');
const subjectsList = document.getElementById('subjectsList');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const studentsList = document.getElementById('studentsList');
const viewAllStudentsBtn = document.getElementById('viewAllStudentsBtn');

// Modals
const addSubjectModal = document.getElementById('addSubjectModal');
const cancelSubjectBtn = document.getElementById('cancelSubjectBtn');
const confirmSubjectBtn = document.getElementById('confirmSubjectBtn');
const lessonsModal = document.getElementById('lessonsModal');
const closeLessonsBtn = document.getElementById('closeLessonsBtn');
const studentProgressModal = document.getElementById('studentProgressModal');
const closeProgressBtn = document.getElementById('closeProgressBtn');

// Lesson Form Modal Elements
const lessonFormModal = document.getElementById('lessonFormModal');
const cancelLessonBtn = document.getElementById('cancelLessonBtn');
const saveLessonBtn = document.getElementById('saveLessonBtn');
const addLessonBtn = document.getElementById('addLessonBtn');
const lessonTitle = document.getElementById('lessonTitle');
const lessonDescription = document.getElementById('lessonDescription');
const lessonJsonInput = document.getElementById('lessonJsonInput');
const lessonFileUpload = document.getElementById('lessonFileUpload');

// Toast function
function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
classId = urlParams.get('id');

if (!classId) {
    window.location.href = 'index.html';
}

// Load config.json and populate subject dropdown
async function loadSubjectsConfig() {
    try {
        const response = await fetch('../config.json');
        const config = await response.json();
        return config.subjects;
    } catch (error) {
        console.error('Error loading config:', error);
        return [];
    }
}

// Populate subject dropdown
async function populateSubjectDropdown() {
    const subjects = await loadSubjectsConfig();
    const select = document.getElementById('subjectSelect');
    
    select.innerHTML = '<option value="">-- Select a subject --</option>';
    
    subjects.forEach(subject => {
        select.innerHTML += `<option value="${subject.id}" data-icon="${subject.icon}" data-color="${subject.color}">${subject.icon} ${subject.name}</option>`;
    });
}

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verify user is a teacher
    const teacherQuery = query(collection(db, 'teachers'), where('email', '==', user.email));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (teacherSnapshot.empty) {
        showToast('Access denied', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    currentTeacherId = teacherSnapshot.docs[0].id;
    loadClassData();
});

// Load class data
async function loadClassData() {
    try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists) {
            showToast('Class not found', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        classData = classDoc.data();
        
        // Verify teacher owns this class
        if (classData.teacherId !== currentTeacherId) {
            showToast('Access denied', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Update UI
        classNameHeader.textContent = classData.name;
        classNameInput.value = classData.name;
        classDescription.value = classData.description || '';
        enrollmentCodeSpan.textContent = classData.enrollmentCode || 'Not set';
        
        // Load subjects
        loadSubjects();
        
        // Load students (show first 5)
        loadStudents(5);
        
    } catch (error) {
        console.error('Error loading class:', error);
        showToast('Failed to load class', 'error');
    }
}

// Load subjects for this class
async function loadSubjects() {
    subjectsList.innerHTML = '<div class="loading">Loading subjects...</div>';
    
    try {
        // Load config to get subject names and icons
        const configSubjects = await loadSubjectsConfig();
        const configMap = {};
        configSubjects.forEach(s => { configMap[s.id] = s; });
        
        const subjectsRef = collection(db, 'subjects');
        const q = query(subjectsRef, where('classId', '==', classId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            subjectsList.innerHTML = '<p>No subjects added yet. Click "Add Subject" to get started.</p>';
            return;
        }
        
        let html = '';
        for (const docSnap of snapshot.docs) {
            const subject = docSnap.data();
            const configSubject = configMap[subject.subjectId] || { name: subject.name, icon: subject.icon || '📚' };
            
            // Count lessons for this subject
            const lessonsRef = collection(db, 'lessons');
            const lessonsQuery = query(lessonsRef, where('subjectId', '==', subject.subjectId), where('classId', '==', classId));
            const lessonsSnapshot = await getDocs(lessonsQuery);
            
            html += `
                <div class="subject-card">
                    <div>
                        <div class="subject-name">${configSubject.icon || '📚'} ${configSubject.name}</div>
                        <div class="subject-stats">${lessonsSnapshot.size} lessons</div>
                    </div>
                    <div>
                        <button class="btn-secondary manage-lessons-btn" data-subject-id="${subject.subjectId}" data-subject-name="${configSubject.name}">Manage Lessons</button>
                    </div>
                </div>
            `;
        }
        subjectsList.innerHTML = html;
        
        // Add event listeners to manage lessons buttons
        document.querySelectorAll('.manage-lessons-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subjectId = btn.dataset.subjectId;
                const subjectName = btn.dataset.subjectName;
                showLessonsModal(subjectId, subjectName);
            });
        });
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        subjectsList.innerHTML = '<div class="error">Failed to load subjects</div>';
    }
}

// Load students
async function loadStudents(limit = 5) {
    studentsList.innerHTML = '<div class="loading">Loading students...</div>';
    
    try {
        // Refresh class data to get latest enrolled students
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        if (classDoc.exists) {
            classData = classDoc.data();
        }
        
        const enrolledStudentIds = classData.enrolledStudents || [];
        console.log('Enrolled students IDs:', enrolledStudentIds);
        
        if (enrolledStudentIds.length === 0) {
            studentsList.innerHTML = '<p>No students enrolled yet.</p>';
            return;
        }
        
        const studentsToShow = enrolledStudentIds.slice(0, limit);
        let html = '';
        
        for (const studentId of studentsToShow) {
            const studentDoc = await getDoc(doc(db, 'users', studentId));
            if (studentDoc.exists) {
                const student = studentDoc.data();
                html += `
                    <div class="student-item">
                        <div>
                            <strong>${escapeHtml(student.displayName || student.username)}</strong>
                            <div style="font-size: 12px; color: #64748b;">@${escapeHtml(student.username)}</div>
                            <div style="font-size: 11px; color: #64748b;">${escapeHtml(student.email)}</div>
                        </div>
                        <button class="btn-secondary view-student-btn" 
                            data-student-id="${studentId}" 
                            data-student-name="${escapeHtml(student.displayName || student.username)}">
                            View Progress
                        </button>
                    </div>
                `;
            } else {
                console.log('Student document not found for ID:', studentId);
            }
        }
        
        studentsList.innerHTML = html;
        
        // Add event listeners to view student buttons
        document.querySelectorAll('.view-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const studentId = btn.dataset.studentId;
                const studentName = btn.dataset.studentName;
                window.location.href = `student-progress.html?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}`;
            });
        });
        
        // Show "View All" button if there are more students
        if (enrolledStudentIds.length > limit) {
            viewAllStudentsBtn.style.display = 'block';
        } else {
            viewAllStudentsBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading students:', error);
        studentsList.innerHTML = '<div class="error">Failed to load students</div>';
    }
}


// Show lessons modal
async function showLessonsModal(subjectId, subjectName) {
    currentSubjectId = subjectId;
    currentSubjectName = subjectName;
    
    const lessonsListDiv = document.getElementById('lessonsList');
    const lessonsModalTitle = document.getElementById('lessonsModalTitle');
    lessonsModalTitle.textContent = `${subjectName} - Lessons`;
    lessonsListDiv.innerHTML = '<div class="loading">Loading lessons...</div>';
    lessonsModal.style.display = 'flex';
    
    try {
        const lessonsRef = collection(db, 'lessons');
        const q = query(lessonsRef, where('subjectId', '==', subjectId), where('classId', '==', classId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            lessonsListDiv.innerHTML = '<p>No lessons yet. Click "Add New Lesson" to get started.</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(docSnap => {
            const lesson = docSnap.data();
            const questionCount = lesson.questions?.length || 0;
            const updatedDate = lesson.updatedAt?.toDate ? new Date(lesson.updatedAt.toDate()).toLocaleDateString() : lesson.createdAt?.toDate ? new Date(lesson.createdAt.toDate()).toLocaleDateString() : 'N/A';
            
            html += `
                <div class="subject-card" style="margin-bottom: 8px;">
                    <div>
                        <div><strong>📖 ${escapeHtml(lesson.title)}</strong></div>
                        <div style="font-size: 12px; color: #64748b;">${questionCount} questions · Last updated: ${updatedDate}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-warning edit-lesson-btn" data-lesson-id="${docSnap.id}" data-lesson-title="${escapeHtml(lesson.title)}" data-lesson-description="${escapeHtml(lesson.description || '')}" data-lesson-json='${JSON.stringify(lesson.questions || []).replace(/'/g, "\\'")}' style="padding: 4px 12px;">Edit</button>
                        <button class="btn-danger delete-lesson-btn" data-lesson-id="${docSnap.id}" style="padding: 4px 12px;">Delete</button>
                    </div>
                </div>
            `;
        });
        lessonsListDiv.innerHTML = html;
        
        // Add edit event listeners
        document.querySelectorAll('.edit-lesson-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lessonId = btn.dataset.lessonId;
                const title = btn.dataset.lessonTitle;
                const description = btn.dataset.lessonDescription;
                const questionsJson = btn.dataset.lessonJson;
                showLessonForm(lessonId, title, description, questionsJson);
            });
        });
        
        // Add delete event listeners
        document.querySelectorAll('.delete-lesson-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const lessonId = btn.dataset.lessonId;
                if (confirm('Delete this lesson? This action cannot be undone.')) {
                    await deleteLesson(lessonId);
                    showLessonsModal(currentSubjectId, currentSubjectName);
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading lessons:', error);
        lessonsListDiv.innerHTML = '<div class="error">Failed to load lessons</div>';
    }
}

// Show add/edit lesson form
function showLessonForm(lessonId = null, title = '', description = '', questionsJson = '[]') {
    const modal = document.getElementById('lessonFormModal');
    const modalTitle = document.getElementById('lessonFormTitle');
    const lessonIdField = document.getElementById('lessonId');
    
    if (lessonId) {
        modalTitle.textContent = '✏️ Edit Lesson';
        lessonIdField.value = lessonId;
    } else {
        modalTitle.textContent = '➕ Add New Lesson';
        lessonIdField.value = '';
    }
    
    lessonTitle.value = title;
    lessonDescription.value = description;
    
    // Format JSON for display
    try {
        const questions = JSON.parse(questionsJson);
        lessonJsonInput.value = JSON.stringify(questions, null, 2);
    } catch (e) {
        lessonJsonInput.value = questionsJson;
    }
    
    modal.style.display = 'flex';
}

// Save lesson
async function saveLesson() {
    const lessonId = document.getElementById('lessonId').value;
    const title = lessonTitle.value.trim();
    const description = lessonDescription.value.trim();
    let questions = [];
    
    // Get questions from JSON input
    const jsonText = lessonJsonInput.value.trim();
    if (jsonText) {
        try {
            const parsed = JSON.parse(jsonText);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            } else if (Array.isArray(parsed)) {
                questions = parsed;
            } else {
                showToast('Invalid JSON format. Please provide an array of questions or object with "questions" array.', 'error');
                return;
            }
        } catch (e) {
            showToast('Invalid JSON format. Please check your syntax.', 'error');
            return;
        }
    }
    
    if (!title) {
        showToast('Lesson title is required', 'error');
        return;
    }
    
    if (questions.length === 0) {
        showToast('At least one question is required', 'error');
        return;
    }
    
    saveLessonBtn.disabled = true;
    saveLessonBtn.textContent = 'Saving...';
    
    try {
        const lessonData = {
            title: title,
            description: description,
            subjectId: currentSubjectId,
            classId: classId,
            teacherId: currentTeacherId,
            questions: questions,
            updatedAt: new Date()
        };
        
        if (lessonId) {
            // Update existing lesson
            await updateDoc(doc(db, 'lessons', lessonId), lessonData);
            showToast('Lesson updated successfully!', 'success');
        } else {
            // Create new lesson
            lessonData.createdAt = new Date();
            await addDoc(collection(db, 'lessons'), lessonData);
            showToast('Lesson added successfully!', 'success');
        }
        
        // Close modal and refresh lessons list
        lessonFormModal.style.display = 'none';
        showLessonsModal(currentSubjectId, currentSubjectName);
        
    } catch (error) {
        console.error('Error saving lesson:', error);
        showToast('Failed to save lesson: ' + error.message, 'error');
    } finally {
        saveLessonBtn.disabled = false;
        saveLessonBtn.textContent = 'Save Lesson';
    }
}

// Delete lesson
async function deleteLesson(lessonId) {
    try {
        await deleteDoc(doc(db, 'lessons', lessonId));
        showToast('Lesson deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting lesson:', error);
        showToast('Failed to delete lesson', 'error');
    }
}

// Handle file upload
function handleFileUpload(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            // Validate JSON
            JSON.parse(content);
            lessonJsonInput.value = content;
            showToast('File loaded successfully!', 'success');
        } catch (error) {
            showToast('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
}

// Show student progress modal
async function showStudentProgress(studentId, studentName) {
    const studentNameModal = document.getElementById('studentNameModal');
    const studentProgressContent = document.getElementById('studentProgressContent');
    studentNameModal.textContent = studentName;
    studentProgressContent.innerHTML = '<div class="loading">Loading progress...</div>';
    studentProgressModal.style.display = 'flex';
    
    try {
        // Get student data
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        const studentData = studentDoc.data();
        const overall = studentData.overall || { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 };
        const avgAccuracy = overall.quizzesTaken > 0 
            ? Math.round((overall.totalPoints / (overall.quizzesTaken * 100)) * 100) 
            : 0;
        
        // Get recent attempts for this class
        const attemptsRef = collection(db, 'attempts');
        const q = query(attemptsRef, where('userId', '==', studentId), where('classId', '==', classId));
        const attemptsSnapshot = await getDocs(q);
        
        let attemptsHtml = '';
        if (attemptsSnapshot.empty) {
            attemptsHtml = '<p>No attempts in this class yet.</p>';
        } else {
            attemptsHtml = '<div style="margin-top: 16px;"><strong>Recent Attempts:</strong></div>';
            attemptsSnapshot.forEach(docSnap => {
                const attempt = docSnap.data();
                attemptsHtml += `
                    <div style="border-top: 1px solid #e2e8f0; padding: 8px 0;">
                        <div>📖 ${escapeHtml(attempt.lessonTitle || attempt.lessonId)}</div>
                        <div>Score: ${attempt.score}/${attempt.maxPossible} (${attempt.accuracy}%)</div>
                        <div style="font-size: 12px; color: #64748b;">${attempt.completedAt?.toDate ? new Date(attempt.completedAt.toDate()).toLocaleString() : 'N/A'}</div>
                    </div>
                `;
            });
        }
        
        studentProgressContent.innerHTML = `
            <div>
                <div><strong>Total Points:</strong> ${overall.totalPoints}</div>
                <div><strong>Quizzes Taken:</strong> ${overall.quizzesTaken}</div>
                <div><strong>Accuracy:</strong> ${avgAccuracy}%</div>
                <div><strong>Total Time:</strong> ${formatTime(overall.totalTimeSpent || 0)}</div>
            </div>
            ${attemptsHtml}
        `;
        
    } catch (error) {
        console.error('Error loading student progress:', error);
        studentProgressContent.innerHTML = '<div class="error">Failed to load progress</div>';
    }
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// Save class details
saveClassDetailsBtn.addEventListener('click', async () => {
    const newName = classNameInput.value.trim();
    const newDescription = classDescription.value.trim();
    
    if (!newName) {
        showToast('Class name is required', 'error');
        return;
    }
    
    saveClassDetailsBtn.disabled = true;
    saveClassDetailsBtn.textContent = 'Saving...';
    
    try {
        await updateDoc(doc(db, 'classes', classId), {
            name: newName,
            description: newDescription
        });
        
        classNameHeader.textContent = newName;
        showToast('Class details saved!', 'success');
        
    } catch (error) {
        console.error('Error saving class:', error);
        showToast('Failed to save', 'error');
    } finally {
        saveClassDetailsBtn.disabled = false;
        saveClassDetailsBtn.textContent = 'Save Changes';
    }
});

// Generate new enrollment code
generateNewCodeBtn.addEventListener('click', async () => {
    const newCode = generateRandomCode();
    
    try {
        await updateDoc(doc(db, 'classes', classId), {
            enrollmentCode: newCode
        });
        
        enrollmentCodeSpan.textContent = newCode;
        showToast(`New enrollment code: ${newCode}`, 'success');
        
    } catch (error) {
        console.error('Error generating code:', error);
        showToast('Failed to generate code', 'error');
    }
});

// Copy enrollment code
copyCodeBtn.addEventListener('click', () => {
    const code = enrollmentCodeSpan.textContent;
    navigator.clipboard.writeText(code);
    showToast('Code copied to clipboard!', 'success');
});

function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Add subject button - show modal and populate dropdown
addSubjectBtn.addEventListener('click', async () => {
    await populateSubjectDropdown();
    addSubjectModal.style.display = 'flex';
});

// Cancel add subject
cancelSubjectBtn.addEventListener('click', () => {
    addSubjectModal.style.display = 'none';
});

// Confirm add subject
confirmSubjectBtn.addEventListener('click', async () => {
    const select = document.getElementById('subjectSelect');
    const selectedOption = select.options[select.selectedIndex];
    const subjectId = select.value;
    const subjectName = selectedOption?.textContent?.replace(selectedOption.dataset.icon || '', '').trim() || '';
    const subjectIcon = selectedOption?.dataset.icon || '📚';
    
    if (!subjectId) {
        showToast('Please select a subject', 'error');
        return;
    }
    
    // Check if subject already exists in this class
    const existingSubjects = await getDocs(query(collection(db, 'subjects'), where('classId', '==', classId), where('subjectId', '==', subjectId)));
    if (!existingSubjects.empty) {
        showToast('This subject is already added to the class', 'error');
        return;
    }
    
    confirmSubjectBtn.disabled = true;
    confirmSubjectBtn.textContent = 'Adding...';
    
    try {
        await addDoc(collection(db, 'subjects'), {
            subjectId: subjectId,
            name: subjectName,
            icon: subjectIcon,
            classId: classId,
            teacherId: currentTeacherId,
            createdAt: new Date()
        });
        
        showToast(`Subject "${subjectName}" added!`, 'success');
        addSubjectModal.style.display = 'none';
        loadSubjects();
        
    } catch (error) {
        console.error('Error adding subject:', error);
        showToast('Failed to add subject', 'error');
    } finally {
        confirmSubjectBtn.disabled = false;
        confirmSubjectBtn.textContent = 'Add Subject';
    }
});

// View all students
viewAllStudentsBtn.addEventListener('click', () => {
    loadStudents(100);
    viewAllStudentsBtn.style.display = 'none';
});

// Lesson modal buttons
if (addLessonBtn) {
    addLessonBtn.addEventListener('click', () => {
        showLessonForm();
    });
}

if (closeLessonsBtn) {
    closeLessonsBtn.addEventListener('click', () => {
        lessonsModal.style.display = 'none';
    });
}

if (cancelLessonBtn) {
    cancelLessonBtn.addEventListener('click', () => {
        lessonFormModal.style.display = 'none';
    });
}

if (saveLessonBtn) {
    saveLessonBtn.addEventListener('click', saveLesson);
}

// File upload listener
if (lessonFileUpload) {
    lessonFileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === addSubjectModal) addSubjectModal.style.display = 'none';
    if (e.target === lessonsModal) lessonsModal.style.display = 'none';
    if (e.target === studentProgressModal) studentProgressModal.style.display = 'none';
    if (e.target === lessonFormModal) lessonFormModal.style.display = 'none';
});

// Back button
backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});

// Close progress modal
closeProgressBtn.addEventListener('click', () => {
    studentProgressModal.style.display = 'none';
});

function escapeHtml(text) {
    if (!text) return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}