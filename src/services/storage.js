const mongoose = require('mongoose');
const Artwork = require('../models/Artwork');
const Stats = require('../models/Stats');

class StorageService {
    constructor() {
        console.log('📦 Storage Service initialized');
        this._validateConnection();
    }

    async _validateConnection() {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Database connection established');
            await this._initializeStats();
        } catch (error) {
            console.error('❌ Database connection error:', error);
            throw new Error('Failed to connect to database');
        }
    }

    async _initializeStats() {
        const artworkCount = await Artwork.countDocuments();
        const totalPixels = await Artwork.aggregate([
            { $group: { _id: null, totalPixels: { $sum: '$pixelCount' } } }
        ]);

        await Stats.findOneAndUpdate(
            { id: 'global' },
            {
                id: 'global',
                totalCreations: artworkCount,
                totalPixels: totalPixels[0]?.totalPixels || 0,
                totalVotes: 0
            },
            { upsert: true, new: true }
        );

        console.log('📊 Stats initialized:');
        console.log(`   Total Creations: ${artworkCount}`);
        console.log(`   Total Pixels: ${totalPixels[0]?.totalPixels || 0}`);
    }

    async saveArtwork({ drawingInstructions, description, reflection }) {
        console.log('\n=== Saving Artwork ===');
        console.log('📝 Drawing Instructions:', drawingInstructions ? 'Present' : 'Missing');
    
        try {
          const pixelCount = this._calculatePixelCount(drawingInstructions);
    
          const artwork = new Artwork({
            drawingInstructions,
            description,
            reflection,
            pixelCount,
            complexity: this._calculateComplexity(drawingInstructions)
          });
    
          await artwork.save();
          console.log(`✅ Artwork saved successfully! ID: ${artwork.id}`);
          return { artwork, stats: await this.getStats() };
        } catch (error) {
          console.error('❌ Error saving artwork:', error);
          throw new Error(`Failed to save artwork: ${error.message}`);
        }
      }
    async getStats() {
        try {
            const stats = await Stats.findOne({ id: 'global' });

            console.log('📊 Current Stats:');
            console.log(`   Total Creations: ${stats.totalCreations}`);
            console.log(`   Total Pixels: ${stats.totalPixels}`);

            return stats;
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
            throw new Error(`Failed to fetch stats: ${error.message}`);
        }
    }

    async getArtworks(limit = 50) {
        console.log(`📚 Fetching ${limit} most recent artworks...`);
        try {
            const artworks = await Artwork.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('id drawingInstructions description reflection createdAt votes complexity pixelCount');

            console.log(`✅ Retrieved ${artworks.length} artworks`);
            return artworks;
        } catch (error) {
            console.error('❌ Error fetching artworks:', error);
            throw new Error(`Failed to fetch artworks: ${error.message}`);
        }
    }

    _calculatePixelCount(instructions) {
        return instructions.elements.reduce((count, element) => {
            const pointCount = element.points?.length || 0;
            switch (element.type) {
                case 'circle':
                    const [x, y] = element.points[0];
                    const radius = element.points[1] ?
                        Math.hypot(element.points[1][0] - x, element.points[1][1] - y) :
                        50;
                    return count + Math.ceil(2 * Math.PI * radius);
                case 'line':
                    return count + (pointCount - 1) * 10;
                case 'wave':
                case 'spiral':
                    return count + pointCount * 20;
                default:
                    return count + pointCount * 10;
            }
        }, 0);
    }

    _calculateComplexity(instructions) {
        const elementWeights = {
            circle: 1,
            line: 1,
            wave: 2,
            spiral: 3
        };

        return Math.min(instructions.elements.reduce((score, element) =>
            score + (elementWeights[element.type] || 1) * (element.points?.length || 0), 0) / 100, 5);
    }

    async getArtwork(id) {
        console.log(`📚 Fetching artwork ${id}...`);
        try {
            const artwork = await Artwork.findById(id)
                .select('id drawingInstructions description reflection createdAt votes complexity pixelCount')
                .lean();
    
            if (!artwork) {
                console.log('⚠️ Artwork not found');
                return null;
            }
    
            console.log('✅ Artwork found');
            console.log('📝 Drawing Instructions:', artwork.drawingInstructions ? 'Present' : 'Missing');
            return artwork;
        } catch (error) {
            console.error('❌ Error fetching artwork:', error);
            throw new Error(`Failed to fetch artwork: ${error.message}`);
        }
    }
}

module.exports = {
    storageService: new StorageService()
};