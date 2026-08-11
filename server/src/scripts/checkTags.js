const mongoose = require('mongoose');
const Problem = require('../models/Problem');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const tags = await Problem.distinct('tags');
  console.log(tags.slice(0, 50));
  mongoose.connection.close();
}
check();
