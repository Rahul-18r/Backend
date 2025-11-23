import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ onLogout }) => {
  const coordinatorId = localStorage.getItem('coordinatorId');
  const location = useLocation();

  return (
    <nav className="bg-black backdrop-blur-md shadow-lg border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <span className="text-4xl">🎫</span>
            <div>
              <h1 className="text-white font-bold text-2xl font-outfit tracking-wider">SAMBHRAM ADMIN</h1>
              <p className="text-accent text-xs font-outfit">Verification Portal</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`font-outfit font-bold text-base transition-colors ${
                location.pathname === '/dashboard'
                  ? 'text-accent'
                  : 'text-white hover:text-accent'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/verify"
              className={`font-outfit font-bold text-base transition-colors ${
                location.pathname === '/verify'
                  ? 'text-accent'
                  : 'text-white hover:text-accent'
              }`}
            >
              🔍 Verify Ticket
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <p className="text-accent text-base font-bold font-outfit">{coordinatorId}</p>
              <p className="text-white/70 text-xs font-outfit">Coordinator</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-accent hover:bg-accent/90 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/50 font-outfit uppercase tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
