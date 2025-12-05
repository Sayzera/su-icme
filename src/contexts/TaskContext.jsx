import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

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

