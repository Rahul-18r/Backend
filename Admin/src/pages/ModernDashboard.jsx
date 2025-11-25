import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  UserCheck,
  TrendingUp,
  X
} from 'lucide-react';

const ModernDashboard = () => {
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    checkedIn: 0,
    notCheckedIn: 0
  });
  const [eventCounts, setEventCounts] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/participants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const participantsData = data.data.participants || data.data;
        setParticipants(participantsData);
        calculateStats(participantsData);
        calculateEventCounts(participantsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateStats = (data) => {
    const totalParticipants = data.length;
    const totalRegistrations = data.reduce((sum, p) => sum + (p.registrations?.length || 0), 0);
    const totalRevenue = data.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const checkedIn = data.filter(p => p.check_in).length;
    
    setStats({
      totalParticipants,
      totalRegistrations,
      totalRevenue,
      checkedIn,
      notCheckedIn: totalParticipants - checkedIn
    });
  };

  const calculateEventCounts = (data) => {
    const counts = {};
    data.forEach(p => {
      p.registrations?.forEach(r => {
        if (r.eventName) {
          counts[r.eventName] = (counts[r.eventName] || 0) + 1;
        }
      });
    });
    setEventCounts(counts);
  };

  const openTeamModal = (participant) => {
    // Get all events for this participant
    const participantEvents = participant.registrations?.map(reg => ({
      eventName: reg.eventName,
      teamName: reg.teamName || null,
      teamMembers: reg.teamMembers || [],
      isTeamEvent: reg.isTeamEvent
    })) || [];
    
    setSelectedTeam({
      participantName: participant.name,
      events: participantEvents
    });
  };

  const filteredParticipants = participants.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.toString().includes(searchQuery) ||
    p.college?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-purple-200">Sambhram 2025 - Participant Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Total Participants"
            value={stats.totalParticipants}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={<Calendar className="w-8 h-8" />}
            title="Event Registrations"
            value={stats.totalRegistrations}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon={<IndianRupee className="w-8 h-8" />}
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon={<UserCheck className="w-8 h-8" />}
            title="Check-in Status"
            value={`${stats.checkedIn} / ${stats.totalParticipants}`}
            subtitle={`${stats.notCheckedIn} pending`}
            color="from-orange-500 to-red-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by name, phone, or college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 transition-all"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">Name</th>
                      <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">Phone</th>
                      <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">College</th>
                      <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">Events</th>
                      <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">Actions</th>
                      <th className="text-right py-4 px-4 text-white/80 font-semibold text-sm">Amount</th>
                      <th className="text-center py-4 px-4 text-white/80 font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((participant, idx) => (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="text-white font-medium">{participant.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white/80 text-sm">{participant.phone}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white/70 text-xs max-w-[200px] truncate">
                            {participant.college}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {participant.registrations?.map((reg, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30"
                              >
                                {reg.eventName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {participant.registrations?.some(r => r.isTeamEvent) ? (
                            <button
                              onClick={() => openTeamModal(participant)}
                              className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-lg"
                            >
                              View Teams
                            </button>
                          ) : (
                            <span className="text-white/40 text-xs italic">No teams</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-green-400 font-bold">₹{participant.totalAmount || 0}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-center">
                            {participant.check_in ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Event Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Event Summary
              </h3>
              <div className="space-y-4">
                {Object.entries(eventCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([eventName, count], idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">{eventName}</h4>
                        <span className="text-purple-400 font-bold text-lg">{count}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(count / stats.totalRegistrations) * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {((count / stats.totalRegistrations) * 100).toFixed(1)}% of registrations
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-3xl w-full border-2 border-purple-500/30 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Team Details</h2>
            <p className="text-purple-300 mb-6">Participant: {selectedTeam.participantName}</p>
            
            <div className="space-y-6">
              {selectedTeam.events.map((event, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-6 border border-white/20">
                  {/* Event Name */}
                  <h3 className="text-xl font-bold text-white mb-4">{event.eventName}</h3>
                  
                  {event.isTeamEvent && event.teamName ? (
                    <>
                      {/* Team Name */}
                      <div className="mb-4">
                        <span className="text-white/60 text-sm">Team: </span>
                        <span className="text-purple-300 text-lg font-semibold">{event.teamName}</span>
                      </div>
                      
                      {/* Members */}
                      {event.teamMembers && event.teamMembers.length > 0 && (
                        <div>
                          <h4 className="text-white/60 text-sm mb-3">Members:</h4>
                          <ul className="space-y-2 ml-4">
                            {event.teamMembers.map((member, memberIdx) => (
                              <li key={memberIdx} className="flex items-start">
                                <span className="text-purple-400 mr-3">•</span>
                                <div className="flex-1">
                                  <div className="text-white font-medium">{member.name || member}</div>
                                  {member.phone && (
                                    <div className="text-white/50 text-sm">{member.phone}</div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-white/50 italic">Solo event (no team)</div>
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

const StatCard = ({ icon, title, value, subtitle, color }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:scale-105 transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/70 text-sm mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          {subtitle && <p className="text-white/50 text-xs">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
