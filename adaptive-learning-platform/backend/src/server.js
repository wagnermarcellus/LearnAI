require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const logger       = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const { connect }  = require('./config/database');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
}));
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  message:  { success: false, message: 'Muitas requisições. Tente novamente em breve.' },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/plans',      require('./routes/plans'));
app.use('/api/study-plan', require('./routes/studyPlan'));
app.use('/api/ai',         require('./routes/aiTutor'));
app.use('/api/progress',   require('./routes/progress'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Rota não encontrada' })
);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

connect()
  .then(() => {
    app.listen(PORT, () =>
      logger.info(`Servidor rodando na porta ${PORT} [${process.env.NODE_ENV || 'development'}]`)
    );
  })
  .catch((err) => {
    logger.error('Falha ao conectar ao MongoDB', { message: err.message });
    process.exit(1);
  });

module.exports = app;
