import React, { useState } from 'react';
import './Calculator.css';

const RouteCheck = () => {
  const [formData, setFormData] = useState({
    distance: '',
    batteryPercentage: '',
    batteryCapacity: '60',
    efficiency: '20',
    unit: 'km'
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
          unit: formData.unit
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
        <h2>🗺️ Smart Route Feasibility Check</h2>
        <p className="calculator-description">
          Enter your destination distance to instantly know if you can reach it or need to charge.
        </p>

        <form onSubmit={handleSubmit} className="calculator-form">
        <div className="form-group">
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
            <small>Default: 60 kWh</small>
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
            <small>Default: 20 kWh/100km</small>
          </div>

          <button type="submit" className="calculate-button" disabled={loading}>
            {loading ? 'Checking...' : 'Check Route'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="result-card">
            <div className={`route-status ${result.isReachable ? 'reachable' : 'charging-required'}`}>
              <h3>{result.isReachable ? '✅ Reachable' : '⚠️ Charging Required'}</h3>
              <p className="recommendation">{result.recommendation}</p>
            </div>

            <div className="result-grid">
              <div className="result-item">
                <div className="result-label">Distance</div>
                <div className="result-value">
                  {result.distance.kilometers} km<br />
                  <small>({result.distance.miles} mi)</small>
                </div>
              </div>
              <div className="result-item">
                <div className="result-label">Current Range</div>
                <div className="result-value">
                  {result.currentRange.kilometers} km<br />
                  <small>({result.currentRange.miles} mi)</small>
                </div>
              </div>
              {!result.isReachable && (
                <>
                  <div className="result-item">
                    <div className="result-label">Battery Needed</div>
                    <div className="result-value">{result.batteryNeeded}%</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">Additional Range Needed</div>
                    <div className="result-value">
                      {result.remainingRange.kilometers} km<br />
                      <small>({result.remainingRange.miles} mi)</small>
                    </div>
                  </div>
                </>
              )}
              {result.isReachable && (
                <div className="result-item">
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

