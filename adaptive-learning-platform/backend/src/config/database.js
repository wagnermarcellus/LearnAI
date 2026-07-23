const mongoose = require('mongoose');
const logger   = require('../utils/logger');

mongoose.connection.on('error', (err) => {
  logger.error('Erro na conexão com o MongoDB', { message: err.message });
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const connect = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive_learning';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      logger.info('Conectado ao MongoDB');
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      logger.error(`Falha ao conectar ao MongoDB (tentativa ${attempt}/${MAX_RETRIES})`, { message: err.message });
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

module.exports = { connect, mongoose };
