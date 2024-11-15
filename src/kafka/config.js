module.exports = {
  kafka: {
    clientId: 'backend-service',
    brokers: ['localhost:9092'], 
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  }
};