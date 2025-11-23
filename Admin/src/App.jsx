import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import CoordinatorLogin from './pages/CoordinatorLogin';
import RegistrationLogin from './pages/RegistrationLogin';
import Dashboard from './pages/Dashboard';
import VerifyTicket from './pages/VerifyTicket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (admin or coordinator)
    const token = localStorage.getItem('adminToken');
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (token && isLoggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('eventName');
    localStorage.removeItem('coordinatorId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/coordinator-login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <CoordinatorLogin onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/registration-login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <RegistrationLogin onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
            <Dashboard onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/verify" 
          element={
            isAuthenticated ? 
            <VerifyTicket onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App

