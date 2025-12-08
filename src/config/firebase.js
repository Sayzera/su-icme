import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// Firebase Cloud Messaging
export const messaging = getMessaging(app);

// VAPID Key - Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Bu key'i Firebase Console'dan almanız gerekiyor!
const VAPID_KEY = 'BM89OPqqYYQaV-6xfUpG5tg0JliIGUHFgYqXR13vrKZUxnEVnMFW0rz3dzowTdLZ_XMdnbh8liOhLVfGZffIPlQ';

// FCM Token al
export const getFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('FCM Token:', token);
      return token;
    }
    console.log('Bildirim izni reddedildi');
    return null;
  } catch (error) {
    console.error('FCM Token alınamadı:', error);
    return null;
  }
};

// Foreground mesajları dinle
export const onForegroundMessage = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('Foreground mesaj alındı:', payload);
    callback(payload);
  });
};

export default app;

