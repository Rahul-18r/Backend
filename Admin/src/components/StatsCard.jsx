const StatsCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-600/40 to-blue-800/40 border-blue-400/50',
    purple: 'from-purple-600/40 to-purple-800/40 border-purple-400/50',
    green: 'from-green-600/40 to-green-800/40 border-green-400/50',
    success: 'from-emerald-600/40 to-emerald-800/40 border-emerald-400/50',
    warning: 'from-orange-600/40 to-orange-800/40 border-orange-400/50'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-md rounded-xl p-6 border-2 shadow-xl hover:scale-105 transition-transform duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-5xl">{icon}</span>
      </div>
      <h3 className="text-white/70 text-sm font-medium font-outfit uppercase tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-white text-4xl font-extrabold font-outfit">
        {value}
      </p>
    </div>
  );
};

export default StatsCard;
