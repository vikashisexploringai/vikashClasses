// js/data/lessonLoader.js
// Load lesson JSON files from data folder

async function loadLesson(classId, subjectId, lessonId) {
    try {
        const path = `data/${classId}/${subjectId}/${lessonId}.json`;
        console.log('Loading lesson from:', path);
        
        const response = await fetch(path);
        
        if (!response.ok) {
            throw new Error(`Failed to load: ${response.status}`);
        }
        
        const lessonData = await response.json();
        
        // Add metadata about class and subject
        lessonData.classId = classId;
        lessonData.subjectId = subjectId;
        lessonData.lessonId = lessonId;
        
        return lessonData;
        
    } catch (error) {
        console.error('Error loading lesson:', error);
        throw error;
    }
}

async function loadManifest(classId, subjectId) {
    try {
        const path = `data/${classId}/${subjectId}/manifest.json`;
        const response = await fetch(path);
        
        if (!response.ok) {
            // No manifest, return empty
            return null;
        }
        
        return await response.json();
        
    } catch (error) {
        console.log('No manifest found for:', classId, subjectId);
        return null;
    }
}

export { loadLesson, loadManifest };