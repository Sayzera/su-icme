import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { todayTasks, completeTask, uncompleteTask, loading } = useTask();

  const handleTaskToggle = async (timeRangeId, completed) => {
    if (completed) {
      await uncompleteTask(timeRangeId);
    } else {
      await completeTask(timeRangeId);
    }
  };

  const getCompletedCount = () => {
    return todayTasks.filter(task => task.completed).length;
  };

  const getTotalCount = () => {
    return todayTasks.length;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>💧 Su İçme Takibi</h1>
          <p className="user-email">{currentUser?.email}</p>
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate('/team')} className="team-btn">
            👥 Takım Görünümü
          </button>
          <button onClick={logout} className="logout-btn">
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="progress-section">
        <div className="progress-card">
          <h2>Bugünün İlerlemesi</h2>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${(getCompletedCount() / getTotalCount()) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            {getCompletedCount()} / {getTotalCount()} görev tamamlandı
          </p>
        </div>
      </div>

      <div className="tasks-section">
        <h2>Günlük Görevler</h2>
        <div className="tasks-grid">
          {todayTasks.map((task) => (
            <div 
              key={task.id} 
              className={`task-card ${task.completed ? 'completed' : ''}`}
            >
              <div className="task-header">
                <h3>{task.label}</h3>
                <div className={`task-status ${task.completed ? 'completed' : 'pending'}`}>
                  {task.completed ? '✓ Tamamlandı' : '⏳ Bekliyor'}
                </div>
              </div>
              
              {task.completed && task.completedAt && (
                <p className="completed-time">
                  Tamamlanma: {task.completedAt?.toDate
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
                </p>
              )}

              <button
                onClick={() => handleTaskToggle(task.id, task.completed)}
                className={`task-button ${task.completed ? 'uncomplete' : 'complete'}`}
              >
                {task.completed ? 'Geri Al' : 'Tamamla'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

