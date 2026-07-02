const dns = require("dns");
// Fix: ISP DNS resolver blocks SRV records and causes Node.js DNS lookups to hang.
// This affects Clerk JWKS fetch, MongoDB SRV, etc. Setting Google DNS globally.
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("DSAstra Server Running");
});

const { clerkMiddleware } = require('@clerk/express');

app.use(clerkMiddleware());

// Remove manual auth routes, use userRoutes for syncing
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/problems", require("./routes/problemRoutes"));
app.use("/api/execute", require("./routes/executeRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/contests", require("./routes/contestRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

const connectDB = require("./config/db");
connectDB();
