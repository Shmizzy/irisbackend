const express = require('express');
const router = express.Router();
const State = require('../models/State');

const clients = new Set();

router.get('/events', async (req, res) => {
  const clientId = Date.now().toString();

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Add client to active connections
  clients.add(res);
  
  // Update viewer count
  await updateViewerCount();

  // Handle client disconnect
  req.on('close', async () => {
    clients.delete(res);
    await updateViewerCount();
  });
});

async function updateViewerCount() {
  const viewerCount = clients.size;
  
  // Update state in database
  await State.findOneAndUpdate(
    { currentStatus: { $exists: true } },
    { viewers: viewerCount },
    { upsert: true }
  );

  broadcast({
    type: 'state_update',
    viewers: viewerCount
  });
}

// Existing broadcast function
const broadcast = (event) => {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  });
};

module.exports = { router, broadcast };