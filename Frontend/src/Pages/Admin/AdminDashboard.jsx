import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchParticipants();
  }, [navigate]);

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/participants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipants(response.data.participants || []);
    } catch (err) {
      setError('Failed to fetch participants');
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="dashboard-content">
        <h2>Registered Participants</h2>
        {error && <p className="error">{error}</p>}
        <div className="participants-list">
          {participants.length === 0 ? (
            <p>No participants found.</p>
          ) : (
            participants.map((participant) => (
              <div key={participant._id} className="participant-card">
                <h3>{participant.name}</h3>
                <p><strong>USN:</strong> {participant.usn}</p>
                <p><strong>Phone:</strong> {participant.phone}</p>
                <p><strong>College:</strong> {participant.college}</p>
                <div className="registrations">
                  <h4>Registrations:</h4>
                  {participant.registrations.map((reg, index) => (
                    <div key={index} className="registration">
                      <p>Event: {reg.event_id}</p>
                      <p>Status: {reg.payment_status}</p>
                      <p>Amount: ₹{reg.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;