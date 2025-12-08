import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { saveFCMToken, removeFCMToken, registerServiceWorker } from '../services/fcmService';
import { onForegroundMessage } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fcmTokenRef = useRef(null);

  // Service Worker ve FCM kurulumu
  useEffect(() => {
    const setupFCM = async () => {
      // Service Worker'ı kaydet
      await registerServiceWorker();

      // Foreground mesajları dinle
      onForegroundMessage((payload) => {
        console.log('📩 Foreground bildirim:', payload);
        
        // Foreground'da bildirim göster
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || '💧 Su İçme Hatırlatıcı', {
            body: payload.notification?.body || 'Yeni bir bildirim var!',
            icon: '/vite.svg'
          });
        }
      });
    };

    setupFCM();
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Firestore'a kullanıcı bilgilerini kaydet
    if (userCredential.user) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    // Logout'ta FCM token'ı kaldır
    if (currentUser && fcmTokenRef.current) {
      await removeFCMToken(currentUser.uid, fcmTokenRef.current);
      fcmTokenRef.current = null;
    }
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Kullanıcı bilgilerini Firestore'dan kontrol et ve güncelle
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Eğer Firestore'da yoksa oluştur (eski kullanıcılar için)
          await setDoc(userDocRef, {
            email: user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          // Email güncellemesi varsa Firestore'u güncelle
          const userData = userDoc.data();
          if (userData.email !== user.email) {
            await setDoc(userDocRef, {
              ...userData,
              email: user.email,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }

        // FCM Token kaydet (push notification için)
        const token = await saveFCMToken(user.uid);
        if (token) {
          fcmTokenRef.current = token;
          console.log('✅ FCM token kaydedildi');
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

