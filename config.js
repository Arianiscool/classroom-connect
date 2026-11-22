// Classroom Connect connection settings.
//
// Both the teacher and students load this file before app.js.
// PeerJS's documented shared ICE configuration is listed below.
// It includes STUN plus PeerJS's public TURN relay endpoints.
//
// For a long-term/public deployment, use a TURN provider with temporary
// credentials and replace the PeerJS TURN entry. Do not publish private,
// permanent TURN credentials in a public GitHub repository.
//
// If you run your own PeerServer, fill in peerServer below.
// Otherwise leave it null to use PeerJS Cloud over port 443.

window.CLASSROOM_CONNECT_CONFIG = {
  // Leave empty to use the current website URL automatically.
  publicAppUrl: '',

  // Optional self-hosted PeerServer settings.
  peerServer: null,

  // Applied to BOTH teacher and student Peer connections by app.js.
  rtcConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: [
          'turn:eu-0.turn.peerjs.com:3478',
          'turn:us-0.turn.peerjs.com:3478'
        ],
        username: 'peerjs',
        credential: 'peerjsp'
      }
    ],
    sdpSemantics: 'unified-plan'
  }
};
