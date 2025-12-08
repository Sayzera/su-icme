import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { Range } from "react-range";
import './Dashboard.css';
import TaskCard from './TaskCard';

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
        <TaskCard todayTasks={todayTasks} handleTaskToggle={handleTaskToggle} />
      </div>
    </div>
  );
};

export default Dashboard;

