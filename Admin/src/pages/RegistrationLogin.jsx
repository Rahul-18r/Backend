import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const RegistrationLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/registration-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminName', data.user.name);
        localStorage.setItem('userRole', 'registration');
        localStorage.setItem('username', data.user.username);

        console.log('Registration team login successful:', data.user);

        if (onLogin) onLogin();
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>📋 Registration Team Login</h1>
          <p>Participant Check-In Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., reg1, reg2, reg3, reg4, reg5"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <button 
            onClick={() => navigate('/login')}
            className="switch-login-btn"
          >
            Admin Login →
          </button>
          <button 
            onClick={() => navigate('/coordinator-login')}
            className="switch-login-btn"
          >
            Coordinator Login →
          </button>
          <p>© 2025 Sambhram Institute of Technology</p>
        </div>

        <div className="example-credentials">
          <h4>Example Usernames:</h4>
          <p>reg1, reg2, reg3, reg4, or reg5</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationLogin;
