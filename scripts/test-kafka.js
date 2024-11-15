const { Kafka } = require('kafkajs');
const config = require('../src/kafka/config');

const testKafka = async () => {
  const kafka = new Kafka(config.kafka);
  const admin = kafka.admin();
  const producer = kafka.producer();
  const consumer = kafka.consumer({ 
    groupId: 'test-group',
    sessionTimeout: 30000,
    heartbeatInterval: 3000
  });

  try {
    console.log('Connecting to Kafka...');
    await admin.connect();
    console.log('✅ Admin connected');

    const topicName = 'test-topic';

    // Create topic
    await admin.createTopics({
      topics: [{ 
        topic: topicName,
        numPartitions: 1,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '604800000' }
        ]
      }]
    });
    console.log('✅ Test topic created');

    // Test producer
    await producer.connect();
    await producer.send({
      topic: topicName,
      messages: [{ value: 'test message' }]
    });
    console.log('✅ Test message sent');

    // Test consumer
    await consumer.connect();
    await consumer.subscribe({ topic: topicName, fromBeginning: true });
    
    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ message }) => {
        console.log('✅ Received message:', message.value.toString());
        await consumer.disconnect();
        await producer.disconnect();
        await admin.disconnect();
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Kafka test failed:', error);
    process.exit(1);
  }
};

testKafka().catch(console.error);