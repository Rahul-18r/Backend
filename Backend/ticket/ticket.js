// Get ticket ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id');

const API_URL = 'http://localhost:5000/api/admin';

async function fetchParticipantData(ticketId) {
  try {
    const response = await fetch(`${API_URL}/participant/${ticketId}`);
    if (!response.ok) {
      throw new Error('Participant not found');
    }
    const data = await response.json();
    return data.participant;
  } catch (error) {
    console.error('Error fetching participant:', error);
    throw error;
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('/');
  if (parts.length !== 3) return dateString;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = parts[0];
  const month = months[parseInt(parts[1]) - 1];
  const year = parts[2];
  return `${month} ${day}, ${year}`;
}

function getStartTime(timeString) {
  if (!timeString) return '';
  const parts = timeString.split(/–|—|-/);
  return (parts[0] || timeString).trim();
}

function renderEvent(event) {
  const li = document.createElement('li');

  const title = document.createElement('span');
  title.className = 'ev-name';
  title.textContent = event.eventName || 'Unknown Event';

  const meta = document.createElement('span');
  meta.className = 'ev-meta';
  
  const dateSpan = document.createElement('span');
  dateSpan.className = 'ev-date';
  dateSpan.textContent = formatDate(event.date);
  
  const dot = document.createElement('span');
  dot.textContent = '•';
  
  const timeSpan = document.createElement('span');
  timeSpan.className = 'ev-time';
  timeSpan.textContent = getStartTime(event.time);
  
  meta.append(dateSpan, dot, timeSpan);
  li.append(title, meta);

  // Add team information if it's a team event
  if (event.isTeamEvent && (event.teamName || event.teamMemberName)) {
    const team = document.createElement('div');
    team.className = 'team';

    if (event.teamName) {
      const teamNameEl = document.createElement('div');
      teamNameEl.className = 'team-name';
      teamNameEl.textContent = event.teamName;
      team.appendChild(teamNameEl);
    }

    if (event.teamMemberName) {
      const teamPeople = document.createElement('div');
      teamPeople.className = 'team-people';
      
      const person = document.createElement('div');
      person.className = event.teamRole === 'Lead' ? 'person leader' : 'person';
      person.textContent = event.teamMemberName;
      
      teamPeople.appendChild(person);
      team.appendChild(teamPeople);
    }

    li.appendChild(team);
  }

  return li;
}

async function loadTicket() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const ticketEl = document.getElementById('ticket');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!ticketId) {
    loadingEl.style.display = 'none';
    errorEl.textContent = 'No ticket ID provided. Please use ?id=YOUR_TICKET_ID in the URL.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const participant = await fetchParticipantData(ticketId);

    // Populate participant name
    document.getElementById('p-name').textContent = (participant.name || 'Unknown').toUpperCase();
    
    // Populate ticket ID
    document.getElementById('ticket-id').textContent = `ID: ${participant.ticketUid || participant.order_id || ticketId}`;
    
    // Populate amount
    const amount = participant.amount || participant.totalAmount || 0;
    document.getElementById('amount-value').textContent = `₹${amount}`;

    // Generate QR code
    const qrImg = document.getElementById('qr');
    const qrData = participant.ticketUid || participant.order_id || ticketId;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    qrImg.alt = `QR Code for ${qrData}`;

    // Render events
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    
    if (participant.registrations && participant.registrations.length > 0) {
      participant.registrations.forEach(event => {
        eventsList.appendChild(renderEvent(event));
      });
    } else {
      eventsList.innerHTML = '<li><span class="ev-name">No events registered</span></li>';
    }

    // Show ticket and download button
    loadingEl.style.display = 'none';
    ticketEl.style.display = 'block';
    downloadBtn.style.display = 'block';

  } catch (error) {
    loadingEl.style.display = 'none';
    errorEl.textContent = `Error loading ticket: ${error.message}`;
    errorEl.style.display = 'block';
  }
}

// Load ticket on page load
loadTicket();
