const { Kafka } = require('kafkajs');
const config = require('./config');

const kafka = new Kafka(config.kafka);
const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

const sendEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
};

module.exports = { connectProducer, sendEvent };