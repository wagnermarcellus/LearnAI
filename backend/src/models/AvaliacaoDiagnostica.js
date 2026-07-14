const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Ajuste o caminho da sua conexão

const AvaliacaoDiagnostica = sequelize.define('AvaliacaoDiagnostica', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nota: {
    type: DataTypes.DECIMAL(4, 2), // Suporta notas como 7.50, 9.80, etc.
    allowNull: false
  },
  nivel: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'avaliacoes_diagnosticas',
  timestamps: true // Cria automaticamente as colunas createdAt e updatedAt
});

module.exports = AvaliacaoDiagnostica;
