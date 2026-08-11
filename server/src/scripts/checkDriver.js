const mongoose = require('mongoose');
const Problem = require('../models/Problem');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const p = await Problem.findOne({ title: "Plus One" });
  if (p) {
    console.log("=== USER DEFAULT CODE ===");
    console.log(p.defaultCode?.cpp);
    console.log("\n=== DRIVER CODE ===");
    console.log(p.driverCode?.cpp);
  } else {
    console.log("Problem not found.");
  }
  mongoose.connection.close();
}
check();
