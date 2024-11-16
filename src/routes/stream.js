// src/routes/stream.js
const express = require('express');
const router = express.Router();
const State = require('../models/State');

const clients = new Set();
let heartbeatInterval;

router.get('/events', async (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Add client to active connections
  clients.add(res);
  console.log(`👥 Client connected. Total viewers: ${clients.size}`);
  await updateViewerCount();

  // Send heartbeat every 30s to keep connection alive
  const clientHeartbeat = setInterval(() => {
    res.write(':\n\n'); // SSE comment for heartbeat
  }, 30000);

  // Handle client disconnect
  req.on('close', async () => {
    clients.delete(res);
    clearInterval(clientHeartbeat);
    console.log(`👋 Client disconnected. Total viewers: ${clients.size}`);
    await updateViewerCount();
  });

  // Handle connection timeout
  req.on('end', async () => {
    clients.delete(res);
    clearInterval(clientHeartbeat);
    await updateViewerCount();
  });

  // Handle errors
  req.on('error', async (error) => {
    console.error('SSE Client error:', error);
    clients.delete(res);
    clearInterval(clientHeartbeat);
    await updateViewerCount();
  });
});

async function updateViewerCount() {
  const viewerCount = clients.size;
  
  try {
    // Update state in database
    await State.findOneAndUpdate(
      { currentStatus: { $exists: true } },
      { viewers: viewerCount },
      { upsert: true }
    );

    broadcast({
      type: 'viewer_count',
      count: viewerCount
    });
  } catch (error) {
    console.error('Error updating viewer count:', error);
  }
}

// Function to broadcast to all clients
const broadcast = (event) => {
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to client:', error);
      clients.delete(client);
    }
  });
};

// Cleanup stale connections periodically
setInterval(() => {
  clients.forEach(client => {
    if (!client.writable) {
      clients.delete(client);
      updateViewerCount();
    }
  });
}, 30000);

module.exports = { router, broadcast };