const express = require('express');
const router = express.Router();
const State = require('../models/State');

router.get('/current', async (req, res) => {
  try {
    const state = await State.findOne({ currentStatus: { $exists: true } })
      .select('-__v')
      .lean();

    if (!state) {
      return res.status(404).json({ 
        error: 'No state found' 
      });
    }

    res.json(state);
  } catch (error) {
    console.error('❌ Error fetching state:', error);
    res.status(500).json({ 
      error: 'Failed to fetch state' 
    });
  }
});

module.exports = router;