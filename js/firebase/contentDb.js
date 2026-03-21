// js/firebase/contentDb.js
// Connection to vikashclasses-db for content data

let contentDb = null;

export function getContentDb() {
    if (contentDb) return contentDb;
    
    // Get a new Firestore instance with the content database ID
    contentDb = firebase.firestore();
    contentDb.settings({ databaseId: 'vikashclasses-db' });
    
    console.log('✅ Content database connected to vikashclasses-db');
    return contentDb;
}