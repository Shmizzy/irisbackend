const app = require('./app');
const mongoose = require('mongoose');
const { connectProducer } = require('./kafka/producer');
const { runConsumer } = require('./kafka/consumer');
const ArtGenerator = require('./utils/ArtGenerator').default;
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 3000;

console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? '✅' : '❌');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Connect to Kafka
    await connectProducer();
    console.log('✅ Kafka producer connected');
    
    // Start consumer
    runConsumer().catch(console.error);
    console.log('✅ Kafka consumer started');

    // Initialize art generator
    const artGenerator = new ArtGenerator();
    await artGenerator.initialize();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Backend service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer().catch(console.error);