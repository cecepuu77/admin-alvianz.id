// Firebase Configuration for Alvianz Admin Panel
const firebaseConfig = {
    apiKey: "AIzaSyCn7CiwINqT5JQZHJlKjTOLRMFu99HE9Sw",
    authDomain: "alvianz-panel.firebaseapp.com",
    databaseURL: "https://alvianz-panel-default-rtdb.firebaseio.com",
    projectId: "alvianz-panel",
    storageBucket: "alvianz-panel.appspot.com",
    messagingSenderId: "213485076946",
    appId: "1:213485076946:web:af953b3cfcc4f19400c80b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();
const auth = firebase.auth();

// Export for use in other files
window.firebaseConfig = firebaseConfig;
window.database = database;
window.auth = auth;