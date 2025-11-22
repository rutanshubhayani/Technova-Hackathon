const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const stationRoutes = require('./routes/stations');
const calculatorRoutes = require('./routes/calculator');
const adminRoutes = require('./routes/admin');
const indiaStationsRoutes = require('./routes/indiaStations');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database and start server
db.init()
  .then(() => {
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/stations', stationRoutes);
    app.use('/api/calculator', calculatorRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/india-stations', indiaStationsRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'EV Smart Assistant API is running' });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

