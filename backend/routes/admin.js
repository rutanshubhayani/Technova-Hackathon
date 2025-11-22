const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all owners (pending and verified)
router.get('/owners', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(
    `SELECT id, username, email, role, is_verified, created_at,
     (SELECT COUNT(*) FROM charging_stations WHERE owner_id = users.id) as station_count
     FROM users 
     WHERE role = 'owner' 
     ORDER BY created_at DESC`,
    (err, owners) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ owners });
    }
  );
});

// Verify owner
router.post('/owners/:id/verify', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.run(
    'UPDATE users SET is_verified = 1 WHERE id = ? AND role = ?',
    [req.params.id, 'owner'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      res.json({ message: 'Owner verified successfully' });
    }
  );
});

// Unverify owner
router.post('/owners/:id/unverify', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.run(
    'UPDATE users SET is_verified = 0 WHERE id = ? AND role = ?',
    [req.params.id, 'owner'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      res.json({ message: 'Owner unverified successfully' });
    }
  );
});

// Get all stations (including unverified)
router.get('/stations', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(
    `SELECT cs.*, u.username as owner_name, u.email as owner_email
     FROM charging_stations cs 
     JOIN users u ON cs.owner_id = u.id 
     ORDER BY cs.created_at DESC`,
    (err, stations) => {
      if (err) {
        console.error('Error fetching all stations:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      // Ensure is_verified is properly formatted
      const formattedStations = (stations || []).map(station => ({
        ...station,
        is_verified: station.is_verified === 1 || station.is_verified === true
      }));
      res.json({ stations: formattedStations });
    }
  );
});

// Verify station
router.post('/stations/:id/verify', (req, res) => {
  const dbInstance = db.getDb();
  const stationId = parseInt(req.params.id);
  
  if (isNaN(stationId)) {
    return res.status(400).json({ error: 'Invalid station ID' });
  }

  dbInstance.run(
    'UPDATE charging_stations SET is_verified = 1 WHERE id = ?',
    [stationId],
    function(err) {
      if (err) {
        console.error('Error verifying station:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Station not found' });
      }
      res.json({ 
        message: 'Station verified successfully',
        stationId: stationId
      });
    }
  );
});

// Unverify station
router.post('/stations/:id/unverify', (req, res) => {
  const dbInstance = db.getDb();
  const stationId = parseInt(req.params.id);
  
  if (isNaN(stationId)) {
    return res.status(400).json({ error: 'Invalid station ID' });
  }

  dbInstance.run(
    'UPDATE charging_stations SET is_verified = 0 WHERE id = ?',
    [stationId],
    function(err) {
      if (err) {
        console.error('Error unverifying station:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Station not found' });
      }
      res.json({ 
        message: 'Station unverified successfully',
        stationId: stationId
      });
    }
  );
});

// Get dashboard stats
router.get('/stats', (req, res) => {
  const dbInstance = db.getDb();
  
  const stats = {};
  let completed = 0;
  const total = 8;

  // Total users
  dbInstance.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['user'], (err, result) => {
    if (!err) stats.totalUsers = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Total owners
  dbInstance.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['owner'], (err, result) => {
    if (!err) stats.totalOwners = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Verified owners
  dbInstance.get('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_verified = 1', ['owner'], (err, result) => {
    if (!err) stats.verifiedOwners = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Pending owners
  dbInstance.get('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_verified = 0', ['owner'], (err, result) => {
    if (!err) stats.pendingOwners = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Total stations
  dbInstance.get('SELECT COUNT(*) as count FROM charging_stations', [], (err, result) => {
    if (!err) stats.totalStations = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Verified stations
  dbInstance.get('SELECT COUNT(*) as count FROM charging_stations WHERE is_verified = 1', [], (err, result) => {
    if (!err) stats.verifiedStations = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Pending stations
  dbInstance.get('SELECT COUNT(*) as count FROM charging_stations WHERE is_verified = 0', [], (err, result) => {
    if (!err) stats.pendingStations = result.count;
    completed++;
    if (completed === total) res.json({ stats });
  });

  // Total power capacity
  dbInstance.get('SELECT SUM(power_kw) as total FROM charging_stations WHERE is_verified = 1', [], (err, result) => {
    if (!err) stats.totalPowerCapacity = Math.round(result.total || 0);
    completed++;
    if (completed === total) res.json({ stats });
  });
});

module.exports = router;

