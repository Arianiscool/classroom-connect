# Classroom Connect

A mobile-friendly classroom lobby with live student seating and group chat. It runs in current phone and desktop browsers; no app-store installation is required.

## Run locally

1. Install [Node.js 18 or newer](https://nodejs.org/).
2. Open a terminal in this folder.
3. Run:

   ```sh
   npm start
   ```

4. Open <http://localhost:4173>.

You can also run `node serve.mjs` without npm. The server uses port `4173` by default; set the `PORT` environment variable to change it.

## Use it

1. The teacher selects **Start class**. Classroom Connect creates a unique six-character code and a shareable invite link.
2. Classmates open the link, choose a display name and illustrated profile picture, then join an available seat.
3. Everyone in the room can exchange live text messages in Class chat.
4. The teacher selects **End class** to close the room. Classmates can select **Leave class** at any time.

There are twelve student seats. Voice chat is not included; the conversation feature is live text chat.

## Sharing with classmates

For classmates on other devices or networks, deploy the folder to a public HTTPS static host and set `publicAppUrl` in `config.js` to that site's URL. You can also test on another device on the same Wi-Fi by running the server with `HOST=0.0.0.0` and opening `http://YOUR-COMPUTER-LAN-IP:4173` on that device. Your computer's firewall must allow the connection. Do not use the LAN option on an untrusted network.

Opening `index.html` directly with `file://` is not recommended; use the included server or an HTTPS host.

## Live connection notes

The PeerJS browser library is loaded from jsDelivr, and live connections use PeerJS Cloud and WebRTC. Internet access is required for those features. Class membership and chat messages are sent between browsers over WebRTC data channels; this project does not include a database or persistent chat storage. The teacher's browser must stay connected while the class is open.

The default PeerJS Cloud signaling service is shared. For sustained production use, review its current service limits or host a PeerServer of your own. This is a lightweight lobby for trusted groups; anyone with an invite link or code may try to join while the room is open.
