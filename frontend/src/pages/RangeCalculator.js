import React, { useState } from 'react';
import './Calculator.css';

const RangeCalculator = () => {
  const [formData, setFormData] = useState({
    batteryPercentage: '',
    batteryCapacity: '60',
    efficiency: '20'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Destination check states
  const [showDestinationCheck, setShowDestinationCheck] = useState(false);
  const [destinationData, setDestinationData] = useState({
    origin: '',
    destination: '',
    useCurrentLocation: false
  });
  const [destinationResult, setDestinationResult] = useState(null);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [destinationError, setDestinationError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/calculator/range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batteryPercentage: parseFloat(formData.batteryPercentage),
          batteryCapacity: parseFloat(formData.batteryCapacity),
          efficiency: parseFloat(formData.efficiency)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setShowDestinationCheck(true); // Show destination check after range calculation
      } else {
        setError(data.error || data.errors?.[0]?.msg || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDestinationError('Geolocation is not supported by your browser');
      return;
    }

    setDestinationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setDestinationData({
            ...destinationData,
            origin: address,
            useCurrentLocation: true
          });
        } catch (err) {
          setDestinationData({
            ...destinationData,
            origin: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            useCurrentLocation: true
          });
        }
        setDestinationLoading(false);
      },
      (err) => {
        setDestinationError('Unable to retrieve your location. Please enter address manually.');
        setDestinationLoading(false);
      }
    );
  };

  // Check destination reachability
  const handleDestinationCheck = async (e) => {
    e.preventDefault();
    setDestinationError('');
    setDestinationLoading(true);
    setDestinationResult(null);

    if (!result) {
      setDestinationError('Please calculate range first');
      setDestinationLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/calculator/destination-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: destinationData.origin,
          destination: destinationData.destination,
          batteryPercentage: parseFloat(formData.batteryPercentage),
          batteryCapacity: parseFloat(formData.batteryCapacity),
          efficiency: parseFloat(formData.efficiency),
          currentRange: result.range.kilometers,
          useCurrentLocation: destinationData.useCurrentLocation
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDestinationResult(data);
      } else {
        setDestinationError(data.error || data.errors?.[0]?.msg || 'An error occurred');
      }
    } catch (err) {
      setDestinationError('Network error. Please check if the server is running.');
    } finally {
      setDestinationLoading(false);
    }
  };

  return (
    <div className="calculator-page">
      <div className="calculator-container">
        <h2>🔋 Battery Range Calculator</h2>
        <p className="calculator-description">
          Calculate your EV's travel range based on current battery percentage and vehicle specifications.
        </p>

        <form onSubmit={handleSubmit} className="calculator-form">
          <div className="form-group">
            <label>Current Battery Percentage (%)</label>
            <input
              type="number"
              name="batteryPercentage"
              value={formData.batteryPercentage}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 75"
            />
          </div>

          <div className="form-group">
            <label>Battery Capacity (kWh)</label>
            <input
              type="number"
              name="batteryCapacity"
              value={formData.batteryCapacity}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 60"
            />
            <small>Default: 60 kWh (typical EV battery)</small>
          </div>

          <div className="form-group">
            <label>Efficiency (kWh per 100 km)</label>
            <input
              type="number"
              name="efficiency"
              value={formData.efficiency}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 20"
            />
            <small>Default: 20 kWh/100km (average EV efficiency)</small>
          </div>

          <button type="submit" className="calculate-button" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Range'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="result-card">
            <h3>Range Estimate</h3>
            <div className="result-grid">
              <div className="result-item">
                <div className="result-label">Kilometers</div>
                <div className="result-value">{result.range.kilometers} km</div>
              </div>
              <div className="result-item">
                <div className="result-label">Miles</div>
                <div className="result-value">{result.range.miles} mi</div>
              </div>
              <div className="result-item">
                <div className="result-label">Available Energy</div>
                <div className="result-value">{result.availableEnergy} kWh</div>
              </div>
            </div>
          </div>
        )}

        {showDestinationCheck && result && (
          <div className="destination-check-section">
            <h3>📍 Check Destination Reachability</h3>
            <p className="calculator-description">
              Enter your origin and destination to check if you can reach it with your current battery range.
            </p>

            <form onSubmit={handleDestinationCheck} className="calculator-form">
              <div className="form-group">
                <label>Origin (Starting Point)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={destinationData.origin}
                    onChange={(e) => setDestinationData({ ...destinationData, origin: e.target.value })}
                    placeholder="Enter your starting address"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={destinationLoading}
                    className="btn-current-location"
                    style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}
                  >
                    📍 Use Current Location
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Destination</label>
                <input
                  type="text"
                  value={destinationData.destination}
                  onChange={(e) => setDestinationData({ ...destinationData, destination: e.target.value })}
                  placeholder="Enter your destination address"
                  required
                />
              </div>

              <button type="submit" className="calculate-button" disabled={destinationLoading}>
                {destinationLoading ? 'Checking...' : 'Check Destination'}
              </button>
            </form>

            {destinationError && <div className="error-message">{destinationError}</div>}

            {destinationResult && (
              <div className="result-card" style={{ marginTop: '1.5rem' }}>
                <h3>Destination Check Results</h3>
                
                <div className="result-grid">
                  <div className="result-item">
                    <div className="result-label">Distance</div>
                    <div className="result-value">{destinationResult.distance.kilometers} km</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Your Range</div>
                    <div className="result-value">{destinationResult.currentRange.kilometers} km</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Status</div>
                    <div className={`result-value ${destinationResult.isReachable ? 'status-reachable' : 'status-unreachable'}`}>
                      {destinationResult.isReachable ? '✅ Reachable' : '⚠️ Charging Required'}
                    </div>
                  </div>
                </div>

                <div className="recommendation-box" style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: destinationResult.isReachable ? '#d4edda' : '#fff3cd',
                  border: `1px solid ${destinationResult.isReachable ? '#c3e6cb' : '#ffeaa7'}`
                }}>
                  <strong>{destinationResult.recommendation}</strong>
                  {!destinationResult.isReachable && destinationResult.batteryNeeded > 0 && (
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                      You need approximately <strong>{destinationResult.batteryNeeded}%</strong> more battery.
                    </p>
                  )}
                </div>

                {!destinationResult.isReachable && destinationResult.chargingStations && destinationResult.chargingStations.length > 0 && (
                  <div className="charging-stations-recommendation" style={{ marginTop: '1.5rem' }}>
                    <h4>🔌 Recommended Charging Stations</h4>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                      Here are the best charging stations along your route:
                    </p>
                    <div className="stations-list">
                      {destinationResult.chargingStations.slice(0, 5).map((station, index) => (
                        <div key={station.id || index} className="station-recommendation-card" style={{
                          padding: '1rem',
                          marginBottom: '0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{station.name}</h5>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                                📍 {station.address}, {station.city}, {station.state}
                              </p>
                              <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                                🔌 {station.connector_type} | ⚡ {station.power_kw} kW
                              </p>
                              {station.distance !== undefined && (
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', fontWeight: '600', color: '#667eea' }}>
                                  📏 {station.distance} km from your route
                                </p>
                              )}
                            </div>
                            {station.latitude && station.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${station.latitude},${station.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link"
                                style={{ marginLeft: '1rem' }}
                              >
                                🗺️ Map
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!destinationResult.isReachable && (!destinationResult.chargingStations || destinationResult.chargingStations.length === 0) && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#666' }}>
                      No charging stations found along your route. Please check the Stations page for available charging points.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RangeCalculator;

