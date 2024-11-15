const { Kafka } = require('kafkajs');
const config = require('../src/kafka/config');

const topics = [
  'artwork_events',
  'state_update',
  'cached_artwork',
  'pending_updates'
];

const createTopics = async () => {
  const kafka = new Kafka(config.kafka);
  const admin = kafka.admin();

  try {
    await admin.connect();
    console.log('Creating topics...');
    
    await admin.createTopics({
      topics: topics.map(topic => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1
      }))
    });

    console.log('✅ Topics created successfully');
  } catch (error) {
    console.error('❌ Error creating topics:', error);
  } finally {
    await admin.disconnect();
  }
};

createTopics();