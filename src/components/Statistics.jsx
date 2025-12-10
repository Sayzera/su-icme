import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import './Statistics.css';

const Statistics = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [completedTasks, setCompletedTasks] = useState(0);
  const [dailyTasks, setDailyTasks] = useState(0);
  const [weeklyTasks, setWeeklyTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalWater, setTotalWater] = useState(0); // ml cinsinden
  const [dailyWater, setDailyWater] = useState(0); // ml cinsinden
  const [weeklyWater, setWeeklyWater] = useState(0); // ml cinsinden

  // Bugünün tarihini al
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Haftalık tarih aralığını al (son 7 gün)
  const getWeeklyDateRange = () => {
    const today = getTodayDate();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { start: weekAgo, end: today };
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const today = getTodayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { start: weekStart, end: weekEnd } = getWeeklyDateRange();
    const weekEndTomorrow = new Date(weekEnd);
    weekEndTomorrow.setDate(weekEndTomorrow.getDate() + 1);

    const tasksRef = collection(db, 'tasks');

    // Tüm tamamlanan görevler
    const allTasksQuery = query(
      tasksRef,
      where('userId', '==', currentUser.uid),
      where('completed', '==', true)
    );

    // Bugünün tamamlanan görevleri
    const dailyTasksQuery = query(
      tasksRef,
      where('userId', '==', currentUser.uid),
      where('completed', '==', true),
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<', Timestamp.fromDate(tomorrow))
    );

    // Son 7 günün tamamlanan görevleri
    const weeklyTasksQuery = query(
      tasksRef,
      where('userId', '==', currentUser.uid),
      where('completed', '==', true),
      where('date', '>=', Timestamp.fromDate(weekStart)),
      where('date', '<', Timestamp.fromDate(weekEndTomorrow))
    );

    // Tüm görevler
    const unsubscribeAll = onSnapshot(allTasksQuery, (snapshot) => {
      const tasksCount = snapshot.docs.length;
      const totalWaterML = tasksCount * 500;
      setCompletedTasks(tasksCount);
      setTotalWater(totalWaterML);
    }, (error) => {
      console.error('Tüm görevler yükleme hatası:', error);
    });

    // Günlük görevler
    const unsubscribeDaily = onSnapshot(dailyTasksQuery, (snapshot) => {
      const tasksCount = snapshot.docs.length;
      const dailyWaterML = tasksCount * 500;
      setDailyTasks(tasksCount);
      setDailyWater(dailyWaterML);
      setLoading(false);
    }, (error) => {
      console.error('Günlük görevler yükleme hatası:', error);
      setLoading(false);
    });

    // Haftalık görevler
    const unsubscribeWeekly = onSnapshot(weeklyTasksQuery, (snapshot) => {
      const tasksCount = snapshot.docs.length;
      const weeklyWaterML = tasksCount * 500;
      setWeeklyTasks(tasksCount);
      setWeeklyWater(weeklyWaterML);
    }, (error) => {
      console.error('Haftalık görevler yükleme hatası:', error);
    });

    return () => {
      unsubscribeAll();
      unsubscribeDaily();
      unsubscribeWeekly();
    };
  }, [currentUser]);

  // İstatistikleri hesapla
  const halfLiterCount = completedTasks; // Her task = 0.5L
  const oneLiterCount = Math.floor(completedTasks / 2); // 2 task = 1L
  const damacanaCount = Math.floor(completedTasks / 38); // 38 task = 19L (1 damacana)
  const totalWaterLiters = (totalWater / 1000).toFixed(2); // L cinsinden
  const dailyWaterLiters = (dailyWater / 1000).toFixed(2); // L cinsinden
  const weeklyWaterLiters = (weeklyWater / 1000).toFixed(2); // L cinsinden

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <header className="statistics-header">
        <div>
          <h1>📊 Su İçme İstatistikleri</h1>
          <p className="user-email">{currentUser?.email}</p>
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate('/team')} className="back-btn">
            ← Takım Görünümü
          </button>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Ana Sayfa
          </button>
          <button onClick={logout} className="logout-btn">
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="statistics-content">
        <div className="period-stats-grid">
          <div className="period-stat-card">
            <h3>📅 Günlük</h3>
            <div className="period-water-amount">
              <span className="period-water-value">{dailyWaterLiters}</span>
              <span className="period-water-unit">L</span>
            </div>
            <p className="period-tasks">{dailyTasks} görev tamamlandı</p>
          </div>

          <div className="period-stat-card">
            <h3>📆 Haftalık</h3>
            <div className="period-water-amount">
              <span className="period-water-value">{weeklyWaterLiters}</span>
              <span className="period-water-unit">L</span>
            </div>
            <p className="period-tasks">{weeklyTasks} görev tamamlandı</p>
          </div>

          <div className="period-stat-card">
            <h3>🌍 Toplam</h3>
            <div className="period-water-amount">
              <span className="period-water-value">{totalWaterLiters}</span>
              <span className="period-water-unit">L</span>
            </div>
            <p className="period-tasks">{completedTasks} görev tamamlandı</p>
          </div>
        </div>

        <div className="total-water-card">
          <h2>Toplam İçilen Su</h2>
          <div className="total-water-amount">
            <span className="water-value">{totalWaterLiters}</span>
            <span className="water-unit">Litre</span>
          </div>
          <p className="total-tasks">Tamamlanan Görev: {completedTasks}</p>
        </div>

        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-icon">🥤</div>
            <div className="stat-info">
              <h3>{halfLiterCount}</h3>
              <p>0.5 Litrelik Su</p>
              <span className="stat-subtitle">(500ml)</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <div className="stat-info">
              <h3>{oneLiterCount}</h3>
              <p>1 Litrelik Su</p>
              <span className="stat-subtitle">(1000ml)</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🚰</div>
            <div className="stat-info">
              <h3>{damacanaCount}</h3>
              <p>Damacana</p>
              <span className="stat-subtitle">(19 Litre)</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>ℹ️ Bilgi</h3>
          <p>Her tamamlanan görev 500ml (0.5 litre) suya eşittir.</p>
          <ul>
            <li>1 görev = 0.5 litre</li>
            <li>2 görev = 1 litre</li>
            <li>38 görev = 1 damacana (19 litre)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Statistics;

