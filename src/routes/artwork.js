const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');

router.get('/', async (req, res) => {
  try {
    const artworks = await Artwork.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v')
      .lean();

    res.json(artworks);
  } catch (error) {
    console.error('❌ Error fetching artworks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch artworks' 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .select('-__v')
      .lean();

    if (!artwork) {
      return res.status(404).json({ 
        error: 'Artwork not found' 
      });
    }

    res.json(artwork);
  } catch (error) {
    console.error('❌ Error fetching artwork:', error);
    res.status(500).json({ 
      error: 'Failed to fetch artwork' 
    });
  }
});

module.exports = router;