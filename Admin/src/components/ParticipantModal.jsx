import './ParticipantModal.css';

const ParticipantModal = ({ participant, onClose, alreadyCheckedIn, isGroupEvent, checkedInCount, teamMembers }) => {
  if (!participant) return null;

  return (
    <div className="participant-modal-overlay">
      <div className="participant-modal">
        <div className="participant-modal-header">
          <h2>{alreadyCheckedIn ? '✅ Already Checked In' : '✅ Check-In Successful'}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="participant-modal-content">
          {alreadyCheckedIn && (
            <div className="alert alert-warning">
              ⚠️ This participant has already been checked in.
            </div>
          )}

          {isGroupEvent && checkedInCount > 1 && (
            <div className="alert alert-success">
              🎉 Group Event: {checkedInCount} team member(s) checked in successfully!
            </div>
          )}

          <div className="participant-details">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{participant.name}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Fest ID:</span>
              <span className="detail-value fest-id">{participant.festId}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Contact:</span>
              <span className="detail-value">{participant.phone}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">College:</span>
              <span className="detail-value">{participant.college}</span>
            </div>

            {participant.events && participant.events.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Events:</span>
                <span className="detail-value">
                  {participant.events.join(', ')}
                </span>
              </div>
            )}

            {isGroupEvent && teamMembers && teamMembers.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Team Members Checked In:</span>
                <span className="detail-value">
                  {teamMembers.join(', ')}
                </span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Check-In Status:</span>
              <span className={`detail-value status ${participant.check_in ? 'checked-in' : 'not-checked-in'}`}>
                {participant.check_in ? '✓ Checked In' : '✗ Not Checked In'}
              </span>
            </div>

            {participant.check_in_time && (
              <div className="detail-row">
                <span className="detail-label">Check-In Time:</span>
                <span className="detail-value">
                  {new Date(participant.check_in_time).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <button onClick={onClose} className="confirm-btn">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantModal;
