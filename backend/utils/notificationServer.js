// WebSocket notification server removed. No-op exports for compatibility.
function initialize() {}
function sendToUser() {}
function broadcast() {}
function getConnectedUsers() { return []; }
function handlePing() {}

module.exports = {
  initialize,
  sendToUser,
  broadcast,
  getConnectedUsers,
  handlePing
};
