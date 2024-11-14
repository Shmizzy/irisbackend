require('dotenv').config();

const ENV = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

module.exports = { ENV };