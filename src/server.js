const app = require('./app');
const { connectProducer } = require('./kafka/producer');
const { runConsumer } = require('./kafka/consumer');
const ArtGenerator = require('./utils/ArtGenerator').default;

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectProducer(); 
  runConsumer().catch(console.error); 

  const artGenerator = new ArtGenerator();
  await artGenerator.initialize();

  app.listen(PORT, () => {
    console.log(`Backend service is running on port ${PORT}`);
  });
};

startServer().catch(console.error);