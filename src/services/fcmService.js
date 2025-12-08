// FCM (Firebase Cloud Messaging) Servisi
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, getFCMToken } from '../config/firebase';

/**
 * Kullanıcının FCM token'ını Firestore'a kaydet
 */
export const saveFCMToken = async (userId) => {
  if (!userId) return null;

  try {
    const token = await getFCMToken();
    if (!token) {
      console.log('FCM token alınamadı');
      return null;
    }

    // Kullanıcı dökümanına token ekle
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Mevcut kullanıcıya token ekle (array olarak, birden fazla cihaz için)
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date()
      });
    } else {
      // Yeni kullanıcı dökümanı oluştur
      await setDoc(userRef, {
        fcmTokens: [token],
        lastTokenUpdate: new Date()
      }, { merge: true });
    }

    console.log('FCM token kaydedildi:', token);
    return token;
  } catch (error) {
    console.error('FCM token kaydedilemedi:', error);
    return null;
  }
};

/**
 * Kullanıcının FCM token'ını Firestore'dan kaldır (logout için)
 */
export const removeFCMToken = async (userId, token) => {
  if (!userId || !token) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token)
    });
    console.log('FCM token kaldırıldı');
  } catch (error) {
    console.error('FCM token kaldırılamadı:', error);
  }
};

/**
 * Service Worker'ı kaydet
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker kaydedildi:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker kaydedilemedi:', error);
      return null;
    }
  }
  return null;
};

