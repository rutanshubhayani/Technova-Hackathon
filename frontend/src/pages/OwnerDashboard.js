import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const OwnerDashboard = () => {
  const { getToken, user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    connector_type: 'CCS',
    power_kw: '',
    availability: 'available'
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMyStations();
  }, []);

  const fetchMyStations = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/stations/owner/my-stations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStations(data.stations || []);
      } else {
        setError(data.error || 'Failed to fetch stations');
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = getToken();
      const url = editingStation
        ? `${API_URL}/stations/${editingStation.id}`
        : `${API_URL}/stations`;
      const method = editingStation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowForm(false);
        setEditingStation(null);
        resetForm();
        fetchMyStations();
      } else {
        setError(data.error || data.errors?.[0]?.msg || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      address: station.address,
      city: station.city,
      state: station.state,
      zip_code: station.zip_code || '',
      latitude: station.latitude || '',
      longitude: station.longitude || '',
      connector_type: station.connector_type,
      power_kw: station.power_kw,
      availability: station.availability
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this station?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/stations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        fetchMyStations();
      } else {
        setError(data.error || 'Failed to delete station');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: '',
      longitude: '',
      connector_type: 'CCS',
      power_kw: '',
      availability: 'available'
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStation(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>🏢 Owner Dashboard</h2>
          {!user?.is_verified && (
            <div className="warning-banner">
              ⚠️ Your account is pending verification. You cannot add stations until an admin verifies your account.
            </div>
          )}
          {user?.is_verified && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn-primary"
              disabled={showForm}
            >
              + Add New Station
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {showForm && user?.is_verified && (
          <div className="form-card">
            <h3>{editingStation ? 'Edit Station' : 'Add New Station'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Station Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Connector Type *</label>
                  <select
                    name="connector_type"
                    value={formData.connector_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="CCS">CCS</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="Type 2">Type 2</option>
                    <option value="Tesla Supercharger">Tesla Supercharger</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Power (kW) *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="power_kw"
                    value={formData.power_kw}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Availability *</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    required
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingStation ? 'Update Station' : 'Add Station'}
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="stations-list">
          <h3>My Stations ({stations.length})</h3>
          {stations.length === 0 ? (
            <div className="no-stations">You haven't added any stations yet.</div>
          ) : (
            <div className="stations-grid">
              {stations.map((station) => (
                <div key={station.id} className="station-card">
                  <div className="station-header">
                    <h4>{station.name}</h4>
                    <span className={`status-badge ${station.availability}`}>
                      {station.availability}
                    </span>
                  </div>
                  <div className="station-info">
                    <p>📍 {station.address}, {station.city}, {station.state}</p>
                    <p>🔌 {station.connector_type} | ⚡ {station.power_kw} kW</p>
                    <p className="verification-status">
                      {station.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
                    </p>
                  </div>
                  <div className="station-actions">
                    <button onClick={() => handleEdit(station)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(station.id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;

