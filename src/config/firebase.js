import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase yapılandırmanızı buraya ekleyin
const firebaseConfig = {
    apiKey: "AIzaSyDCmIUF1QYrNUcI96FXntY8vWUHNj9vHTA",
    authDomain: "gorev-tamamla-fc301.firebaseapp.com",
    projectId: "gorev-tamamla-fc301",
    storageBucket: "gorev-tamamla-fc301.firebasestorage.app",
    messagingSenderId: "776336909982",
    appId: "1:776336909982:web:3bfe5b7ca0c050b2537d8f"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini export et
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

