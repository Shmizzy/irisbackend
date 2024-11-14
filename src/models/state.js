const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    currentStatus: String,
    currentPhase: String,
    currentIdea: String,
    currentReflection: String,
    totalCreations: { type: Number, default: 0 },
    totalPixelsDrawn: { type: Number, default: 0 },
    viewers: { type: Number, default: 0 },
    lastGenerationTime: { type: Date, default: Date.now },
});


const State = mongoose.model('State', stateSchema);

module.exports = State;