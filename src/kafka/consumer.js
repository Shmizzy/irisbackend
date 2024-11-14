const { Kafka } = require('kafkajs');
const config = require('./config');

const kafka = new Kafka(config.kafka);
const consumer = kafka.consumer({ groupId: 'backend-group' });

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'artwork_events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      console.log({
        partition,
        offset: message.offset,
        value: event,
      });
    },
  });
};

module.exports = { runConsumer };