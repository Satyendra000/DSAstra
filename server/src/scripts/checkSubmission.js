const mongoose = require('mongoose');
const Submission = require('../models/Submission');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const subs = await Submission.find({ problemId: "6a52898295aa3daecf863a9b" }).sort({ createdAt: -1 }).limit(1);
  if (subs.length > 0) {
    console.log("=== USER SUBMITTED CODE ===");
    console.log(subs[0].code);
  } else {
    console.log("No submissions found.");
  }
  mongoose.connection.close();
}
check();
