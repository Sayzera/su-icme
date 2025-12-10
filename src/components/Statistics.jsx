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
  const [loading, setLoading] = useState(true);
  const [totalWater, setTotalWater] = useState(0); // ml cinsinden

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Tüm tamamlanan görevleri çek (sadece mevcut kullanıcının)
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', currentUser.uid),
      where('completed', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksCount = snapshot.docs.length;
      // Her task = 500ml
      const totalWaterML = tasksCount * 500;
      
      setCompletedTasks(tasksCount);
      setTotalWater(totalWaterML);
      setLoading(false);
    }, (error) => {
      console.error('Firestore snapshot hatası:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // İstatistikleri hesapla
  const halfLiterCount = completedTasks; // Her task = 0.5L
  const oneLiterCount = Math.floor(completedTasks / 2); // 2 task = 1L
  const damacanaCount = Math.floor(completedTasks / 38); // 38 task = 19L (1 damacana)
  const totalWaterLiters = (totalWater / 1000).toFixed(2); // L cinsinden

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

