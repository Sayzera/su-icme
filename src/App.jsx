import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TeamView from './components/TeamView'
import Statistics from './components/Statistics'
import PrivateRoute from './components/PrivateRoute'
import { requestNotificationPermission } from './services/notificationService'
import './App.css'

function App() {
  const { currentUser } = useAuth()

  // Uygulama yüklendiğinde notification izni iste
  useEffect(() => {
    // Kullanıcı giriş yaptıktan sonra izin iste
    if (currentUser) {
      requestNotificationPermission().then(permission => {
        if (permission) {
          console.log('Bildirim izni verildi');
        } else {
          console.log('Bildirim izni reddedildi veya verilmedi');
        }
      });
    }
  }, [currentUser])

  return (
    <Routes>
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/team" 
        element={
          <PrivateRoute>
            <TeamView />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/statistics" 
        element={
          <PrivateRoute>
            <Statistics />
          </PrivateRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
