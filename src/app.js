const express = require('express');
const artworkRoutes = require('./routes/artwork');

const app = express();
app.use(express.json());

module.exports = app;