const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all verified stations (public)
router.get('/', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(
    `SELECT cs.*, u.username as owner_name 
     FROM charging_stations cs 
     JOIN users u ON cs.owner_id = u.id 
     WHERE cs.is_verified = 1 
     ORDER BY cs.created_at DESC`,
    (err, stations) => {
      if (err) {
        console.error('Error fetching verified stations:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      // Ensure is_verified is properly set (SQLite stores as 0/1, convert to boolean for consistency)
      const formattedStations = (stations || []).map(station => ({
        ...station,
        is_verified: station.is_verified === 1 || station.is_verified === true
      }));
      res.json({ stations: formattedStations });
    }
  );
});

// Get station by ID
router.get('/:id', (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.get(
    `SELECT cs.*, u.username as owner_name 
     FROM charging_stations cs 
     JOIN users u ON cs.owner_id = u.id 
     WHERE cs.id = ? AND cs.is_verified = 1`,
    [req.params.id],
    (err, station) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
      res.json({ station });
    }
  );
});

// Create station (owner only)
router.post('/', authenticate, authorize('owner', 'admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('connector_type').trim().notEmpty().withMessage('Connector type is required'),
  body('power_kw').isFloat({ min: 0 }).withMessage('Power must be positive'),
  body('latitude').optional().isFloat().withMessage('Latitude must be a number'),
  body('longitude').optional().isFloat().withMessage('Longitude must be a number')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if owner is verified
    if (req.user.role === 'owner' && !req.user.is_verified) {
      return res.status(403).json({ error: 'Owner account must be verified by admin to add stations' });
    }

    const {
      name,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      connector_type,
      power_kw,
      availability = 'available'
    } = req.body;

    const dbInstance = db.getDb();
    dbInstance.run(
      `INSERT INTO charging_stations 
       (name, address, city, state, zip_code, latitude, longitude, connector_type, power_kw, availability, owner_id, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, address, city, state, zip_code || null, latitude || null, longitude || null, connector_type, power_kw, availability, req.user.id, req.user.role === 'admin' ? 1 : 0],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error creating station' });
        }

        dbInstance.get('SELECT * FROM charging_stations WHERE id = ?', [this.lastID], (err, station) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching created station' });
          }
          res.status(201).json({
            message: 'Station created successfully',
            station
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update station (owner of station or admin)
router.put('/:id', authenticate, authorize('owner', 'admin'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('power_kw').optional().isFloat({ min: 0 }).withMessage('Power must be positive')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dbInstance = db.getDb();
    
    // Check if station exists and user has permission
    dbInstance.get('SELECT * FROM charging_stations WHERE id = ?', [req.params.id], (err, station) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      // Check permission
      if (req.user.role === 'owner' && station.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own stations' });
      }

      // Build update query
      const updates = [];
      const values = [];

      Object.keys(req.body).forEach(key => {
        if (['name', 'address', 'city', 'state', 'zip_code', 'latitude', 'longitude', 'connector_type', 'power_kw', 'availability'].includes(key)) {
          updates.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);

      dbInstance.run(
        `UPDATE charging_stations SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error updating station' });
          }

          dbInstance.get('SELECT * FROM charging_stations WHERE id = ?', [req.params.id], (err, updatedStation) => {
            if (err) {
              return res.status(500).json({ error: 'Error fetching updated station' });
            }
            res.json({
              message: 'Station updated successfully',
              station: updatedStation
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete station (owner of station or admin)
router.delete('/:id', authenticate, authorize('owner', 'admin'), (req, res) => {
  const dbInstance = db.getDb();
  
  dbInstance.get('SELECT * FROM charging_stations WHERE id = ?', [req.params.id], (err, station) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check permission
    if (req.user.role === 'owner' && station.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own stations' });
    }

    dbInstance.run('DELETE FROM charging_stations WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting station' });
      }
      res.json({ message: 'Station deleted successfully' });
    });
  });
});

// Get owner's stations
router.get('/owner/my-stations', authenticate, authorize('owner', 'admin'), (req, res) => {
  const dbInstance = db.getDb();
  dbInstance.all(
    'SELECT * FROM charging_stations WHERE owner_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, stations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ stations });
    }
  );
});

// Search stations by location (find nearest)
router.get('/search/nearby', (req, res) => {
  const { lat, lng, radius = 50 } = req.query; // radius in km

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  if (isNaN(userLat) || isNaN(userLng) || isNaN(radiusKm)) {
    return res.status(400).json({ error: 'Invalid coordinates or radius' });
  }

  const dbInstance = db.getDb();
  dbInstance.all(
    `SELECT cs.*, u.username as owner_name 
     FROM charging_stations cs 
     JOIN users u ON cs.owner_id = u.id 
     WHERE cs.is_verified = 1 
     AND cs.latitude IS NOT NULL 
     AND cs.longitude IS NOT NULL`,
    (err, stations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const stationsWithDistance = stations.map(station => {
        const dLat = (station.latitude - userLat) * Math.PI / 180;
        const dLng = (station.longitude - userLng) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(station.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return { ...station, distance: Math.round(distance * 10) / 10 };
      });

      // Filter by radius and sort by distance
      const nearbyStations = stationsWithDistance
        .filter(s => s.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      res.json({
        stations: nearbyStations,
        total: nearbyStations.length,
        location: { lat: userLat, lng: userLng },
        radius: radiusKm
      });
    }
  );
});

module.exports = router;

