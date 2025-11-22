const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Average EV efficiency (kWh per 100 km)
const AVERAGE_EFFICIENCY = 20; // kWh per 100 km
const DEFAULT_BATTERY_CAPACITY = 60; // kWh

// Calculate battery range
router.post('/range', [
  body('batteryPercentage').isFloat({ min: 0, max: 100 }).withMessage('Battery percentage must be between 0 and 100'),
  body('batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
  body('efficiency').optional().isFloat({ min: 0 }).withMessage('Efficiency must be positive')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { batteryPercentage, batteryCapacity = DEFAULT_BATTERY_CAPACITY, efficiency = AVERAGE_EFFICIENCY } = req.body;

    // Calculate available energy
    const availableEnergy = (batteryPercentage / 100) * batteryCapacity;

    // Calculate range in km
    const rangeKm = (availableEnergy / efficiency) * 100;

    // Convert to miles (1 km = 0.621371 miles)
    const rangeMiles = rangeKm * 0.621371;

    res.json({
      batteryPercentage,
      batteryCapacity,
      efficiency,
      range: {
        kilometers: Math.round(rangeKm * 10) / 10,
        miles: Math.round(rangeMiles * 10) / 10
      },
      availableEnergy: Math.round(availableEnergy * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check route feasibility
router.post('/route-check', [
  body('distance').isFloat({ min: 0 }).withMessage('Distance must be positive'),
  body('batteryPercentage').isFloat({ min: 0, max: 100 }).withMessage('Battery percentage must be between 0 and 100'),
  body('batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
  body('efficiency').optional().isFloat({ min: 0 }).withMessage('Efficiency must be positive'),
  body('unit').optional().isIn(['km', 'miles']).withMessage('Unit must be km or miles')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      distance, 
      batteryPercentage, 
      batteryCapacity = DEFAULT_BATTERY_CAPACITY, 
      efficiency = AVERAGE_EFFICIENCY,
      unit = 'km'
    } = req.body;

    // Convert distance to km if in miles
    const distanceKm = unit === 'miles' ? distance * 1.60934 : distance;

    // Calculate available energy
    const availableEnergy = (batteryPercentage / 100) * batteryCapacity;

    // Calculate range in km
    const rangeKm = (availableEnergy / efficiency) * 100;

    // Check feasibility
    const isReachable = rangeKm >= distanceKm;
    const remainingRange = rangeKm - distanceKm;
    const batteryNeeded = isReachable ? 0 : ((distanceKm - rangeKm) / (efficiency / 100)) / batteryCapacity * 100;

    res.json({
      distance: {
        kilometers: Math.round(distanceKm * 10) / 10,
        miles: Math.round(distanceKm * 0.621371 * 10) / 10
      },
      currentRange: {
        kilometers: Math.round(rangeKm * 10) / 10,
        miles: Math.round(rangeKm * 0.621371 * 10) / 10
      },
      isReachable,
      remainingRange: {
        kilometers: Math.round(remainingRange * 10) / 10,
        miles: Math.round(remainingRange * 0.621371 * 10) / 10
      },
      recommendation: isReachable 
        ? 'Reachable - You have sufficient battery to reach your destination'
        : `Charging Required - You need approximately ${Math.round(batteryNeeded)}% more battery or ${Math.round((distanceKm - rangeKm) * 10) / 10} km more range`,
      batteryNeeded: isReachable ? 0 : Math.round(batteryNeeded * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check destination reachability and find charging stations
router.post('/destination-check', [
  body('origin').notEmpty().withMessage('Origin is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('batteryPercentage').isFloat({ min: 0, max: 100 }).withMessage('Battery percentage must be between 0 and 100'),
  body('batteryCapacity').optional().isFloat({ min: 0 }).withMessage('Battery capacity must be positive'),
  body('efficiency').optional().isFloat({ min: 0 }).withMessage('Efficiency must be positive'),
  body('currentRange').isFloat({ min: 0 }).withMessage('Current range must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      origin, 
      destination, 
      batteryPercentage, 
      batteryCapacity = DEFAULT_BATTERY_CAPACITY, 
      efficiency = AVERAGE_EFFICIENCY,
      currentRange,
      useCurrentLocation = false
    } = req.body;

    // Geocode origin
    let originLat, originLng;
    if (useCurrentLocation && origin.includes(',')) {
      // Extract coordinates if provided as lat,lng
      const coords = origin.split(',').map(c => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        originLat = coords[0];
        originLng = coords[1];
      }
    }
    
    if (!originLat || !originLng) {
      try {
        const originResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origin)}&limit=1`
        );
        const originData = await originResponse.json();
        if (!originData || originData.length === 0) {
          return res.status(400).json({ error: 'Origin address not found' });
        }
        originLat = parseFloat(originData[0].lat);
        originLng = parseFloat(originData[0].lon);
      } catch (err) {
        return res.status(400).json({ error: 'Error geocoding origin address' });
      }
    }

    // Geocode destination
    let destLat, destLng;
    try {
      const destResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`
      );
      const destData = await destResponse.json();
      if (!destData || destData.length === 0) {
        return res.status(400).json({ error: 'Destination address not found' });
      }
      destLat = parseFloat(destData[0].lat);
      destLng = parseFloat(destData[0].lon);
    } catch (err) {
      return res.status(400).json({ error: 'Error geocoding destination address' });
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLng = (destLng - originLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Check if reachable
    const isReachable = currentRange >= distanceKm;
    const remainingRange = currentRange - distanceKm;
    const batteryNeeded = isReachable ? 0 : ((distanceKm - currentRange) / (efficiency / 100)) / batteryCapacity * 100;

    // Find charging stations if not reachable
    let chargingStations = [];
    if (!isReachable) {
      try {
        const db = require('../config/database');
        const dbInstance = db.getDb();

        // Get verified stations from database
        dbInstance.all(
          `SELECT cs.*, u.username as owner_name 
           FROM charging_stations cs 
           JOIN users u ON cs.owner_id = u.id 
           WHERE cs.is_verified = 1 AND cs.latitude IS NOT NULL AND cs.longitude IS NOT NULL`,
          async (err, verifiedStations) => {
            if (err) {
              console.error('Error fetching stations:', err);
            } else {
              // Calculate midpoint of route for finding nearby stations
              const midLat = (originLat + destLat) / 2;
              const midLng = (originLng + destLng) / 2;

              // Calculate distance from route midpoint to each station
              const stationsWithDistance = (verifiedStations || []).map(station => {
                const stationLat = parseFloat(station.latitude);
                const stationLng = parseFloat(station.longitude);
                
                if (isNaN(stationLat) || isNaN(stationLng)) return null;

                const R = 6371;
                const dLat = (stationLat - midLat) * Math.PI / 180;
                const dLng = (stationLng - midLng) * Math.PI / 180;
                const a = 
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(midLat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                return {
                  ...station,
                  distance: Math.round(distance * 10) / 10,
                  source: 'verified'
                };
              }).filter(s => s !== null && s.distance <= 50); // Within 50km of route midpoint

              // Also get India stations - access sample data from route
              try {
                // Access the sample data from indiaStations route
                const indiaStationsModule = require('./indiaStations');
                // The sample data is in the route file, we'll use http request instead
                const http = require('http');
                
                const getIndiaStations = () => {
                  return new Promise((resolve) => {
                    const options = {
                      hostname: 'localhost',
                      port: process.env.PORT || 5000,
                      path: '/api/india-stations',
                      method: 'GET',
                      timeout: 2000
                    };
                    
                    const req = http.request(options, (res) => {
                      let data = '';
                      res.on('data', (chunk) => { data += chunk; });
                      res.on('end', () => {
                        try {
                          const parsed = JSON.parse(data);
                          resolve(parsed.success && parsed.stations ? parsed.stations : []);
                        } catch (e) {
                          resolve([]);
                        }
                      });
                    });
                    
                    req.on('error', () => resolve([]));
                    req.on('timeout', () => {
                      req.destroy();
                      resolve([]);
                    });
                    
                    req.end();
                  });
                };
                
                const indiaStationsList = await getIndiaStations();
                
                if (indiaStationsList && indiaStationsList.length > 0) {
                  const indiaStationsWithDistance = indiaStationsList.map(station => {
                    const stationLat = parseFloat(station.latitude);
                    const stationLng = parseFloat(station.longitude);
                    
                    if (isNaN(stationLat) || isNaN(stationLng)) return null;

                    const R = 6371;
                    const dLat = (stationLat - midLat) * Math.PI / 180;
                    const dLng = (stationLng - midLng) * Math.PI / 180;
                    const a = 
                      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(midLat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) *
                      Math.sin(dLng / 2) * Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c;

                    return {
                      ...station,
                      distance: Math.round(distance * 10) / 10,
                      source: 'india'
                    };
                  }).filter(s => s !== null && s.distance <= 50);

                  chargingStations = [...stationsWithDistance, ...indiaStationsWithDistance]
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 10); // Top 10 nearest
                } else {
                  chargingStations = stationsWithDistance
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 10);
                }
              } catch (err) {
                console.error('Error fetching India stations:', err);
                chargingStations = stationsWithDistance
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 10);
              }
            }

            res.json({
              distance: {
                kilometers: Math.round(distanceKm * 10) / 10,
                miles: Math.round(distanceKm * 0.621371 * 10) / 10
              },
              currentRange: {
                kilometers: Math.round(currentRange * 10) / 10,
                miles: Math.round(currentRange * 0.621371 * 10) / 10
              },
              isReachable,
              remainingRange: {
                kilometers: Math.round(remainingRange * 10) / 10,
                miles: Math.round(remainingRange * 0.621371 * 10) / 10
              },
              recommendation: isReachable 
                ? 'Reachable - You have sufficient battery to reach your destination'
                : `Charging Required - You need approximately ${Math.round(batteryNeeded)}% more battery or ${Math.round((distanceKm - currentRange) * 10) / 10} km more range`,
              batteryNeeded: isReachable ? 0 : Math.round(batteryNeeded * 10) / 10,
              chargingStations
            });
          }
        );
      } catch (err) {
        console.error('Error finding charging stations:', err);
        res.json({
          distance: {
            kilometers: Math.round(distanceKm * 10) / 10,
            miles: Math.round(distanceKm * 0.621371 * 10) / 10
          },
          currentRange: {
            kilometers: Math.round(currentRange * 10) / 10,
            miles: Math.round(currentRange * 0.621371 * 10) / 10
          },
          isReachable,
          remainingRange: {
            kilometers: Math.round(remainingRange * 10) / 10,
            miles: Math.round(remainingRange * 0.621371 * 10) / 10
          },
          recommendation: isReachable 
            ? 'Reachable - You have sufficient battery to reach your destination'
            : `Charging Required - You need approximately ${Math.round(batteryNeeded)}% more battery or ${Math.round((distanceKm - currentRange) * 10) / 10} km more range`,
          batteryNeeded: isReachable ? 0 : Math.round(batteryNeeded * 10) / 10,
          chargingStations: []
        });
      }
    } else {
      res.json({
        distance: {
          kilometers: Math.round(distanceKm * 10) / 10,
          miles: Math.round(distanceKm * 0.621371 * 10) / 10
        },
        currentRange: {
          kilometers: Math.round(currentRange * 10) / 10,
          miles: Math.round(currentRange * 0.621371 * 10) / 10
        },
        isReachable,
        remainingRange: {
          kilometers: Math.round(remainingRange * 10) / 10,
          miles: Math.round(remainingRange * 0.621371 * 10) / 10
        },
        recommendation: 'Reachable - You have sufficient battery to reach your destination',
        batteryNeeded: 0,
        chargingStations: []
      });
    }
  } catch (error) {
    console.error('Destination check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

