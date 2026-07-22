const UserBadge = require('../models/UserBadge');
const logger    = require('./logger');

const awardBadge = async (userId, badge) => {
  try {
    await UserBadge.create({ user_id: userId, badge });
  } catch (err) {
    if (err.code !== 11000) {
      logger.error('Erro ao conceder badge', { userId, badge, message: err.message });
    }
  }
};

module.exports = { awardBadge };
