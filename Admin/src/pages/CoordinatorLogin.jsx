import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const CoordinatorLogin = ({ onLogin }) => {
  const [coordinatorId, setCoordinatorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/coordinator-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coordinatorId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear any admin-specific data first
        // Store coordinator info
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminName', data.coordinator.name);
        localStorage.setItem('userRole', 'coordinator');
        localStorage.setItem('eventName', data.coordinator.eventName);
        localStorage.setItem('coordinatorId', data.coordinator.coordinatorId);

        console.log('Coordinator login successful:', data.coordinator);

        if (onLogin) onLogin();
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your coordinator ID.');
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
          <h1>🎯 Coordinator Login</h1>
          <p>Event Coordinator Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="coordinatorId">Coordinator ID</label>
            <input
              type="text"
              id="coordinatorId"
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(e.target.value)}
              placeholder="e.g., jaya_E18"
              required
              disabled={loading}
            />
            <small className="input-hint">Format: username_E## (e.g., jaya_E18)</small>
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
        </div>

        <div className="example-credentials">
          <h4>Example Credentials:</h4>
          <p><strong>Jayasagar (VEERA SAMARA)</strong></p>
          <p>ID: jaya_E18</p>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorLogin;
