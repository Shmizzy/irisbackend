// src/routes/stream.js
const express = require('express');
const router = express.Router();
const State = require('../models/State');

const activeConnections = new Map(); // Use Map to store connection IDs and timestamps

router.get('/events', async (req, res) => {
  const connectionId = Date.now().toString();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Add connection with timestamp
  activeConnections.set(connectionId, {
    res,
    timestamp: Date.now(),
    heartbeat: setInterval(() => {
      res.write(':\n\n'); // Heartbeat
    }, 30000)
  });

  console.log(`👥 New connection ${connectionId}. Total: ${activeConnections.size}`);
  broadcastViewerCount();

  req.on('close', () => {
    const connection = activeConnections.get(connectionId);
    if (connection) {
      clearInterval(connection.heartbeat);
      activeConnections.delete(connectionId);
      console.log(`👋 Connection closed ${connectionId}. Total: ${activeConnections.size}`);
      broadcastViewerCount();
    }
  });
});

function broadcastViewerCount() {
  const count = activeConnections.size;
  const message = JSON.stringify({ type: 'viewer_count', count });
  
  // Clean up stale connections while broadcasting
  for (const [id, connection] of activeConnections.entries()) {
    try {
      connection.res.write(`data: ${message}\n\n`);
    } catch (error) {
      console.log(`Removing stale connection ${id}`);
      clearInterval(connection.heartbeat);
      activeConnections.delete(id);
    }
  }
}

function broadcast(event) {
  const message = JSON.stringify(event);
  for (const [id, connection] of activeConnections.entries()) {
    try {
      connection.res.write(`data: ${message}\n\n`);
    } catch (error) {
      console.log(`Failed to send to ${id}, removing connection`);
      clearInterval(connection.heartbeat);
      activeConnections.delete(id);
    }
  }
}

// Cleanup stale connections every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, connection] of activeConnections.entries()) {
    if (now - connection.timestamp > 120000) { // 2 minutes timeout
      console.log(`Removing inactive connection ${id}`);
      clearInterval(connection.heartbeat);
      activeConnections.delete(id);
    }
  }
  broadcastViewerCount();
}, 60000);

module.exports = { router, broadcast };