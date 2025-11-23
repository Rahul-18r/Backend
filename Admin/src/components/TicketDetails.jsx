const TicketDetails = ({ data }) => {
  const { ticketUid, participantInfo, registrations, totalEvents, verifiedAt } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success Badge */}
      <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 border-4 border-green-400 rounded-2xl p-8 backdrop-blur-lg shadow-2xl">
        <div className="flex items-center justify-center space-x-4">
          <span className="text-7xl animate-scale-in">✅</span>
          <div>
            <h2 className="text-4xl font-extrabold text-green-300 font-outfit tracking-wide">VALID TICKET</h2>
            <p className="text-green-200 text-lg font-outfit mt-1">Ticket verified successfully</p>
          </div>
        </div>
      </div>

      {/* Ticket UID */}
      <div className="bg-gradient-to-br from-primary via-primary to-secondary text-white rounded-2xl p-8 text-center shadow-2xl border-2 border-accent/30">
        <p className="text-sm font-bold opacity-90 mb-3 font-outfit uppercase tracking-widest text-accent">Ticket UID</p>
        <p className="text-3xl font-extrabold tracking-widest font-mono break-all">{ticketUid}</p>
      </div>

      {/* Participant Info */}
      <div className="bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-white/20">
        <h3 className="text-3xl font-extrabold text-white mb-6 flex items-center font-outfit">
          <span className="mr-4 text-5xl">👤</span>
          PARTICIPANT INFORMATION
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow label="Name" value={participantInfo.name} />
          <InfoRow label="USN" value={participantInfo.usn} />
          <InfoRow label="Phone" value={participantInfo.phone} />
          <InfoRow label="College" value={participantInfo.college} />
        </div>
      </div>

      {/* Events Registered */}
      <div className="bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-white/20">
        <h3 className="text-3xl font-extrabold text-white mb-6 flex items-center font-outfit">
          <span className="mr-4 text-5xl">🎯</span>
          REGISTERED EVENTS <span className="ml-3 text-accent">({totalEvents})</span>
        </h3>
        <div className="space-y-5">
          {registrations.map((reg, index) => (
            <EventCard key={index} registration={reg} index={index} />
          ))}
        </div>
      </div>

      {/* Verification Info */}
      <div className="bg-white/10 rounded-xl p-5 text-center text-base text-white border-2 border-white/20 backdrop-blur-md font-outfit">
        <p className="font-medium">✓ Verified at: <span className="text-accent font-bold">{new Date(verifiedAt).toLocaleString()}</span></p>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="bg-black/30 rounded-lg p-5 border border-white/20 hover:border-accent/50 transition-all">
    <span className="block font-bold text-accent text-sm mb-2 font-outfit uppercase tracking-wide">{label}</span>
    <span className="block font-bold text-white text-lg font-outfit">{value}</span>
  </div>
);

const EventCard = ({ registration, index }) => {
  const { eventDetails, amount, payment_status, registration_date } = registration;

  return (
    <div className="border-l-8 border-accent bg-gradient-to-r from-black/40 to-black/20 p-6 rounded-r-2xl backdrop-blur-md hover:from-black/60 hover:to-black/40 transition-all shadow-xl group">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <span className="text-accent font-extrabold text-2xl mr-3 font-outfit">#{index + 1}</span>
            <h4 className="font-extrabold text-2xl text-white font-outfit group-hover:text-accent transition-colors">
              {eventDetails?.eventName || 'Event Name'}
            </h4>
          </div>
          {eventDetails && (
            <div className="space-y-3 text-base font-outfit">
              <p className="flex items-center text-white/90">
                <span className="mr-3 text-xl">📍</span> 
                <span className="font-semibold text-accent/90 min-w-[80px]">Venue:</span>
                <span className="ml-2 text-white">{eventDetails.venue}</span>
              </p>
              <p className="flex items-center text-white/90">
                <span className="mr-3 text-xl">📅</span>
                <span className="font-semibold text-accent/90 min-w-[80px]">Date:</span>
                <span className="ml-2 text-white">{new Date(eventDetails.date).toLocaleDateString()}</span>
              </p>
              <p className="flex items-center text-white/90">
                <span className="mr-3 text-xl">🕐</span>
                <span className="font-semibold text-accent/90 min-w-[80px]">Time:</span>
                <span className="ml-2 text-white">{eventDetails.time}</span>
              </p>
              <p className="flex items-center text-white/90">
                <span className="mr-3 text-xl">🎯</span>
                <span className="font-semibold text-accent/90 min-w-[80px]">Type:</span>
                <span className="ml-2 text-white">{eventDetails.eventType}</span>
              </p>
            </div>
          )}
        </div>
        <div className="text-center lg:text-right w-full lg:w-auto bg-black/40 rounded-xl p-5 border-2 border-accent/30">
          <div className="bg-green-500/30 text-green-300 px-5 py-3 rounded-full text-base font-extrabold mb-4 inline-block border-2 border-green-400/50 font-outfit uppercase tracking-wide">
            {payment_status === 'paid' ? '✓ PAID' : payment_status.toUpperCase()}
          </div>
          <p className="text-4xl font-extrabold text-accent mb-2 font-outfit">₹{amount}</p>
          <p className="text-sm text-white/60 font-outfit font-medium">
            Registered: {new Date(registration_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
