const mongoose = require('mongoose');
const Artwork = require('../src/models/Artwork');
require('dotenv').config();

async function migrateDrawingInstructions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📊 Connected to database');

        // Find artworks with old field name
        const artworks = await Artwork.find({ drawingInstruction: { $exists: true } });
        console.log(`Found ${artworks.length} artworks to migrate`);

        for (const artwork of artworks) {
            if (artwork.drawingInstruction && !artwork.drawingInstructions) {
                artwork.drawingInstructions = artwork.drawingInstruction;
                delete artwork.drawingInstruction;
                await artwork.save();
                console.log(`✅ Migrated artwork ${artwork.id}`);
            }
        }

        console.log('🎉 Migration complete');
    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateDrawingInstructions();