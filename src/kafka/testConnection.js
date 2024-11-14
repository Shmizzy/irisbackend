const { Kafka } = require('kafkajs');
const config = require('./config');

const kafka = new Kafka(config.kafka);

const testConnection = async () => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    console.log('✅ Connected to Kafka');
    await admin.disconnect();
  } catch (error) {
    console.error('❌ Failed to connect to Kafka:', error);
  }
};
testConnection();