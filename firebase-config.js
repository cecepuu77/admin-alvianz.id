import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "eb680cfdaefdd1965a553ef7255a753d4306f946",
  authDomain: "alvianz-shop.firebaseapp.com",
  databaseURL: "https://alvianz-shop-default-rtdb.firebaseio.com",
  projectId: "alvianz-shop",
  storageBucket: "alvianz-shop.appspot.com",
  messagingSenderId: "669970554996",
  appId: "1:669970554996:web:77830130946a662fe23121",
  measurementId: "G-7E7NS89RH1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };