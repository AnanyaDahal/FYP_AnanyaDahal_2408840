// const express = require("express");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Import routes
// const urlRoutes = require("./routes/urlRoutes");
// // const emailRoutes = require("./routes/emailRoutes"); // uncomment if email API exists

// // Use routes
// app.use("/api", urlRoutes);
// // app.use("/api", emailRoutes); 

// // Default route
// app.get("/", (req, res) => {
//   res.send("Backend server is running correctly!");
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const urlRoutes = require("./routes/urlRoutes");
const emailRoutes = require("./routes/emailRoutes");

// Use routes
app.use("/api", urlRoutes);
app.use("/api", emailRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Backend server is running correctly!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
