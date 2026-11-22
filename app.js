(() => {
  'use strict';

  const AVATARS = [
    { id: 'mira', name: 'Mira', skin: '#d99a70', hair: '#49342d', shirt: '#e5a658', bg: '#f6e3bb', style: 'curly' },
    { id: 'alex', name: 'Alex', skin: '#f0c9a3', hair: '#6f493b', shirt: '#7a9e8a', bg: '#dfece2', style: 'short' },
    { id: 'noor', name: 'Noor', skin: '#8a5b43', hair: '#261f25', shirt: '#da8e79', bg: '#f3dfd6', style: 'long' },
    { id: 'leo', name: 'Leo', skin: '#edc194', hair: '#ae7542', shirt: '#7995af', bg: '#dfe7f1', style: 'wave' },
    { id: 'aya', name: 'Aya', skin: '#f2d3b7', hair: '#4b342e', shirt: '#af8db3', bg: '#eee5f0', style: 'bob' },
    { id: 'sam', name: 'Sam', skin: '#b77858', hair: '#282830', shirt: '#70a49b', bg: '#deeeea', style: 'short' },
    { id: 'ivy', name: 'Ivy', skin: '#e4af85', hair: '#603c2f', shirt: '#cf858a', bg: '#f5e3e3', style: 'curly' },
    { id: 'max', name: 'Max', skin: '#f0cfaa', hair: '#785639', shirt: '#d9b553', bg: '#f3edcf', style: 'wave' },
  ];
  const MAX_SEATS = 12;
  const MAX_MESSAGE_LENGTH = 300;
  const MAX_NAME_LENGTH = 24;
  const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

  const $ = (selector) => document.querySelector(selector);
  const seatGrid = $('#seat-grid');
  const joinDialog = $('#join-dialog');
  const joinForm = $('#join-form');
  const joinError = $('#join-error');
  const nameInput = $('#display-name');
  const joinCodeInput = $('#join-code');
  const avatarOptions = $('#avatar-options');
  const toast = $('#toast');
  const messagesNode = $('#messages');

  let peer = null;
  let peerLibraryPromise = null;
  let joinRequestId = 0;
  let hostConnections = new Map();
  let roster = new Map();
  let chatHistory = [];
  let roomCode = '';
  let role = 'visitor';
  let currentUser = null;
  let activeProfile = null;
  let studentConnection = null;
  let reconnectTimer = null;
  let joinTimer = null;
  let toastTimer = null;
  let expectedRoomEnd = false;
  let offlineNoticeShown = false;
  let manualCodeMode = false;
  let manualPreviousCode = '';
  let selectedAvatar = AVATARS[0].id;

  function avatarSvg(avatarId) {
    const avatar = AVATARS.find((item) => item.id === avatarId) || AVATARS[0];
    let hairBack = '<path d="M24 25c0-11 7-17 16-17s16 7 16 18v12H24z" fill="HAIR"/>';
    let hairFront = '<path d="M25 24c1-11 7-16 15-16 7 0 12 4 14 11-5-2-8-6-10-8-3 6-10 9-19 9z" fill="HAIR"/>';
    if (avatar.style === 'curly') {
      hairBack = '<path d="M22 28c-4-10 2-22 15-22 13 0 21 9 18 24l-3 6H26z" fill="HAIR"/><circle cx="28" cy="15" r="6" fill="HAIR"/><circle cx="39" cy="8" r="6" fill="HAIR"/><circle cx="49" cy="14" r="6" fill="HAIR"/>';
      hairFront = '<path d="M27 22c1-8 7-12 12-12 7 0 12 4 14 12-6 0-11-3-14-7-3 4-7 7-12 7z" fill="HAIR"/>';
    } else if (avatar.style === 'long') {
      hairBack = '<path d="M22 25c0-11 7-18 18-18 12 0 18 8 17 20l-3 22H25l-4-17z" fill="HAIR"/>';
      hairFront = '<path d="M26 24c0-11 6-17 15-17 8 0 13 6 14 15-7 0-13-4-16-9-2 6-7 10-13 11z" fill="HAIR"/>';
    } else if (avatar.style === 'bob') {
      hairBack = '<path d="M23 25c0-12 7-18 17-18s17 7 17 18l-3 14H27z" fill="HAIR"/>';
      hairFront = '<path d="M25 23c2-11 7-16 15-16 9 0 14 6 16 15-9-1-13-5-16-10-3 6-8 9-15 11z" fill="HAIR"/>';
    } else if (avatar.style === 'wave') {
      hairFront = '<path d="M25 24c0-12 7-17 15-17 8 0 13 5 16 13-4-2-8-3-12-8-4 6-10 9-19 12z" fill="HAIR"/>';
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="${avatar.bg}"/><path d="M12 80c2-17 13-25 28-25s26 8 28 25" fill="${avatar.shirt}"/>${hairBack.replaceAll('HAIR', avatar.hair)}<path d="M29 28c0-9 5-15 12-15s12 6 12 15v9c0 10-6 17-13 17s-13-7-13-17z" fill="${avatar.skin}"/><path d="M28 28c2-9 8-13 14-13 6 0 11 4 13 11-5-1-9-4-12-8-3 6-8 9-15 10z" fill="${avatar.hair}"/><path d="M33 36h.5M47 36h.5" stroke="#463b37" stroke-width="2.5" stroke-linecap="round"/><path d="M36 44c2 2 6 2 8 0" fill="none" stroke="#9e5f53" stroke-width="1.8" stroke-linecap="round"/>${hairFront.replaceAll('HAIR', avatar.hair)}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function makeAvatar(avatarId, className = '') {
    const node = document.createElement('span');
    node.className = className;
    if (avatarId === 'teacher') {
      node.classList.add('chat-avatar--teacher');
      node.textContent = '🧑‍🏫';
      node.setAttribute('aria-label', 'Teacher profile picture');
      return node;
    }
    const image = document.createElement('img');
    image.src = avatarSvg(avatarId);
    const avatar = AVATARS.find((item) => item.id === avatarId);
    image.alt = avatar ? `${avatar.name} avatar` : 'Classmate avatar';
    node.append(image);
    return node;
  }

  function buildSeats() {
    seatGrid.replaceChildren();
    for (let index = 0; index < MAX_SEATS; index += 1) {
      const seat = document.createElement('div');
      seat.className = 'seat is-empty';
      seat.dataset.seat = String(index);
      seat.setAttribute('role', 'group');
      seat.setAttribute('aria-label', `Seat ${index + 1}, open`);
      const chair = document.createElement('div');
      chair.className = 'chair';
      const avatar = document.createElement('span');
      avatar.className = 'seat-avatar';
      avatar.textContent = '+';
      const name = document.createElement('span');
      name.className = 'seat-name';
      name.textContent = 'Open seat';
      seat.append(chair, avatar, name);
      seatGrid.append(seat);
    }
  }

  function sortRoster() {
    return [...roster.values()].sort((a, b) => (a.joinedAt - b.joinedAt) || a.id.localeCompare(b.id));
  }

  function renderRoster() {
    const people = sortRoster().slice(0, MAX_SEATS);
    [...seatGrid.children].forEach((seat, index) => {
      const participant = people[index];
      const avatarHolder = seat.querySelector('.seat-avatar');
      const nameHolder = seat.querySelector('.seat-name');
      seat.classList.toggle('is-empty', !participant);
      seat.classList.toggle('is-current', Boolean(participant && currentUser && participant.id === currentUser.id));
      seat.setAttribute('aria-label', participant ? `Seat ${index + 1}, ${participant.name}${participant.id === currentUser?.id ? ', your seat' : ''}` : `Seat ${index + 1}, open`);
      avatarHolder.replaceChildren();
      if (participant) {
        const image = document.createElement('img');
        image.src = avatarSvg(participant.avatar);
        image.alt = '';
        avatarHolder.append(image);
        nameHolder.textContent = participant.name;
      } else {
        avatarHolder.textContent = '+';
        nameHolder.textContent = 'Open seat';
      }
    });
    $('#seat-count').textContent = String(people.length);
  }

  function updateRoster(next) {
    roster = new Map();
    if (Array.isArray(next)) {
      next.forEach((person) => {
        if (person && typeof person.id === 'string' && typeof person.name === 'string' && AVATARS.some((avatar) => avatar.id === person.avatar)) {
          roster.set(person.id, { id: person.id, name: person.name.slice(0, MAX_NAME_LENGTH), avatar: person.avatar, joinedAt: Number(person.joinedAt) || Date.now() });
        }
      });
    }
    renderRoster();
    $('#seat-count').textContent = String(roster.size);
  }

  function renderMessages() {
    messagesNode.replaceChildren();
    if (!chatHistory.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.innerHTML = '<div class="empty-illustration" aria-hidden="true"><span class="empty-bubble bubble-one">hey!</span><span class="empty-bubble bubble-two">✦</span><span class="empty-face">☺</span></div><strong>Good conversations start small.</strong><p>Start a class and say hello to your classmates right here.</p>';
      messagesNode.append(empty);
      return;
    }
    chatHistory.slice(-70).forEach((message) => {
      const row = document.createElement('div');
      row.className = `chat-message${currentUser && message.author.id === currentUser.id ? ' is-own' : ''}`;
      const avatar = makeAvatar(message.author.avatar, 'chat-avatar');
      const column = document.createElement('div');
      column.className = 'message-column';
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      const name = document.createElement('strong');
      name.textContent = message.author.name;
      const time = document.createElement('span');
      time.textContent = new Date(message.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      meta.append(name, time);
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = message.text;
      column.append(meta, bubble);
      row.append(avatar, column);
      messagesNode.append(row);
    });
    messagesNode.scrollTop = messagesNode.scrollHeight;
  }

  function setStatus(label, kind = 'idle') {
    const pill = $('#status-pill');
    $('#status-label').textContent = label;
    pill.classList.toggle('is-live', kind === 'live');
    pill.classList.toggle('is-busy', kind === 'busy');
    pill.classList.toggle('is-error', kind === 'error');
    $('.chat-live-dot').classList.toggle('is-live', kind === 'live');
    $('.chat-live-dot').setAttribute('aria-label', kind === 'live' ? 'Chat is connected' : 'Chat is not connected');
  }

  function setToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('is-error', isError);
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  function showJoinError(message) {
    joinError.textContent = message;
    joinError.hidden = !message;
  }

  function showJoinDialog(useManualCode = false) {
    manualCodeMode = useManualCode;
    manualPreviousCode = useManualCode ? roomCode : '';
    $('#join-code-section').hidden = !useManualCode;
    if (!useManualCode) joinCodeInput.value = roomCode || '';
    showJoinError('');
    if (!joinDialog.open) joinDialog.showModal();
    window.setTimeout(() => (useManualCode ? joinCodeInput : nameInput).focus(), 30);
  }

  function closeJoinDialog() {
    if (role === 'visitor') {
      joinRequestId += 1;
      if (peer && !peer.destroyed) peer.destroy();
      peer = null;
      studentConnection = null;
    }
    if (joinDialog.open) joinDialog.close();
    if (role === 'visitor' && manualCodeMode) {
      roomCode = manualPreviousCode;
      setRoomUrl(roomCode);
      setRoomDisplay(roomCode);
      joinCodeInput.value = '';
    }
    manualCodeMode = false;
    manualPreviousCode = '';
    $('#join-code-section').hidden = true;
  }

  function isNativeRuntime() {
    const capacitorNative = Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const capacitorOrigin = window.location.protocol === 'capacitor:'
      || (window.location.protocol === 'https:' && window.location.hostname === 'localhost' && !window.location.port);
    return Boolean(window.classroomConnectShell) || capacitorNative || capacitorOrigin || window.location.protocol === 'file:';
  }

  function getPublicAppUrl(code) {
    const configuredUrl = window.CLASSROOM_CONNECT_CONFIG && window.CLASSROOM_CONNECT_CONFIG.publicAppUrl;
    let baseUrl = '';
    if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
      try {
        const parsed = new URL(configuredUrl.trim());
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
          parsed.search = '';
          parsed.hash = '';
          baseUrl = `${parsed.origin}${parsed.pathname}`;
        }
      } catch (_) { /* fall back to the current web URL when this is not a native app */ }
    }
    if (!baseUrl && !isNativeRuntime()) {
      baseUrl = `${window.location.origin}${window.location.pathname}`;
    }
    return baseUrl ? `${baseUrl}?room=${encodeURIComponent(code)}` : '';
  }

  function setRoomUrl(code) {
    if (isNativeRuntime()) return;
    const url = new URL(window.location.href);
    if (code) url.searchParams.set('room', code);
    else url.searchParams.delete('room');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function makeRoomCode() {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const suffix = [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
    return `CC-${suffix}`;
  }

  function randomId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function peerIdForCode(code) {
    return `cc-${code.replace(/^CC-/i, '').toLowerCase()}`;
  }

  // Read optional signaling-server and ICE/TURN settings from config.js.
  // Keeping this in one place ensures the teacher and students use the
  // same PeerServer and WebRTC configuration.
  function buildPeerOptions(debug = 1) {
    const config = window.CLASSROOM_CONNECT_CONFIG || {};
    const options = { debug };
    const server = config.peerServer;
    if (server && typeof server === 'object' && server.host) {
      options.host = server.host;
      if (Number.isFinite(Number(server.port))) options.port = Number(server.port);
      if (typeof server.path === 'string') options.path = server.path;
      if (typeof server.secure === 'boolean') options.secure = server.secure;
      if (typeof server.key === 'string' && server.key) options.key = server.key;
    }
    if (config.rtcConfig && typeof config.rtcConfig === 'object') {
      options.config = config.rtcConfig;
    }
    return options;
  }

  function setRoomDisplay(code) {
    roomCode = code || '';
    $('#class-code').textContent = code || '— — — — — —';
    $('#chat-room-code').textContent = code ? `ROOM CODE · ${code}` : 'Start a class to open chat';
    $('#room-caption').textContent = code ? `Room ${code}` : 'A new classroom';
    $('#chat-room-name').textContent = code ? 'The classroom lounge' : 'The classroom lounge';
    const inviteLink = code ? getPublicAppUrl(code) : '';
    $('#invite-link').textContent = code ? (inviteLink || `Share code ${code} · classmates can enter it in the app`) : '';
    $('#invite-panel').hidden = !(code && role === 'host');
    $('#code-hint').textContent = code ? 'Share your code or invite link with classmates' : 'A room code appears when class starts';
    $('#join-with-code').hidden = Boolean(code || role === 'host' || role === 'student');
    $('#copy-link-label').textContent = inviteLink ? 'Copy link' : 'Copy code';
    $('#invite-instructions').textContent = inviteLink
      ? 'Send this link to your classmates to invite them in.'
      : 'Share the code; classmates can enter it with “Have a class code? Join here.”';
    if (role === 'host') {
      $('#desk-subtitle').textContent = 'Your classroom is open';
      $('#class-action-label').textContent = 'End class';
      $('#class-action-icon').textContent = '×';
      $('#invite-heading').textContent = 'Your classroom is open!';
    } else if (role === 'student') {
      $('#desk-subtitle').textContent = 'You made it to class';
      $('#class-action-label').textContent = 'Leave class';
      $('#class-action-icon').textContent = '↗';
      $('#invite-panel').hidden = true;
    } else if (code) {
      $('#desk-subtitle').textContent = 'You have an invitation';
      $('#class-action-label').textContent = 'Join class';
      $('#class-action-icon').textContent = '→';
    } else {
      $('#desk-subtitle').textContent = 'Your class starts here';
      $('#class-action-label').textContent = 'Start class';
      $('#class-action-icon').textContent = '↗';
    }
  }

  function setChatEnabled(enabled) {
    $('#message-input').disabled = !enabled;
    $('#send-message').disabled = !enabled;
    $('#message-input').placeholder = enabled ? 'Write a message…' : 'Start a class to chat…';
    $('#chat-subtitle').textContent = enabled ? 'Say hello to everyone in class' : 'A friendly place to say hello';
  }

  function cleanName(value) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH);
  }

  function showErrorToast(error) {
    const messages = {
      'unavailable-id': 'That class code is already in use. Ask the teacher to start a new class.',
      'peer-unavailable': 'The teacher’s classroom could not be found. Check the class code and make sure the teacher has started class.',
      'network': 'Could not reach the live connection service. Check the internet connection and try again.',
      'server-error': 'The live connection service did not respond. Please try again shortly.',
      'socket-error': 'The live connection service could not be reached from this network.',
      'socket-closed': 'The live connection service closed unexpectedly. Please try again.',
      'webrtc': 'Your browser could not establish a direct connection. Try again on another network or browser.',
      'browser-incompatible': 'This browser does not support live classroom connections.',
    };
    return messages[error] || (error
      ? `Connection failed (${error}). Check the class code, internet access, and network settings, then try again.`
      : 'Could not connect right now. Please try again in a moment.');
  }

  function failPendingJoin(message) {
    if (role === 'student') return;
    clearTimeout(joinTimer);
    joinRequestId += 1;
    $('#join-submit').disabled = false;
    $('#join-submit-label').textContent = 'Join the class';
    showJoinError(message);
    setStatus('Could not join class', 'error');
    const failedConnection = studentConnection;
    studentConnection = null;
    if (failedConnection) {
      try { failedConnection.close(); } catch (_) { /* already closed */ }
    }
    if (peer && !peer.destroyed && role !== 'host') peer.destroy();
    if (role !== 'host') peer = null;
  }

  function ensurePeerLibrary() {
    if (typeof window.Peer === 'function') return Promise.resolve(window.Peer);
    if (peerLibraryPromise) return peerLibraryPromise;
    peerLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => typeof window.Peer === 'function' ? resolve(window.Peer) : reject(new Error('PeerJS did not initialize'));
      script.onerror = () => reject(new Error('PeerJS could not load'));
      document.head.append(script);
      window.setTimeout(() => reject(new Error('PeerJS load timed out')), 12000);
    }).catch((error) => {
      peerLibraryPromise = null;
      throw error;
    });
    return peerLibraryPromise;
  }

  function updatePeerConnectionStatus() {
    if (!peer || peer.destroyed) return;
    if (peer.disconnected) {
      setStatus('Reconnecting…', 'busy');
      window.setTimeout(() => {
        if (peer && peer.disconnected && !peer.destroyed) peer.reconnect();
      }, 1000);
    }
  }

  function resetRoom({ keepCode = false, ended = false } = {}) {
    joinRequestId += 1;
    expectedRoomEnd = true;
    clearTimeout(reconnectTimer);
    clearTimeout(joinTimer);
    hostConnections.forEach((connection) => connection.close());
    hostConnections.clear();
    if (studentConnection) {
      try { studentConnection.close(); } catch (_) { /* already closed */ }
      studentConnection = null;
    }
    if (peer && !peer.destroyed) peer.destroy();
    peer = null;
    role = 'visitor';
    currentUser = null;
    activeProfile = null;
    roster.clear();
    chatHistory = [];
    updateRoster([]);
    renderMessages();
    sessionStorage.removeItem('cc-role');
    sessionStorage.removeItem('cc-room');
    sessionStorage.removeItem('cc-profile');
    if (!keepCode) {
      roomCode = '';
      setRoomUrl('');
      setRoomDisplay('');
    }
    setChatEnabled(false);
    $('#invite-panel').hidden = true;
    setStatus(ended ? 'Class has ended' : 'Ready to begin', 'idle');
    expectedRoomEnd = false;
  }

  function rememberRole(nextRole, code, profile) {
    sessionStorage.setItem('cc-role', nextRole);
    sessionStorage.setItem('cc-room', code);
    if (profile) sessionStorage.setItem('cc-profile', JSON.stringify(profile));
  }

  function sendToStudents(payload, exceptPeerId = '') {
    hostConnections.forEach((connection, peerId) => {
      if (peerId !== exceptPeerId && connection.open) {
        try { connection.send(payload); } catch (_) { /* the close handler removes stale connections */ }
      }
    });
  }

  function hostAddParticipant(connection, participant) {
    const name = cleanName(participant && participant.name);
    const avatarId = participant && participant.avatar;
    if (!name || !AVATARS.some((avatar) => avatar.id === avatarId)) {
      connection.send({ type: 'rejected', reason: 'Please choose a name and profile picture.' });
      connection.close();
      return;
    }
    const id = connection.peer;
    const existing = roster.get(id);
    if (!existing && roster.size >= MAX_SEATS) {
      connection.send({ type: 'rejected', reason: 'This classroom is full. Ask the teacher for another seat.' });
      connection.close();
      return;
    }
    const person = { id, name, avatar: avatarId, joinedAt: existing ? existing.joinedAt : Date.now() };
    roster.set(id, person);
    hostConnections.set(id, connection);
    connection.send({ type: 'welcome', room: roomCode, roster: sortRoster(), messages: chatHistory.slice(-40) });
    sendToStudents({ type: 'roster', roster: sortRoster() }, id);
    renderRoster();
    setStatus('Class is live', 'live');
  }

  function hostHandleData(connection, payload) {
    if (!payload || typeof payload !== 'object') return;
    if (payload.type === 'join') {
      hostAddParticipant(connection, payload.participant);
      return;
    }
    const participant = roster.get(connection.peer);
    if (!participant) return;
    if (payload.type === 'chat' && typeof payload.text === 'string') {
      createMessage({ id: participant.id, name: participant.name, avatar: participant.avatar }, payload.text);
    } else if (payload.type === 'leave') {
      connection.close();
    }
  }

  function hostRemoveParticipant(peerId, connection) {
    if (connection && hostConnections.get(peerId) && hostConnections.get(peerId) !== connection) return;
    if (roster.delete(peerId)) {
      hostConnections.delete(peerId);
      const nextRoster = sortRoster();
      renderRoster();
      sendToStudents({ type: 'roster', roster: nextRoster });
      if (role === 'host') setStatus('Class is live', 'live');
    }
  }

  function installHostConnectionHandlers(hostPeer) {
    hostPeer.on('connection', (connection) => {
      connection.on('data', (payload) => hostHandleData(connection, payload));
      connection.on('close', () => hostRemoveParticipant(connection.peer, connection));
      connection.on('error', () => hostRemoveParticipant(connection.peer, connection));
    });
    hostPeer.on('disconnected', updatePeerConnectionStatus);
    hostPeer.on('error', (error) => {
      if (error.type === 'unavailable-id') {
        setStatus('Room code unavailable', 'error');
        $('#class-action').disabled = false;
        roomCode = '';
        setRoomDisplay('');
        $('#code-hint').textContent = 'Try Start class again for a fresh code';
        setToast(showErrorToast(error.type), true);
        hostPeer.destroy();
        peer = null;
        role = 'visitor';
        currentUser = null;
        setRoomDisplay('');
        $('#class-action-label').textContent = 'Try again';
      } else {
        $('#class-action').disabled = false;
        setStatus('Connection trouble', 'error');
        setToast(showErrorToast(error.type), true);
      }
    });
  }

  async function createHostRoom() {
    $('#class-action').disabled = true;
    setStatus('Connecting to live service…', 'busy');
    try {
      await ensurePeerLibrary();
    } catch (_) {
      $('#class-action').disabled = false;
      setStatus('Connection library unavailable', 'error');
      setToast('Could not load the live connection service. Check your internet connection and try again.', true);
      return;
    }
    clearTimeout(reconnectTimer);
    const code = makeRoomCode();
    roomCode = code;
    role = 'host';
    currentUser = { id: 'teacher', name: 'Teacher', avatar: 'teacher' };
    expectedRoomEnd = false;
    $('#class-action').disabled = true;
    $('#class-code').textContent = code;
    $('#code-hint').textContent = 'Connecting to your classroom…';
    $('#desk-subtitle').textContent = 'Opening your classroom…';
    setStatus('Opening class…', 'busy');
    const hostPeer = new window.Peer(peerIdForCode(code), buildPeerOptions(1));
    peer = hostPeer;
    installHostConnectionHandlers(hostPeer);
    hostPeer.on('open', () => {
      if (peer !== hostPeer || role !== 'host') return;
      $('#class-action').disabled = false;
      setRoomUrl(code);
      setRoomDisplay(code);
      rememberRole('host', code);
      setChatEnabled(true);
      setStatus('Class is live', 'live');
      $('#board-title').innerHTML = 'Our classroom is open.<br />Come on in!';
      setToast('Your classroom is live. Share the invite link!');
    });
  }

  function makeHostMessage(author, text) {
    const cleaned = String(text || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!cleaned) return null;
    const message = { id: randomId(), author, text: cleaned, at: Date.now() };
    chatHistory.push(message);
    if (chatHistory.length > 70) chatHistory = chatHistory.slice(-70);
    renderMessages();
    sendToStudents({ type: 'message', message });
    return message;
  }

  function createMessage(author, text) {
    if (role === 'host') return makeHostMessage(author, text);
    return null;
  }

  function handleStudentPayload(payload) {
    if (!payload || typeof payload !== 'object') return;
    if (payload.type === 'welcome') {
      clearTimeout(joinTimer);
      if (payload.room !== roomCode) return;
      role = 'student';
      offlineNoticeShown = false;
      const studentId = peer ? peer.id : '';
      currentUser = { id: studentId, name: activeProfile.name, avatar: activeProfile.avatar };
      rememberRole('student', roomCode, activeProfile);
      updateRoster(payload.roster);
      chatHistory = Array.isArray(payload.messages) ? payload.messages.slice(-40) : [];
      renderMessages();
      setRoomDisplay(roomCode);
      setChatEnabled(true);
      setStatus('Class is live', 'live');
      closeJoinDialog();
      setToast(`Welcome to class, ${activeProfile.name}!`);
      return;
    }
    if (payload.type === 'rejected') {
      clearTimeout(joinTimer);
      $('#join-submit').disabled = false;
      $('#join-submit-label').textContent = 'Join the class';
      showJoinError(cleanName(payload.reason) || 'The teacher could not add you to class.');
      setStatus('Could not join class', 'error');
      if (studentConnection) studentConnection.close();
      return;
    }
    if (payload.type === 'roster') {
      updateRoster(payload.roster);
    } else if (payload.type === 'message' && payload.message && typeof payload.message.text === 'string') {
      chatHistory.push(payload.message);
      if (chatHistory.length > 70) chatHistory = chatHistory.slice(-70);
      renderMessages();
    } else if (payload.type === 'class-ended') {
      resetRoom({ ended: true });
      setToast('The teacher has ended this class.');
    }
  }

  function connectStudentToHost(studentPeer) {
    if (!studentPeer || studentPeer.destroyed || expectedRoomEnd || role === 'host') return;
    if (studentConnection && studentConnection.open) return;
    setStatus('Connecting to class…', 'busy');
    const connection = studentPeer.connect(peerIdForCode(roomCode), { reliable: true });
    studentConnection = connection;
    connection.on('open', () => {
      if (studentConnection !== connection) return;
      connection.send({ type: 'join', participant: activeProfile });
      clearTimeout(joinTimer);
      joinTimer = window.setTimeout(() => {
        if (role !== 'student') {
          showJoinError('The teacher’s classroom did not respond. Check that the class is still open. If both devices are online but cannot connect, this network may require a TURN relay configured by the site owner.');
          $('#join-submit').disabled = false;
          $('#join-submit-label').textContent = 'Join the class';
          setStatus('Waiting for teacher', 'error');
        }
      }, 12000);
    });
    connection.on('data', (payload) => {
      if (studentConnection === connection) handleStudentPayload(payload);
    });
    connection.on('close', () => {
      if (studentConnection !== connection) return;
      studentConnection = null;
      if (role === 'student' && !expectedRoomEnd) {
        setStatus('Reconnecting…', 'busy');
        clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => connectStudentToHost(studentPeer), 1500);
      } else if (role !== 'host') {
        failPendingJoin('The connection closed before the teacher confirmed your seat. Check the class code and try again.');
      }
    });
    connection.on('error', (error) => {
      if (role !== 'student' && role !== 'host') {
        failPendingJoin(showErrorToast(error && error.type));
        return;
      }
      if (role === 'student') {
        if (error.type === 'peer-unavailable') {
          setStatus('Waiting for teacher', 'error');
          if (!offlineNoticeShown) {
            setToast('The teacher’s connection dropped. We’ll keep trying to reconnect.', true);
            offlineNoticeShown = true;
          }
          clearTimeout(reconnectTimer);
          reconnectTimer = window.setTimeout(() => connectStudentToHost(studentPeer), 5000);
        } else {
          setStatus('Reconnecting…', 'busy');
        }
      } else if (error.type === 'peer-unavailable') {
        showJoinError(showErrorToast(error.type));
        $('#join-submit').disabled = false;
        $('#join-submit-label').textContent = 'Join the class';
        setStatus('Teacher is offline', 'error');
      }
    });
  }

  async function joinRoom(profile) {
    if (!roomCode) return;
    const requestId = ++joinRequestId;
    try {
      await ensurePeerLibrary();
    } catch (_) {
      $('#join-submit').disabled = false;
      $('#join-submit-label').textContent = 'Join the class';
      showJoinError('Could not load the live connection service. Check your internet and try again.');
      return;
    }
    if (requestId !== joinRequestId || !roomCode) return;
    activeProfile = { name: cleanName(profile.name), avatar: profile.avatar };
    if (!activeProfile.name || !AVATARS.some((avatar) => avatar.id === activeProfile.avatar)) {
      showJoinError('Please enter your name and choose a profile picture.');
      return;
    }
    $('#join-submit').disabled = true;
    $('#join-submit-label').textContent = 'Finding your seat…';
    showJoinError('');
    setStatus('Connecting to class…', 'busy');
    expectedRoomEnd = false;
    role = 'visitor';
    if (peer && !peer.destroyed) peer.destroy();
    studentConnection = null;
    clearTimeout(joinTimer);
    // Cover both stages: connecting to PeerServer and opening the WebRTC data channel.
    // Previously the UI could wait forever if either stage never emitted its open event.
    joinTimer = window.setTimeout(() => {
      failPendingJoin('The connection did not finish. Check that the teacher is still online and that both devices can reach the live connection service. If this happens on different networks, the app may need a TURN relay configured in config.js.');
    }, 25000);
    const studentPeer = new window.Peer(buildPeerOptions(2));
    peer = studentPeer;
    studentPeer.on('open', () => {
      if (requestId === joinRequestId && peer === studentPeer) connectStudentToHost(studentPeer);
    });
    studentPeer.on('disconnected', updatePeerConnectionStatus);
    studentPeer.on('error', (error) => {
      if (requestId !== joinRequestId || peer !== studentPeer) return;
      if (role === 'student' && error.type === 'peer-unavailable') {
        setStatus('Waiting for teacher', 'error');
        if (!offlineNoticeShown) {
          setToast('The teacher’s connection dropped. We’ll keep trying to reconnect.', true);
          offlineNoticeShown = true;
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => connectStudentToHost(studentPeer), 5000);
      } else if (role !== 'student') {
        failPendingJoin(showErrorToast(error.type));
      }
    });
  }

  function leaveRoom(ended = false) {
    if (role === 'host') {
      sendToStudents({ type: 'class-ended' });
      setToast('Class ended. Your invite link is now closed.');
      $('#class-action').disabled = true;
      setStatus('Ending class…', 'busy');
      window.setTimeout(() => {
        resetRoom({ ended });
        $('#board-title').innerHTML = 'Good things happen<br />when we learn together.';
      }, 350);
      return;
    } else if (studentConnection && studentConnection.open) {
      try { studentConnection.send({ type: 'leave' }); } catch (_) { /* leaving regardless */ }
    }
    resetRoom({ ended });
    $('#board-title').innerHTML = 'Good things happen<br />when we learn together.';
  }

  function renderAvatarOptions() {
    avatarOptions.replaceChildren();
    AVATARS.forEach((avatar) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-option';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', `${avatar.name} profile picture`);
      button.setAttribute('aria-checked', String(avatar.id === selectedAvatar));
      button.title = avatar.name;
      const image = document.createElement('img');
      image.src = avatarSvg(avatar.id);
      image.alt = '';
      button.append(image);
      button.addEventListener('click', () => {
        selectedAvatar = avatar.id;
        [...avatarOptions.children].forEach((option) => option.setAttribute('aria-checked', String(option === button)));
      });
      avatarOptions.append(button);
    });
  }

  function initializeRoomFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (!codeParam) return;
    const code = codeParam.toUpperCase();
    if (!/^CC-[A-Z0-9]{6}$/.test(code)) {
      setToast('That invite link does not look right. Ask your teacher for a new one.', true);
      return;
    }
    setRoomDisplay(code);
    $('#board-title').innerHTML = 'A seat is waiting<br />just for you.';
    if (sessionStorage.getItem('cc-room') === code && sessionStorage.getItem('cc-role') === 'host') {
      createHostRoomForCode(code);
      return;
    }
    const savedProfile = sessionStorage.getItem('cc-profile');
    if (sessionStorage.getItem('cc-room') === code && sessionStorage.getItem('cc-role') === 'student' && savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        if (profile.name && AVATARS.some((avatar) => avatar.id === profile.avatar)) {
          activeProfile = profile;
          nameInput.value = profile.name;
          selectedAvatar = profile.avatar;
          renderAvatarOptions();
          showJoinDialog();
          joinRoom(profile);
          return;
        }
      } catch (_) { /* show the join form instead */ }
    }
    showJoinDialog();
  }

  function createHostRoomForCode(code) {
    if (typeof window.Peer !== 'function') {
      ensurePeerLibrary().then(() => createHostRoomForCode(code)).catch(() => {
        setStatus('Connection library unavailable', 'error');
        setToast('Could not reopen your classroom. Check your internet and reload.', true);
      });
      return;
    }
    roomCode = code;
    role = 'host';
    currentUser = { id: 'teacher', name: 'Teacher', avatar: 'teacher' };
    expectedRoomEnd = false;
    setStatus('Reopening your classroom…', 'busy');
    const hostPeer = new window.Peer(peerIdForCode(code), buildPeerOptions(1));
    peer = hostPeer;
    installHostConnectionHandlers(hostPeer);
    hostPeer.on('open', () => {
      setRoomDisplay(code);
      setRoomUrl(code);
      setChatEnabled(true);
      setStatus('Class is live', 'live');
      $('#board-title').innerHTML = 'Our classroom is open.<br />Come on in!';
    });
  }

  async function copyInviteLink() {
    const url = getPublicAppUrl(roomCode);
    const value = url || roomCode;
    try {
      await navigator.clipboard.writeText(value);
      setToast(url ? 'Invite link copied to your clipboard!' : 'Class code copied. Classmates can enter it in the app.');
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      setToast(copied ? (url ? 'Invite link copied to your clipboard!' : 'Class code copied to your clipboard!') : 'Copy the code from the teacher’s desk.', !copied);
    }
  }

  $('#class-action').addEventListener('click', () => {
    if (role === 'host' || role === 'student') {
      leaveRoom();
    } else if (roomCode) {
      showJoinDialog();
    } else {
      createHostRoom();
    }
  });

  $('#copy-link').addEventListener('click', copyInviteLink);
  $('#join-with-code').addEventListener('click', () => showJoinDialog(true));
  $('#close-join').addEventListener('click', closeJoinDialog);
  joinDialog.addEventListener('click', (event) => {
    if (event.target === joinDialog) closeJoinDialog();
  });
  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (role === 'student') return;
    if (!roomCode) {
      const enteredCode = joinCodeInput.value.trim().toUpperCase();
      if (!/^CC-[A-Z0-9]{6}$/.test(enteredCode)) {
        showJoinError('Enter the six-character class code from the teacher’s desk.');
        joinCodeInput.focus();
        return;
      }
      roomCode = enteredCode;
      setRoomUrl(roomCode);
      setRoomDisplay(roomCode);
      $('#board-title').innerHTML = 'A seat is waiting<br />just for you.';
    }
    const name = cleanName(nameInput.value);
    if (!name) {
      showJoinError('Add your name so your classmates know who joined.');
      nameInput.focus();
      return;
    }
    joinRoom({ name, avatar: selectedAvatar });
  });
  $('#chat-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#message-input');
    const text = input.value.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text || !currentUser) return;
    if (role === 'host') {
      makeHostMessage(currentUser, text);
    } else if (role === 'student' && studentConnection && studentConnection.open) {
      studentConnection.send({ type: 'chat', text });
    }
    input.value = '';
    input.focus();
  });
  window.addEventListener('beforeunload', () => {
    if (peer && !peer.destroyed) peer.destroy();
  });

  renderAvatarOptions();
  buildSeats();
  renderMessages();
  initializeRoomFromUrl();
})();
