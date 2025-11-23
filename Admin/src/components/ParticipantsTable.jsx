import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const ParticipantsTable = ({ participants, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Filter and search participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      const matchesSearch = 
        participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.usn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.phone.includes(searchTerm) ||
        participant.ticketUid?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterStatus === 'all' ||
        (filterStatus === 'paid' && participant.registrations.some(r => r.payment_status === 'paid')) ||
        (filterStatus === 'pending' && participant.registrations.some(r => r.payment_status !== 'paid'));

      return matchesSearch && matchesFilter;
    });
  }, [participants, searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (ticketUid) => {
    navigate(`/verify?id=${ticketUid}`);
  };

  return (
    <div className="bg-black/60 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden">
      {/* Table Header */}
      <div className="bg-black/80 p-6 border-b border-white/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white font-outfit flex items-center">
              <span className="text-4xl mr-3">📋</span>
              PARTICIPANTS LIST
            </h2>
            <p className="text-white/60 text-sm font-outfit mt-1">
              Total: {filteredParticipants.length} participants
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRefresh}
              className="bg-accent hover:bg-accent/90 text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/50 font-outfit"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, USN, phone, or ticket UID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-white placeholder-white/50 font-outfit"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-6 py-3 bg-black/40 border-2 border-white/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-white font-outfit cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/60">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                #
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Ticket UID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                USN
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                College
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Events
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Team Events
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-accent uppercase tracking-wider font-outfit">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {paginatedParticipants.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center">
                  <div className="text-white/60 font-outfit">
                    <p className="text-6xl mb-4">📭</p>
                    <p className="text-xl">No participants found</p>
                    <p className="text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedParticipants.map((participant, index) => {
                const paidRegistrations = participant.registrations.filter(r => r.payment_status === 'paid');
                const hasPaidRegistrations = paidRegistrations.length > 0;
                const teamRegistrations = participant.registrations.filter(r => r.isTeamEvent);
                const teamInfo = teamRegistrations.length > 0
                  ? teamRegistrations.map(r => {
                      const teamName = r.teamName ? `[${r.teamName}] ` : '';
                      const memberName = r.teamMemberName || 'N/A';
                      return `${teamName}${memberName}`;
                    }).filter(Boolean).join(', ')
                  : 'Solo Events';

                return (
                  <tr
                    key={participant._id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(participant.ticketUid || participant._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70 font-outfit">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white font-bold">
                      {participant.ticketUid || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-outfit font-medium">
                      {participant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80 font-outfit">
                      {participant.usn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80 font-outfit">
                      {participant.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/80 font-outfit max-w-xs truncate">
                      {participant.college}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-outfit">
                      <span className="bg-accent/20 text-accent px-3 py-1 rounded-full font-bold border border-accent/50">
                        {participant.registrations.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70 font-outfit max-w-xs">
                      <span className="text-xs italic" title={teamInfo}>
                        {teamInfo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-outfit">
                      {hasPaidRegistrations ? (
                        <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-bold border border-green-400/50">
                          ✓ Paid
                        </span>
                      ) : (
                        <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full font-bold border border-orange-400/50">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-outfit">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(participant.ticketUid || participant._id);
                        }}
                        className="bg-accent/20 hover:bg-accent/30 text-accent font-bold px-4 py-2 rounded-lg transition-all border border-accent/50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-black/60 px-6 py-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60 font-outfit">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length} participants
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-black/40 border border-white/30 text-white rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed font-outfit"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-accent/20 border border-accent/50 text-accent rounded-lg font-bold font-outfit">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-black/40 border border-white/30 text-white rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed font-outfit"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsTable;
