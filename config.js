// Optional connection settings for Classroom Connect.
//
// Leave peerServer.host empty to use PeerJS Cloud.
// If your network cannot reach PeerJS Cloud, point this at a PeerServer
// that you control and have deployed over HTTPS/WSS.
//
// For networks that cannot make direct browser-to-browser connections,
// add TURN servers supplied by your hosting provider. STUN alone is not
// a guaranteed relay and cannot solve every NAT/firewall combination.
//
// Example:
// window.CLASSROOM_CONNECT_CONFIG = {
//   publicAppUrl: 'https://your-site.example/',
//   peerServer: { host: 'peer.example.com', port: 443, path: '/', secure: true, key: 'peerjs' },
//   rtcConfig: {
//     iceServers: [
//       { urls: 'stun:stun.l.google.com:19302' },
//       { urls: 'turn:turn.example.com:3478', username: 'YOUR_USERNAME', credential: 'YOUR_PASSWORD' },
//     ],
//   },
// };
window.CLASSROOM_CONNECT_CONFIG = {
  publicAppUrl: '',
  peerServer: null,
  rtcConfig: null,
};
