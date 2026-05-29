const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const canteenRoutes = require('./src/routes/canteenRoutes');
const facultyRoutes = require('./src/routes/facultyRoutes');
const navigationRoutes = require('./src/routes/navigationRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const campusKnowledgeRoutes = require('./src/routes/campusKnowledgeRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CHRIST Intelli-Bot API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/canteen', canteenRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/places', adminRoutes);
app.use('/api/campus-brain', campusKnowledgeRoutes);
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

console.log("Backend Engine Active");

let server;

const { exec } = require('child_process');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully.");
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Auto-Healing ADB Watchdog
      console.log("Establishing ADB USB Bridge Watchdog...");
      setInterval(() => {
        exec('C:\\Android\\sdk\\platform-tools\\adb.exe reverse tcp:5000 tcp:5000', (error) => {
          // Silent fail on error, just keep trying to heal
        });
      }, 3000); // Check and heal every 3 seconds
      console.log(`ADB Bridge Watchdog Active: Auto-healing USB tunnel on disconnect.`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message || err);
    process.exit(1);
  });

// Graceful Shutdown
const shutdown = () => {
  console.log("\nInitiating graceful shutdown...");
  if (server) {
    server.close(async () => {
      console.log("Express server closed.");
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
