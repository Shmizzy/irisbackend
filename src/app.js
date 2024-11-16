const express = require('express');
const cors = require('cors');
const artworkRoutes = require('./routes/artwork');
const stateRoutes = require('./routes/state');
const streamRoutes = require('./routes/stream');
const apiRouter = require('./routes/api');

const path = require('path');



const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

app.use('/api', apiRouter);


app.use('/api/artworks', artworkRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/stream', streamRoutes.router);

module.exports = app;