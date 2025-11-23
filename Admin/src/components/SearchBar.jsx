import { useState } from 'react';

const SearchBar = ({ onSearch, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-lg rounded-xl shadow-2xl p-8 border-2 border-accent/30">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Ticket UID or Participant ID"
            className="w-full px-6 py-4 bg-black/40 border-2 border-white/30 rounded-xl focus:ring-4 focus:ring-accent/50 focus:border-accent outline-none text-xl text-white placeholder-white/50 font-outfit transition-all shadow-inner"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="bg-accent hover:bg-accent/90 text-black font-extrabold px-10 py-4 rounded-xl text-lg hover:shadow-2xl hover:shadow-accent/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-outfit uppercase tracking-widest"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            '🔍 SEARCH'
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
