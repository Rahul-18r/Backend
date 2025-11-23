import { useState } from 'react';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import TicketDetails from '../components/TicketDetails';
import Navbar from '../components/Navbar';

const VerifyTicket = ({ onLogout }) => {
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchQuery) => {
    setError('');
    setLoading(true);
    setTicketData(null);

    try {
      // Try to fetch by ticketUid first
      let response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/verify/ticket?ticketUid=${searchQuery}`);
      
      // If not found, try by participant ID
      if (!response.data.success) {
        response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/verify/ticket`, {
          ticketUid: searchQuery
        });
      }

      if (response.data.success) {
        setTicketData(response.data.data);
      } else {
        setError('Ticket not found. Please check the ID and try again.');
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError(err.response?.data?.message || 'Failed to fetch ticket details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Navbar onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-6xl font-extrabold text-white mb-4 font-outfit tracking-wider drop-shadow-lg">
              TICKET VERIFICATION
            </h1>
            <p className="text-white text-xl font-outfit font-light">
              Search by Ticket UID or Participant ID
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-900/40 border-2 border-red-500/60 text-white px-8 py-6 rounded-xl backdrop-blur-md animate-scale-in shadow-xl">
              <p className="font-bold font-outfit flex items-center text-lg">
                <span className="text-3xl mr-3">❌</span> Error
              </p>
              <p className="text-base mt-2 font-outfit ml-12">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-black/60 backdrop-blur-md rounded-xl p-12 text-center border-2 border-accent/30 shadow-2xl">
              <div className="inline-block w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-white font-outfit text-xl font-medium">Searching for ticket...</p>
            </div>
          )}

          {/* Ticket Details */}
          {ticketData && !loading && (
            <TicketDetails data={ticketData} />
          )}

          {/* Instructions */}
          {!ticketData && !loading && !error && (
            <div className="bg-black/50 backdrop-blur-lg rounded-xl p-8 text-white border-2 border-white/20 animate-slide-in shadow-2xl">
              <h3 className="font-bold mb-5 text-2xl font-outfit flex items-center text-accent">
                <span className="text-3xl mr-3">📝</span> Instructions:
              </h3>
              <ul className="space-y-4 text-base font-outfit">
                <li className="flex items-start pl-4">
                  <span className="text-accent mr-4 text-2xl font-bold">•</span>
                  <span className="text-white/90">Enter the <span className="font-bold text-accent">Ticket UID</span> (e.g., FEST-20251110-A3B2C1D4)</span>
                </li>
                <li className="flex items-start pl-4">
                  <span className="text-accent mr-4 text-2xl font-bold">•</span>
                  <span className="text-white/90">Or enter the <span className="font-bold text-accent">Participant MongoDB ID</span></span>
                </li>
                <li className="flex items-start pl-4">
                  <span className="text-accent mr-4 text-2xl font-bold">•</span>
                  <span className="text-white/90">Click <span className="font-bold text-accent">Search</span> or press <span className="font-bold text-accent">Enter</span></span>
                </li>
                <li className="flex items-start pl-4">
                  <span className="text-accent mr-4 text-2xl font-bold">•</span>
                  <span className="text-white/90">View complete participant and event details</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyTicket;
