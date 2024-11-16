const { LRUCache } = require('lru-cache');
const { aiService } = require('../services/ai');
const { storageService } = require('../services/storage');
const { sendEvent } = require('../kafka/producer');
const { broadcast } = require('../routes/stream');
const { saveImage } = require('./imageStorage');

class ArtGenerator {
  constructor() {
    console.log('🎨 Initializing Zenith Art Generator...');
    this._initializeState();
    this._initializeCache();
    this._initializeRateLimiting();
    this.isProcessing = false;
    this.initialize();
  }

  _initializeState() {
    this.currentDrawing = null;
    this.currentState = [];
    this.currentStatus = "initializing";
    this.currentPhase = "initializing";
    this.currentIdea = null;
    this.currentReflection = null;
    this.totalCreations = 0;
    this.isRunning = false;
    this.generationInterval = 120;
    this.totalPixelsDrawn = 0;
    this.lastGenerationTime = new Date();
  }

  _initializeCache() {
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 60 * 24
    });
  }

  _initializeRateLimiting() {
    this.rateLimits = new Map();
    this.maxRequestsPerMinute = 60;
    this.pendingUpdates = new Set();
    this.updateInterval = setInterval(() => this.broadcastPendingUpdates(), 1000);
    
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 60000;
    this.lastFailureTime = 0;
    
    this.generationQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize() {
    console.log('\n=== Zenith Initialization ===');
    try {
      const stats = await storageService.getStats();
      this.totalCreations = stats.totalCreations;
      this.totalPixelsDrawn = stats.totalPixels;
      
      this.isRunning = true;
      console.log('⚡ System activated');
      console.log(`📊 Loaded stats: ${this.totalCreations} creations, ${this.totalPixelsDrawn} pixels`);
      
      await this.generateNewArtwork();
      this.startGenerationLoop();
      
      console.log('✅ Zenith initialization complete\n');
    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  }

  async generateNewArtwork() {
    if (this._isCircuitBreakerOpen() || this.isProcessing) {
      console.warn('Circuit breaker is open or already processing an artwork');
      return;
    }

    this.isProcessing = true;

    try {
      await this._generateArtworkPhases();
      await this._saveAndCacheArtwork();
      this.failureCount = 0;
    } catch (error) {
      this._handleGenerationError(error);
      throw error;
    }finally {
      this.isProcessing = false;
    }
  }

  async _generateArtworkPhases() {
    // Ideation Phase
    this._updateStatus("thinking", "ideation");
    this.currentIdea = await aiService.generateArtConcept();
    
    // Creation Phase
    this._updateStatus("drawing", "creation");
    const instructions = await aiService.generateDrawingInstructions(this.currentIdea);
    await this.broadcastInstructions(instructions);

    // Wait for the frontend to complete drawing
    await new Promise(resolve => setTimeout(resolve, 10000)); // Adjust the timeout as needed

    // Reflection Phase
    this._updateStatus("reflecting", "reflection");
    this.currentReflection = await aiService.generateReflection(this.currentIdea, instructions);
    await this.broadcastReflection(this.currentReflection);
  }

  async saveAndCacheArtwork(imageUrl) {
    try {
      this._updateStatus("saving", "storage");
      console.log('💾 Starting artwork storage process...');

      if (!this.currentDrawing?.instructions) {
        throw new Error('No drawing instructions available');
      }

      // Save to database and get updated stats
      console.log('🗄️ Saving to database...');
      const { artwork: savedArtwork, stats } = await storageService.saveArtwork({
        drawingInstructions: this.currentDrawing.instructions,
        description: this.currentIdea,
        reflection: this.currentReflection,
        imageUrl // Add the image URL
      });

      // Update local stats
      this.totalCreations = stats.totalCreations;
      this.totalPixelsDrawn = stats.totalPixels;

      // Cache the artwork
      const artworkId = `artwork_${Date.now()}`;
      this.cache.set(artworkId, {
        id: savedArtwork.id,
        idea: this.currentIdea,
        reflection: this.currentReflection,
        instructions: this.currentDrawing.instructions,
        imageUrl // Include image URL in cache
      });

      console.log(`✅ Artwork saved successfully! ID: ${savedArtwork.id}`);
      console.log(`🖼️ Image saved at: ${imageUrl}`);
      this._updateStatus("completed", "completed");

    } catch (error) {
      console.error('❌ Error saving artwork:', error);
      this._updateStatus("error", "storage");
      throw error;
    }
  }

  async broadcastInstructions(instructions) {
    console.log('📢 Broadcasting drawing instructions');
    
    this.currentDrawing = {
      instructions,
      timestamp: Date.now()
    };

    const message = {
      type: 'drawing_instructions',
      instructions
    };

    try {
      await sendEvent('drawing_instructions', message);
      broadcast(message);

      console.log('📡Drawing Instructions brodcasted successfully');
    } catch (error) {
      console.error('Error broadcasting instructions:', error);
    }
  }

  async broadcastReflection(reflection) {
    console.log('📢 Broadcasting reflection');
    const message = {
      type: 'reflection',
      reflection
    };

    try {
      await sendEvent('reflection', message);
      broadcast(message);

      console.log('📡 Reflection brodcasted successfully');
    } catch (error) {
      console.error('Error broadcasting reflection:', error);
    }
  }
  

  _updateStatus(status, phase) {
    this.currentStatus = status;
    this.currentPhase = phase;
    
    // Enhanced status logging
    const statusEmoji = {
      thinking: '🤔',
      drawing: '✏️',
      reflecting: '💭',
      saving: '💾',
      completed: '✨',
      error: '❌'
    };

    console.log(`${statusEmoji[status] || '➡️'} Status: ${status.toUpperCase()} - Phase: ${phase.toUpperCase()}`);
    this.broadcastState();
  }

  _isCircuitBreakerOpen() {
    if (this.failureCount >= this.failureThreshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      return timeSinceLastFailure < this.resetTimeout;
    }
    return false;
  }

  _handleGenerationError(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.error('Generation error:', error);
  }

  async startGenerationLoop() {
    console.log('🔄 Starting generation loop...');
    while (this.isRunning) {
      try {
        console.log('⏰ Waiting for next generation interval...');
        await new Promise(resolve => setTimeout(resolve, this.generationInterval * 1000));
        console.log('🎨 Starting new artwork cycle...');
        await this.generateNewArtwork();
      } catch (error) {
        console.error('❌ Generation loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  async broadcastState() {
    const state = {
      type: 'state_update',
      status: this.currentStatus,
      phase: this.currentPhase,
      idea: this.currentIdea,
      total_creations: this.totalCreations,
      total_pixels: this.totalPixelsDrawn,
      generation_time: Math.floor((new Date() - this.lastGenerationTime) / 1000),
      last_saved: this.cache.get(`artwork_${Date.now()}`)?.id
    };

    try {
      // Send to Kafka
      await sendEvent('state_update', state);
      // Broadcast to SSE clients
      broadcast(state);
      console.log('📡 State broadcasted successfully');
    } catch (error) {
      console.error('Error broadcasting state:', error);
    }
  }

 

  async sendCachedState(ws) {
    try {
      // Send most recent cached artwork
      const cachedArtworks = Array.from(this.cache.keys())
        .sort()
        .slice(-5); // Get 5 most recent

      for (const artworkId of cachedArtworks) {
        const artwork = this.cache.get(artworkId);
        if (artwork) {
          await sendEvent('cached_artwork', {
            type: 'cached_artwork',
            ...artwork
          });
        }
      }

      // Send current state
      await this.broadcastState();
    } catch (error) {
      console.error('Error sending cached state:', error);
    }
  }

  async broadcastPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();

    const message = {
      type: 'batch_update',
      updates
    };

    try {
      await sendEvent('pending_updates', message);
      broadcast(message);
      console.log('📡 pending updates brodcasted successfully');
    } catch (error) {
      console.error('Error broadcasting pending updates:', error);
    }
  }

  queueUpdate(update) {
    this.pendingUpdates.add(update);
  }


  cleanup() {
    clearInterval(this.updateInterval);
    this.cache.reset();
    this.rateLimits.clear();
    this.pendingUpdates.clear();
  }
}

module.exports = new ArtGenerator(); // Ensure the correct export