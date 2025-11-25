import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import ParticipantModal from '../components/ParticipantModal';
import './Dashboard.css';

// Define event categories - MUST MATCH DATABASE EXACTLY
const individualTechnicalEvents = [
  'CODE RUSH',
  'STRATEGIC IT VISION',
  'EYES OFF! CODE ON',
  'WEBVERSE',
  'LINE QUEST',
  'ERROR EXTERMINATOR',
  'DASHING DASHBOARDS',
  'UXPERTS',
  'PROTOVIEW',
  'BOTFURY',
  'WORD2WORLD',
  'CIRCUIT CRAZE'
];

const individualCulturalEvents = [
  'YAKSHA KALARAM',
  'SHRINGAR VISMAY',
  'RUN-BHUMI',
  'LUDO SAMRAT',
  'DRISHYA MAHIMA',
  'RANG MUKHAM',
  'CHAVI-CHITHRA',
  'RANG DHARA',
  'ANIME VICHAR'
];

const groupTechnicalEvents = [
  'SHARK TANK',
  'GERBER BATTLE',
  'LUMINARY DESIGNS',
  'AQUA IGNITION',
  'FLIGHT EMBERS'
];

const groupCulturalEvents = [
  'KOHJ KSHETRA',
  'AGNI CHAKRAVYUHA',
  'VEERA SAMARA',
  'TAAL YUDHA',
  'SANGEETH SPARSH',
  'BHAVA SPHRUTHI',
  'NRITHYA PARVA',
  'SHAKTHI SANGRAM'
];

