const express = require('express');
const cors = require('cors');
const artworkRoutes = require('./routes/artwork');
const stateRoutes = require('./routes/state');
const streamRoutes = require('./routes/stream');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/artworks', artworkRoutes);
app.use('/api/state', stateRoutes);
api.use('/api/stream', streamRoutes.router);

module.exports = app;