const path = require('path');
const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');

require(path.join(backendNodeModules, 'dotenv')).config({
  path: path.join(__dirname, '..', 'backend', '.env'),
});
const bcrypt = require(path.join(backendNodeModules, 'bcryptjs'));
const { connect, mongoose } = require('../backend/src/config/database');
const User = require('../backend/src/models/User');

async function seed() {
  await connect();

  const exists = await User.findOne({ email: 'admin@platform.com' });
  if (!exists) {
    await User.create({
      name: 'Administrador',
      email: 'admin@platform.com',
      password_hash: await bcrypt.hash('Admin@123', 12),
      role: 'admin',
    });
    console.log('Usuário admin criado.');
  } else {
    console.log('Usuário admin já existe.');
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
