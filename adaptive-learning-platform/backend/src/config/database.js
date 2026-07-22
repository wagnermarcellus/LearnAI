const mongoose = require('mongoose');
const logger   = require('../utils/logger');

mongoose.connection.on('error', (err) => {
  logger.error('Erro na conexão com o MongoDB', { message: err.message });
});

const connect = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive_learning';
  await mongoose.connect(uri);
  logger.info('Conectado ao MongoDB');
};

module.exports = { connect, mongoose };
