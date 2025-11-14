
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.send("Backend server is running correctly!");
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
