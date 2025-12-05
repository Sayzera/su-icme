import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { showTaskCompletedNotification } from '../services/notificationService';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const previousCompletedTasksRef = useRef(new Set()); // Önceki tamamlanan görevleri takip et
  const userEmailsCacheRef = useRef({}); // Kullanıcı email'lerini cache'le

  // Günlük görev aralıkları
  const timeRanges = [
    { id: 1, start: '09:00', end: '11:00', label: '09:00 - 11:00' },
    { id: 2, start: '11:00', end: '14:00', label: '11:00 - 14:00' },
    { id: 3, start: '14:00', end: '16:00', label: '14:00 - 16:00' },
    { id: 4, start: '16:00', end: '18:00', label: '16:00 - 18:00' },
  ];

  // Bugünün tarihini al (sadece tarih, saat yok)
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Bugünün görevlerini yükle
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const today = getTodayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', currentUser.uid),
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<', Timestamp.fromDate(tomorrow))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Bugünün görevlerini zaman aralıklarına göre düzenle
      const todayTasksData = timeRanges.map(range => {
        const task = tasksData.find(t => t.timeRangeId === range.id);
        return {
          ...range,
          completed: task?.completed || false,
          taskId: task?.id || null,
          completedAt: task?.completedAt || null
        };
      });

      setTodayTasks(todayTasksData);
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, timeRanges]);

  // Diğer kullanıcıların görevlerini dinle ve bildirim gönder
  useEffect(() => {
    if (!currentUser) return;

    const today = getTodayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugünün tüm görevlerini dinle (diğer kullanıcılar dahil)
    const allTasksRef = collection(db, 'tasks');
    const q = query(
      allTasksRef,
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<', Timestamp.fromDate(tomorrow))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sadece tamamlanan görevleri filtrele
      const completedTasks = tasksData.filter(task => task.completed && task.completedAt);
      
      // Yeni tamamlanan görevleri bul (diğer kullanıcıların görevleri)
      const newCompletedTasks = completedTasks.filter(task => {
        const taskKey = `${task.userId}-${task.timeRangeId}`;
        const isNew = !previousCompletedTasksRef.current.has(taskKey);
        const isOtherUser = task.userId !== currentUser.uid;
        return isNew && isOtherUser;
      });

      // Yeni tamamlanan görevler için bildirim gönder
      for (const task of newCompletedTasks) {
        const taskKey = `${task.userId}-${task.timeRangeId}`;
        previousCompletedTasksRef.current.add(taskKey);

        // Kullanıcı email'ini al (cache'den veya Firestore'dan)
        let userEmail = userEmailsCacheRef.current[task.userId];
        
        if (!userEmail) {
          try {
            const userDocRef = doc(db, 'users', task.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              userEmail = userDoc.data().email || 'Bilinmeyen Kullanıcı';
              userEmailsCacheRef.current[task.userId] = userEmail;
            } else {
              userEmail = 'Bilinmeyen Kullanıcı';
            }
          } catch (error) {
            console.error('Kullanıcı email alınamadı:', error);
            userEmail = 'Bilinmeyen Kullanıcı';
          }
        }

        // Zaman aralığı etiketini bul
        const timeRange = timeRanges.find(tr => tr.id === task.timeRangeId);
        const timeRangeLabel = timeRange ? timeRange.label : 'Görev';

        // Bildirim göster
        showTaskCompletedNotification(userEmail, timeRangeLabel);
      }

      // Tüm tamamlanan görevleri güncelle (cache için)
      completedTasks.forEach(task => {
        const taskKey = `${task.userId}-${task.timeRangeId}`;
        previousCompletedTasksRef.current.add(taskKey);
      });
    });

    return () => unsubscribe();
  }, [currentUser, timeRanges]);

  // Görevi tamamla
  const completeTask = async (timeRangeId) => {
    if (!currentUser) return;

    const today = getTodayDate();
    const existingTask = tasks.find(
      t => t.timeRangeId === timeRangeId && 
      t.date.toDate().getTime() === today.getTime()
    );

    if (existingTask) {
      // Görev zaten varsa güncelle
      const taskRef = doc(db, 'tasks', existingTask.id);
      await updateDoc(taskRef, {
        completed: true,
        completedAt: Timestamp.now()
      });
    } else {
      // Yeni görev oluştur
      await addDoc(collection(db, 'tasks'), {
        userId: currentUser.uid,
        timeRangeId,
        date: Timestamp.fromDate(today),
        completed: true,
        completedAt: Timestamp.now()
      });
    }
  };

  // Görevi geri al
  const uncompleteTask = async (timeRangeId) => {
    if (!currentUser) return;

    const today = getTodayDate();
    const existingTask = tasks.find(
      t => t.timeRangeId === timeRangeId && 
      t.date.toDate().getTime() === today.getTime()
    );

    if (existingTask) {
      const taskRef = doc(db, 'tasks', existingTask.id);
      await updateDoc(taskRef, {
        completed: false,
        completedAt: null
      });
    }
  };

  const value = {
    tasks,
    todayTasks,
    timeRanges,
    completeTask,
    uncompleteTask,
    loading
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

