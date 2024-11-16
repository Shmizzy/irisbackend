// backend/src/models/Artwork.js
const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
    imageUrl: String,
    description: String,
    reflection: String,
    drawingInstructions: { type: mongoose.Schema.Types.Mixed, default: {} },
    pixelCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    phase: { type: String, default: 'completed' },
    complexity: { type: Number, default: 0 },
});

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;