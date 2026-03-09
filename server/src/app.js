const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AlgoPilot AI Server Running");
});

const { clerkMiddleware } = require('@clerk/express');

app.use(clerkMiddleware());

// Remove manual auth routes, use userRoutes for syncing
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

const connectDB = require("./config/db");
connectDB();