const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    totalCreations: { type: Number, default: 0 },
    totalPixels: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
    lastUpdateAt: { type: Date, default: Date.now }
});

const Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;