import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import './TeamView.css';

const TeamView = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { timeRanges } = useTask();
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({});
  const [userEmails, setUserEmails] = useState({});

  // Bugünün tarihini al
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  useEffect(() => {
    const today = getTodayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugünün tüm görevlerini çek
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<', Timestamp.fromDate(tomorrow))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Kullanıcılara göre grupla
      const tasksByUser = {};
      tasksData.forEach(task => {
        if (!tasksByUser[task.userId]) {
          tasksByUser[task.userId] = [];
        }
        tasksByUser[task.userId].push(task);
      });

      // Kullanıcı email'lerini Firestore'dan çek
      const userIds = Object.keys(tasksByUser);
      const emails = {};
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              emails[userId] = userDoc.data().email || 'Bilinmeyen';
            } else {
              emails[userId] = 'Bilinmeyen';
            }
          } catch (error) {
            console.error(`Kullanıcı ${userId} bilgisi alınamadı:`, error);
            emails[userId] = 'Bilinmeyen';
          }
        })
      );

      setUserEmails(emails);

      // Her kullanıcı için görevleri zaman aralıklarına göre düzenle
      const teamData = Object.keys(tasksByUser).map(userId => {
        const userTasks = tasksByUser[userId];
        const userTaskRanges = timeRanges.map(range => {
          const task = userTasks.find(t => t.timeRangeId === range.id && t.completed);
          return {
            ...range,
            completed: task?.completed || false,
            completedAt: task?.completedAt || null
          };
        });

        const completedCount = userTaskRanges.filter(t => t.completed).length;
        const totalCount = userTaskRanges.length;

        return {
          userId,
          email: emails[userId] || 'Bilinmeyen',
          tasks: userTaskRanges,
          completedCount,
          totalCount,
          progress: (completedCount / totalCount) * 100
        };
      });

      // İstatistikleri hesapla
      const stats = {};
      teamData.forEach(user => {
        stats[user.userId] = {
          completedCount: user.completedCount,
          totalCount: user.totalCount,
          progress: user.progress
        };
      });

      setTeamTasks(teamData);
      setUserStats(stats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [timeRanges]);


  if (loading) {
    return (
      <div className="team-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="team-container">
      <header className="team-header">
        <div>
          <h1>👥 Takım Görevleri</h1>
          <p className="user-email">{currentUser?.email}</p>
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Ana Sayfa
          </button>
          <button onClick={logout} className="logout-btn">
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="team-stats-section">
        <h2>Bugünün Genel İstatistikleri</h2>
        <div className="team-stats-grid">
          <div className="stat-card">
            <h3>{teamTasks.length}</h3>
            <p>Aktif Kullanıcı</p>
          </div>
          <div className="stat-card">
            <h3>
              {teamTasks.reduce((sum, user) => sum + user.completedCount, 0)}
            </h3>
            <p>Toplam Tamamlanan Görev</p>
          </div>
          <div className="stat-card">
            <h3>
              {teamTasks.length > 0
                ? Math.round(
                    teamTasks.reduce((sum, user) => sum + user.progress, 0) /
                      teamTasks.length
                  )
                : 0}
              %
            </h3>
            <p>Ortalama Tamamlanma</p>
          </div>
        </div>
      </div>

      <div className="users-section">
        <h2>Kullanıcı Görevleri</h2>
        {teamTasks.length === 0 ? (
          <div className="no-users">
            <p>Henüz hiçbir kullanıcı görev tamamlamamış.</p>
          </div>
        ) : (
          <div className="users-grid">
            {teamTasks.map((user) => (
              <div key={user.userId} className="user-card">
                <div className="user-header">
                  <h3>
                    {user.userId === currentUser?.uid ? (
                      <>👤 Sen ({user.email})</>
                    ) : (
                      <>👤 {user.email}</>
                    )}
                  </h3>
                  <div className="user-progress-badge">
                    {user.completedCount}/{user.totalCount}
                  </div>
                </div>

                <div className="user-progress-bar-container">
                  <div
                    className="user-progress-bar"
                    style={{ width: `${user.progress}%` }}
                  />
                </div>

                <div className="user-tasks">
                  {user.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`user-task-item ${task.completed ? 'completed' : 'pending'}`}
                    >
                      <span className="task-time">{task.label}</span>
                      {task.completed ? (
                        <span className="task-check">✓</span>
                      ) : (
                        <span className="task-pending">⏳</span>
                      )}
                      {task.completed && task.completedAt && (
                        <span className="task-time-small">
                          {task.completedAt?.toDate
                            ? new Date(task.completedAt.toDate()).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : task.completedAt
                            ? new Date(task.completedAt).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamView;

