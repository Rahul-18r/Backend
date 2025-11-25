import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import CoordinatorLogin from './pages/CoordinatorLogin';
import RegistrationLogin from './pages/RegistrationLogin';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import VerifyTicket from './pages/VerifyTicket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const role = localStorage.getItem('userRole');
    if (token && isLoggedIn === 'true' && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem('userRole'));
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
    setUserRole(null);
  };

  // Protected route component that checks role
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login/admin" />;
    }
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  // Login route component that prevents logged in users from accessing
  const LoginRoute = ({ children, targetRole }) => {
    if (isAuthenticated) {
      // If already logged in with different role, show error or redirect
      if (userRole !== targetRole) {
        return <Navigate to="/dashboard" />;
      }
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login/admin" 
          element={
            <LoginRoute targetRole="admin">
              <Login onLogin={handleLogin} />
            </LoginRoute>
          } 
        />
        <Route 
          path="/login/coordinator" 
          element={
            <LoginRoute targetRole="coordinator">
              <CoordinatorLogin onLogin={handleLogin} />
            </LoginRoute>
          } 
        />
        <Route 
          path="/login/registration" 
          element={
            <LoginRoute targetRole="registration">
              <RegistrationLogin onLogin={handleLogin} />
            </LoginRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/modern" 
          element={
            <ProtectedRoute>
              <ModernDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verify" 
          element={
            <ProtectedRoute>
              <VerifyTicket onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<Navigate to="/login/admin" />} />
        <Route path="*" element={<Navigate to="/login/admin" />} />
      </Routes>
    </Router>
  );
}

export default App

