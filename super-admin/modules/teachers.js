// Add these functions to teachers.js

// Load all classes for a specific teacher
export async function loadTeacherClasses(teacherId) {
    try {
        const classesRef = collection(db, 'classes');
        const q = query(classesRef, where('teacherId', '==', teacherId));
        const snapshot = await getDocs(q);
        
        const classes = [];
        snapshot.forEach(docSnap => {
            classes.push({ id: docSnap.id, ...docSnap.data() });
        });
        return classes;
    } catch (error) {
        console.error('Error loading teacher classes:', error);
        return [];
    }
}

// Load all students enrolled in a class
export async function loadClassStudents(classId) {
    try {
        // Get the class document to find enrolled students
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists) return [];
        
        const classData = classDoc.data();
        const studentIds = classData.enrolledStudents || [];
        
        const students = [];
        for (const studentId of studentIds) {
            const studentRef = doc(db, 'users', studentId);
            const studentDoc = await getDoc(studentRef);
            if (studentDoc.exists) {
                students.push({ id: studentDoc.id, ...studentDoc.data() });
            }
        }
        return students;
    } catch (error) {
        console.error('Error loading class students:', error);
        return [];
    }
}

// Load student progress
export async function loadStudentProgress(studentId) {
    try {
        const userRef = doc(db, 'users', studentId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists) {
            return userDoc.data().progress || { overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 } };
        }
        return { overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 } };
    } catch (error) {
        console.error('Error loading student progress:', error);
        return { overall: { totalPoints: 0, quizzesTaken: 0, totalTimeSpent: 0 } };
    }
}

// Get student quiz attempts
export async function getStudentAttempts(studentId) {
    try {
        const attemptsRef = collection(db, 'attempts');
        const q = query(attemptsRef, where('userId', '==', studentId));
        const snapshot = await getDocs(q);
        
        const attempts = [];
        snapshot.forEach(docSnap => {
            attempts.push({ id: docSnap.id, ...docSnap.data() });
        });
        return attempts.sort((a, b) => {
            if (!a.completedAt || !b.completedAt) return 0;
            return b.completedAt.toDate() - a.completedAt.toDate();
        });
    } catch (error) {
        console.error('Error loading student attempts:', error);
        return [];
    }
}