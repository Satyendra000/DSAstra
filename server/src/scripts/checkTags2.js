const mongoose = require('mongoose');
const Problem = require('../models/Problem');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const dpLower = await Problem.countDocuments({ tags: 'dp' });
  const dpUpper = await Problem.countDocuments({ tags: 'Dynamic Programming' });
  console.log(`Problems with 'dp': ${dpLower}`);
  console.log(`Problems with 'Dynamic Programming': ${dpUpper}`);
  mongoose.connection.close();
}
check();
