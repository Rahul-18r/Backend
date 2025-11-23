import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { name: formData.name });
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          password: formData.password
        }),
      });

      console.log('Login response status:', response.status);
      
      const data = await response.json();
      console.log('Login response data:', data);

      if (data.success && data.token) {
        console.log('Login successful, storing token');
        // Clear any coordinator data first
        localStorage.removeItem('eventName');
        localStorage.removeItem('coordinatorId');
        // Set admin data
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminName', data.admin.name);
        localStorage.setItem('userRole', 'admin');
        onLogin(data.admin.name);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🎫</span>
            <h1>SAMBHRAM</h1>
          </div>
          <p className="subtitle">Admin Login Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="form-group">
            <label htmlFor="name">Admin Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your admin name"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-footer">
          <button 
            onClick={() => navigate('/coordinator-login')}
            className="switch-login-btn"
            type="button"
          >
            Event Coordinator Login →
          </button>
          <button 
            onClick={() => navigate('/registration-login')}
            className="switch-login-btn"
            type="button"
          >
            Registration Team Login →
          </button>
          <p>© 2025 Sambhram Institute of Technology</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
