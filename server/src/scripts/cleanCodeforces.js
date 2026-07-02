const dns = require("dns");
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dsastra");

const cleanDB = async () => {
  try {
    console.log("Fetching Codeforces problems...");
    
    // Find all Codeforces problems, sorted by newest first
    const cfProblems = await Problem.find({ platform: "Codeforces" }).sort({ _id: -1 });
    
    // We only care if there are more than 100
    if (cfProblems.length > 100) {
      // Get the IDs of the 100 we want to KEEP
      const idsToKeep = cfProblems.slice(0, 100).map(p => p._id);
      
      // Delete every Codeforces problem that is NOT IN our "keep" list
      const result = await Problem.deleteMany({
        platform: "Codeforces",
        _id: { $nin: idsToKeep }
      });
      
      console.log(`🧹 Cleanup complete! Deleted ${result.deletedCount} Codeforces problems.`);
    } else {
      console.log(`Only found ${cfProblems.length} Codeforces problems. Nothing deleted.`);
    }
  } catch (error) {
    console.error("Error cleaning up:", error);
  } finally {
    process.exit();
  }
};

cleanDB();
