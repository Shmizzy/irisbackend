const { Kafka } = require('kafkajs');
const config = require('./config');
const State = require('../models/State');

const kafka = new Kafka(config.kafka);
const consumer = kafka.consumer({ groupId: 'backend-group' });

const handleStateUpdate = async (event) => {
  try {
    const state = await State.findOneAndUpdate(
      { currentStatus: { $exists: true } },
      {
        currentStatus: event.status,
        currentPhase: event.phase,
        currentIdea: event.idea,
        totalCreations: event.total_creations,
        totalPixelsDrawn: event.total_pixels,
        viewers: event.viewers,
        lastGenerationTime: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ State saved to MongoDB:', {
      status: state.currentStatus,
      phase: state.currentPhase,
      totalCreations: state.totalCreations
    });
  } catch (error) {
    console.error('❌ Error saving state:', error);
  }
};

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'state_update', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      console.log('📥 Received event:', {
        topic,
        type: event.type,
        status: event.status
      });

      if (event.type === 'state_update') {
        await handleStateUpdate(event);
      }
    },
  });
};

module.exports = { runConsumer };