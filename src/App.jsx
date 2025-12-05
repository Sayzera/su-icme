import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TeamView from './components/TeamView'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  const { currentUser } = useAuth()

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
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
