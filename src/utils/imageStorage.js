const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function saveImage(base64Data, filename) {
  try {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    const uniqueFilename = `${Date.now()}-${filename}.png`;
    const filepath = path.join(uploadsDir, uniqueFilename);
    
    await fs.promises.writeFile(filepath, buffer);
    
    return `/uploads/${uniqueFilename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

module.exports = { saveImage };