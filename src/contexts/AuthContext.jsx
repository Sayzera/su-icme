import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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

  const logout = () => {
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

