// backend/src/routes/api.js
const express = require('express');
const { saveImage } = require('../utils/imageStorage');
const { artGenerator } = require('../server'); // Import artGenerator
const router = express.Router();

router.post('/save-image', async (req, res) => {
  try {
    const { base64Image } = req.body;
    const imageUrl = await saveImage(base64Image, `artwork-${Date.now()}`);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

router.post('/artwork-complete', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    await artGenerator.saveAndCacheArtwork(imageUrl); // Use artGenerator
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing artwork:', error);
    res.status(500).json({ error: 'Failed to complete artwork' });
  }
});

module.exports = router;