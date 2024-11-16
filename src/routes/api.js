// backend/src/routes/api.js
const express = require('express');
const { saveImage } = require('../utils/imageStorage');
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

module.exports = router;