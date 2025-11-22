import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './Calculator.css';

const RouteCheck = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      delay: 50,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100
    });
  }, []);

  const [formData, setFormData] = useState({
    distance: '',
    batteryPercentage: '',
    batteryCapacity: '60',
    efficiency: '20',
    unit: 'km',
    origin: '',
    destination: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch(`${API_URL}/calculator/route-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          distance: parseFloat(formData.distance),
          batteryPercentage: parseFloat(formData.batteryPercentage),
          batteryCapacity: parseFloat(formData.batteryCapacity),
          efficiency: parseFloat(formData.efficiency),
          unit: formData.unit,
          origin: formData.origin.trim(),
          destination: formData.destination.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || data.errors?.[0]?.msg || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-page">
      <div className="calculator-container">
        <h2 data-aos="fade-down">🗺️ Smart Route Feasibility Check</h2>
        <p className="calculator-description" data-aos="fade-up" data-aos-delay="100">
          Enter your destination distance to instantly know if you can reach it or need to charge.
        </p>

        <form onSubmit={handleSubmit} className="calculator-form" data-aos="fade-up" data-aos-delay="200">
          <div className="form-group" data-aos="fade-right" data-aos-delay="300">
            <label>Origin (Optional)</label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              placeholder="e.g., Toronto, ON or Current Location"
            />
            <small>Enter your starting point to check charging stations along the route</small>
          </div>

          <div className="form-group" data-aos="fade-left" data-aos-delay="400">
            <label>Destination (Optional)</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Montreal, QC"
            />
            <small>Enter your destination to check charging stations along the route</small>
          </div>

        <div className="form-group" data-aos="fade-right" data-aos-delay="500">
  <label>Destination Distance</label>
  <div className="input-with-unit">
    <input
      type="number"
      name="distance"
      value={formData.distance}
      onChange={handleChange}
      required
      min="0"
      step="0.1"
      placeholder="e.g., 150"
    />
    <select
      name="unit"
      value={formData.unit}
      onChange={handleChange}
      className="unit-select"
    >
      <option value="km">km</option>
      <option value="miles">miles</option>
    </select>
  </div>
</div>

          <div className="form-group" data-aos="fade-left" data-aos-delay="600">
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

          <div className="form-group" data-aos="fade-right" data-aos-delay="700">
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
            <small>Default: 60 kWh</small>
          </div>

          <div className="form-group" data-aos="fade-left" data-aos-delay="800">
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
            <small>Default: 20 kWh/100km</small>
          </div>

          <button type="submit" className="calculate-button" disabled={loading} data-aos="zoom-in" data-aos-delay="900">
            {loading ? 'Checking...' : 'Check Route'}
          </button>
        </form>

        {error && <div className="error-message" data-aos="fade-in">{error}</div>}

        {result && (
          <div className="result-card" data-aos="fade-up" data-aos-delay="100">
            <div className={`route-status ${result.isReachable ? 'reachable' : 'charging-required'}`} data-aos="zoom-in" data-aos-delay="200">
              <h3>{result.isReachable ? '✅ Reachable' : '⚠️ Charging Required'}</h3>
              <p className="recommendation">{result.recommendation}</p>
            </div>

            {/* Station Warning Alert */}
            {result.chargingStations && result.chargingStations.warning && (
              <div className={`station-warning alert-${result.chargingStations.warning.level}`} data-aos="slide-down" data-aos-delay="300">
                <div className="warning-header">
                  <span className="warning-icon">
                    {result.chargingStations.warning.level === 'high' ? '🚨' : 
                     result.chargingStations.warning.level === 'medium' ? '⚠️' : '💡'}
                  </span>
                  <h4>
                    {result.chargingStations.warning.level === 'high' ? 'Critical Alert' : 
                     result.chargingStations.warning.level === 'medium' ? 'Important Notice' : 'Travel Tip'}
                  </h4>
                </div>
                <p className="warning-message">{result.chargingStations.warning.message}</p>
                <div className="station-count">
                  Available Stations: {result.chargingStations.count}
                </div>
              </div>
            )}

            <div className="result-grid" data-aos="fade-up" data-aos-delay="400">
              <div className="result-item" data-aos="slide-up" data-aos-delay="500">
                <div className="result-label">Distance</div>
                <div className="result-value">
                  {result.distance.kilometers} km<br />
                  <small>({result.distance.miles} mi)</small>
                </div>
              </div>
              <div className="result-item" data-aos="slide-up" data-aos-delay="600">
                <div className="result-label">Current Range</div>
                <div className="result-value">
                  {result.currentRange.kilometers} km<br />
                  <small>({result.currentRange.miles} mi)</small>
                </div>
              </div>
              {!result.isReachable && (
                <>
                  <div className="result-item" data-aos="slide-up" data-aos-delay="700">
                    <div className="result-label">Battery Needed</div>
                    <div className="result-value">{result.batteryNeeded}%</div>
                  </div>
                  <div className="result-item" data-aos="slide-up" data-aos-delay="800">
                    <div className="result-label">Additional Range Needed</div>
                    <div className="result-value">
                      {result.remainingRange.kilometers} km<br />
                      <small>({result.remainingRange.miles} mi)</small>
                    </div>
                  </div>
                </>
              )}
              {result.isReachable && (
                <div className="result-item" data-aos="slide-up" data-aos-delay="700">
                  <div className="result-label">Remaining Range</div>
                  <div className="result-value">
                    {result.remainingRange.kilometers} km<br />
                    <small>({result.remainingRange.miles} mi)</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteCheck;

