// src/routes/stream.js
const express = require('express');
const router = express.Router();

const clients = new Set();

router.get('/events', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Add client to active connections
  clients.add(res);

  // Remove client on disconnect
  req.on('close', () => clients.delete(res));
});

// Function to broadcast to all clients
const broadcast = (event) => {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  });
};

module.exports = { router, broadcast };