// Combine all events
const individualEvents = [...individualTechnicalEvents, ...individualCulturalEvents];
const groupEvents = [...groupTechnicalEvents, ...groupCulturalEvents];

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [participationType, setParticipationType] = useState('all'); // individual or group
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [availableEvents, setAvailableEvents] = useState({ individual: [], group: [] });
  const [showScanner, setShowScanner] = useState(false);
  const [scannedParticipant, setScannedParticipant] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState({ type: '', text: '' });
  const [groupCheckInData, setGroupCheckInData] = useState({ isGroupEvent: false, checkedInCount: 0, teamMembers: [] });
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedParticipantTeams, setSelectedParticipantTeams] = useState(null);
  
  // Get user role and event info
  const userRole = localStorage.getItem('userRole') || 'admin';
  const coordinatorEventName = localStorage.getItem('eventName');
  const coordinatorName = localStorage.getItem('adminName');
  const isCoordinator = userRole === 'coordinator';
  const isRegistration = userRole === 'registration';

  useEffect(() => {
    fetchParticipants();
    
    // Auto-refresh every 10 seconds to catch new transactions immediately
    const interval = setInterval(() => {
      console.log('Auto-refreshing participants...');
      fetchParticipants(true); // silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [searchTerm, filterBy, participationType, participants]);

  const fetchParticipants = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');

      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching participants from backend...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/participants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('Successfully fetched', data.participants?.length, 'participants');
        setParticipants(data.participants || []);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch:', data.message);
        throw new Error(data.message || 'Failed to fetch participants');
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        console.log('Unauthorized, logging out...');
        handleLogout();
      } else {
        if (!silent) {
          setError(err.message || 'Unable to load participants. Please try again.');
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // For coordinators: search only by name
    if (isCoordinator) {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
          p.name?.toLowerCase().includes(searchLower)
        );
      }
      setFilteredParticipants(filtered);
      return;
    }

    // For admin: full search and filtering
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.usn?.toLowerCase().includes(searchLower) ||
        p.phone?.toString().includes(searchTerm) ||
        p.college?.toLowerCase().includes(searchLower) ||
        p.ticketUid?.toLowerCase().includes(searchLower) ||
        p.registrations?.some(r => 
          r.eventName?.toLowerCase().includes(searchLower) ||
          r.teamCode?.toLowerCase().includes(searchLower) ||
          r.teamMemberName?.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply participation type filter (individual vs group)
    if (participationType !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.registrations || p.registrations.length === 0) return false;
        
        if (participationType === 'individual') {
          // Check if any registration is for an individual event
          return p.registrations.some(r => 
            r.eventName && individualEvents.some(event => 
              event.toLowerCase() === r.eventName.toLowerCase()
            )
          );
        } else if (participationType === 'group') {
          // Check if any registration is for a group event
          return p.registrations.some(r => 
            r.eventName && groupEvents.some(event => 
              event.toLowerCase() === r.eventName.toLowerCase()
            )
          );
        }
        return true;
      });
    }

    // Apply event filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.registrations || p.registrations.length === 0) return false;
        return p.registrations.some(r => 
          r.eventName && r.eventName.toLowerCase() === filterBy.toLowerCase()
        );
      });
    }

    setFilteredParticipants(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminName');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const openTeamModal = (participant) => {
    // For coordinators: only show their event's team details
    const eventsToShow = isCoordinator && coordinatorEventName
      ? participant.registrations?.filter(r => 
          r.eventName?.toLowerCase() === coordinatorEventName.toLowerCase()
        )
      : participant.registrations;

    setSelectedParticipantTeams({
      name: participant.name,
      events: eventsToShow || []
    });
    setShowTeamModal(true);
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedParticipantTeams(null);
  };

  const handleQRScan = async (festId) => {
    setShowScanner(false);
    setCheckInMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');

      // Check in the participant
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ festId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setScannedParticipant(data.participant);
        setGroupCheckInData({
          isGroupEvent: data.isGroupEvent || false,
          checkedInCount: data.checkedInCount || 1,
          teamMembers: data.teamMembers || []
        });
        setShowParticipantModal(true);
        
        // Refresh participant list
        fetchParticipants(true);

        if (data.alreadyCheckedIn) {
          setCheckInMessage({ 
            type: 'warning', 
            text: 'Participant already checked in' 
          });
        } else if (data.isGroupEvent && data.checkedInCount > 1) {
          setCheckInMessage({ 
            type: 'success', 
            text: `✅ ${data.checkedInCount} team member(s) checked in!` 
          });
        } else {
          setCheckInMessage({ 
            type: 'success', 
            text: 'Check-in successful!' 
          });
        }
      } else {
        setCheckInMessage({ 
          type: 'error', 
          text: data.message || 'Failed to check in participant' 
        });
        // Show error for 3 seconds
        setTimeout(() => setCheckInMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setCheckInMessage({ 
        type: 'error', 
        text: 'Unable to connect. Please try again.' 
      });
      setTimeout(() => setCheckInMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="dashboard-container">
      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner 
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleQRScan}
        />
      )}

      {/* Participant Details Modal */}
      {showParticipantModal && scannedParticipant && (
        <ParticipantModal
          participant={scannedParticipant}
          onClose={() => {
            setShowParticipantModal(false);
            setScannedParticipant(null);
            setGroupCheckInData({ isGroupEvent: false, checkedInCount: 0, teamMembers: [] });
          }}
          alreadyCheckedIn={checkInMessage.type === 'warning'}
          isGroupEvent={groupCheckInData.isGroupEvent}
          checkedInCount={groupCheckInData.checkedInCount}
          teamMembers={groupCheckInData.teamMembers}
        />
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>🎫 {isCoordinator ? `${coordinatorEventName} - Participants Dashboard` : isRegistration ? 'Registration Check-In Portal' : 'Participants Dashboard'}</h1>
          {isCoordinator && (
            <p style={{fontSize: '14px', color: '#6b7280', marginTop: '4px'}}>
              Coordinator: {coordinatorName}
            </p>
          )}
          {isRegistration && (
            <p style={{fontSize: '14px', color: '#6b7280', marginTop: '4px'}}>
              Registration Team Member
            </p>
          )}
        </div>
        <div className="header-actions">
          {isRegistration && (
            <button 
              onClick={() => setShowScanner(true)} 
              className="scan-qr-btn"
            >
              📷 Scan QR
            </button>
          )}
          <button 
            onClick={() => fetchParticipants(false)} 
            className="refresh-btn" 
            disabled={loading || refreshing}
          >
            {loading || refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Check-in Message */}
      {checkInMessage.text && (
        <div className={`check-in-message ${checkInMessage.type}`}>
          {checkInMessage.text}
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-content">
        
        {/* Search and Filter Bar */}
        <div className="controls-bar">
          <input
            type="text"
            className="search-input"
            placeholder={isCoordinator ? "Search by participant name..." : "Search by name, phone, college, ticket ID, or event..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Show filters only for admin */}
          {!isCoordinator && (
            <>
              {/* Participation Type Filter */}
              <select 
                className="filter-select"
                value={participationType}
                onChange={(e) => {
                  setParticipationType(e.target.value);
                  setFilterBy('all'); // Reset event filter when changing type
                }}
              >
                <option value="all">All Types</option>
                <option value="individual">Individual Events</option>
                <option value="group">Group Events</option>
              </select>
              
              {/* Event Filter - Shows events based on participation type */}
              <select 
                className="filter-select"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Events</option>
                
                {participationType === 'all' && (
                  <>
                    <optgroup label="Individual - Technical">
                      {individualTechnicalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Individual - Cultural">
                      {individualCulturalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Group - Technical">
                      {groupTechnicalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Group - Cultural">
                      {groupCulturalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                  </>
                )}

                {participationType === 'individual' && (
                  <>
                    <optgroup label="Technical Events">
                      {individualTechnicalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cultural Events">
                      {individualCulturalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                  </>
                )}

                {participationType === 'group' && (
                  <>
                    <optgroup label="Technical Events">
                      {groupTechnicalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cultural Events">
                      {groupCulturalEvents.map(event => (
                        <option key={event} value={event}>{event}</option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </>
          )}
        </div>

        {/* Results Count */}
        <div className="results-info">
          <span>
            Showing {filteredParticipants.length} of {participants.length} participants
          </span>
          {lastUpdated && (
            <span className="last-updated">
              {' • '}Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {refreshing && (
            <span className="refreshing-indicator">
              {' • '}🔄 Syncing...
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading participants...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={fetchParticipants} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Participants Table */}
        {!loading && !error && (
          <div className="table-container">
            {filteredParticipants.length > 0 ? (
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>College</th>
                    <th>Ticket ID</th>
                    {!isRegistration && <th>Events</th>}
                    {!isRegistration && <th>Actions</th>}
                    {!isRegistration && <th>Amount</th>}
                    <th>Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant, index) => {
                    const totalAmount = participant.registrations?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
                    
                    // Get team events
                    let teamEvents = participant.registrations?.filter(r => r.isTeamEvent) || [];
                    
                    // For coordinators: filter to show only their event's team members
                    if (isCoordinator && coordinatorEventName) {
                      teamEvents = teamEvents.filter(r => 
                        r.eventName && r.eventName.toLowerCase() === coordinatorEventName.toLowerCase()
                      );
                    }
                    
                    return (
                      <tr key={participant._id || index}>
                        <td>{participant.name || 'N/A'}</td>
                        <td>{participant.phone || 'N/A'}</td>
                        <td>{participant.college || 'N/A'}</td>
                        <td className="ticket-id">{participant.ticketUid || 'N/A'}</td>
                        {!isRegistration && (
                          <td className="events-list">
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                              {(isCoordinator 
                                ? participant.registrations?.filter(r => r.eventName?.toLowerCase() === coordinatorEventName?.toLowerCase())
                                : participant.registrations
                              )?.map((reg, i) => (
                                <span
                                  key={i}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    borderRadius: '4px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    border: '1px solid #93c5fd',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {reg.eventName}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}
                        {!isRegistration && (
                          <td>
                            {teamEvents.length > 0 ? (
                              <button
                                onClick={() => openTeamModal(participant)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  background: '#9333ea',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#7e22ce'}
                                onMouseOut={(e) => e.target.style.background = '#9333ea'}
                              >
                                View Teams
                              </button>
                            ) : (
                              <span style={{fontSize: '12px', color: '#9ca3af', fontStyle: 'italic'}}>No teams</span>
                            )}
                          </td>
                        )}
                        {!isRegistration && <td>₹{totalAmount.toLocaleString()}</td>}
                        <td className="check-in-status">
                          {participant.check_in ? (
                            <span className="status-badge checked-in">✓ Checked In</span>
                          ) : (
                            <span className="status-badge not-checked-in">✗ Not Checked In</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-results">
                <p>No participants found</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Team Details Modal */}
      {showTeamModal && selectedParticipantTeams && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #581c87 100%)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid rgba(147, 51, 234, 0.3)',
            position: 'relative'
          }}>
            <button
              onClick={closeTeamModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              ✕
            </button>

            <h2 style={{color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px'}}>Team Details</h2>
            <p style={{color: '#d8b4fe', marginBottom: '24px'}}>Participant: {selectedParticipantTeams.name}</p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              {selectedParticipantTeams.events.map((event, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <h3 style={{color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px'}}>
                    {event.eventName}
                  </h3>

                  {event.isTeamEvent && event.teamName ? (
                    <>
                      <div style={{marginBottom: '16px'}}>
                        <span style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px'}}>Team: </span>
                        <span style={{color: '#d8b4fe', fontSize: '18px', fontWeight: '600'}}>{event.teamName}</span>
                      </div>

                      {event.teamMembers && event.teamMembers.length > 0 && (
                        <div>
                          <h4 style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '12px'}}>Members:</h4>
                          <ul style={{marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {event.teamMembers.map((member, memberIdx) => (
                              <li key={memberIdx} style={{display: 'flex', alignItems: 'start'}}>
                                <span style={{color: '#a78bfa', marginRight: '12px'}}>•</span>
                                <div style={{flex: 1}}>
                                  <div style={{color: 'white', fontWeight: '500'}}>
                                    {typeof member === 'string' ? member : (member.name || 'N/A')}
                                  </div>
                                  {typeof member === 'object' && member.phone && (
                                    <div style={{color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px'}}>{member.phone}</div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic'}}>Solo event (no team)</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
