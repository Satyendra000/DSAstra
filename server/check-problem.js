const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Problem = require('./src/models/Problem');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const problem = await Problem.findById("69c76634a40fb171836b3cb0");
    if (!problem) {
      console.log("Problem not found!");
    } else {
      console.log("Title:", problem.title);
      console.log("Platform:", problem.platform);
      console.log("DriverCode CPP:", problem.driverCode?.cpp);
    }
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
