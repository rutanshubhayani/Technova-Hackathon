import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('owners');
  const [owners, setOwners] = useState([]);
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stationFilter, setStationFilter] = useState('all'); // 'all', 'verified', 'pending'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'status'

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Auto-refresh stats every 30 seconds when on stats tab
  useEffect(() => {
    if (activeTab === 'stats') {
      const interval = setInterval(() => {
        const token = getToken();
        fetch(`${API_URL}/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.stats) setStats(data.stats);
          })
          .catch(err => console.error('Error refreshing stats:', err));
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();

      if (activeTab === 'owners') {
        const response = await fetch(`${API_URL}/admin/owners`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setOwners(data.owners || []);
        }
      } else       if (activeTab === 'stations') {
        const response = await fetch(`${API_URL}/admin/stations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setStations(data.stations || []);
        } else {
          setError(data.error || 'Failed to fetch stations');
        }
      } else if (activeTab === 'stats') {
        const response = await fetch(`${API_URL}/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to fetch statistics');
        }
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOwner = async (id, verify = true) => {
    try {
      setError('');
      setSuccess('');
      const token = getToken();
      const endpoint = verify ? 'verify' : 'unverify';
      const response = await fetch(`${API_URL}/admin/owners/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Owner ${verify ? 'verified' : 'unverified'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        fetchData();
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error verifying owner:', err);
    }
  };

  const handleVerifyStation = async (id, verify = true) => {
    try {
      setError('');
      setSuccess('');
      const token = getToken();
      const endpoint = verify ? 'verify' : 'unverify';
      const response = await fetch(`${API_URL}/admin/stations/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Station ${verify ? 'verified' : 'unverified'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
        // Refresh both stations and stats
        await fetchData();
        // Also refresh stats if on stats tab
        if (activeTab === 'stats') {
          const statsResponse = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const statsData = await statsResponse.json();
          if (statsData.stats) setStats(statsData.stats);
        }
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error verifying station:', err);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h2>👨‍💼 Admin Dashboard</h2>

        <div className="admin-tabs">
          <button
            className={activeTab === 'owners' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('owners')}
          >
            Owners
          </button>
          <button
            className={activeTab === 'stations' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('stations')}
          >
            Stations
          </button>
          <button
            className={activeTab === 'stats' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'owners' && (
              <div className="admin-section">
                <h3>Owner Management</h3>
                {owners.length === 0 ? (
                  <div className="no-data">No owners found.</div>
                ) : (
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Stations</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {owners.map((owner) => (
                          <tr key={owner.id}>
                            <td>{owner.username}</td>
                            <td>{owner.email}</td>
                            <td>
                              <span className={owner.is_verified ? 'status-verified' : 'status-pending'}>
                                {owner.is_verified ? '✅ Verified' : '⏳ Pending'}
                              </span>
                            </td>
                            <td>{owner.station_count || 0}</td>
                            <td>
                              {owner.is_verified ? (
                                <button
                                  onClick={() => handleVerifyOwner(owner.id, false)}
                                  className="btn-unverify"
                                >
                                  Unverify
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyOwner(owner.id, true)}
                                  className="btn-verify"
                                >
                                  Verify
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stations' && (
              <div className="admin-section">
                <div className="section-header">
                  <h3>Station Management</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        fetchData();
                        setSuccess('Stations refreshed');
                        setTimeout(() => setSuccess(''), 2000);
                      }} 
                      className="btn-refresh" 
                      title="Refresh stations"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>
                <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  View all stations added by owners. Click "Verify" to make them visible to users on the Stations page.
                </p>
                
                {stations.length > 0 && (
                  <div className="filter-controls">
                    <div className="filter-group">
                      <label>Filter: </label>
                      <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}>
                        <option value="all">All Stations ({stations.length})</option>
                        <option value="verified">Verified ({stations.filter(s => s.is_verified === 1 || s.is_verified === true).length})</option>
                        <option value="pending">Pending ({stations.filter(s => !(s.is_verified === 1 || s.is_verified === true)).length})</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Sort by: </label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date">Date Added</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                      </select>
                    </div>
                  </div>
                )}

                {stations.length === 0 ? (
                  <div className="no-data">No stations found. Owners need to add stations first.</div>
                ) : (
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Location</th>
                          <th>Connector</th>
                          <th>Power</th>
                          <th>Owner</th>
                          <th>Added</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations
                          .filter(station => {
                            // Handle both boolean and integer (0/1) formats
                            const isVerified = station.is_verified === 1 || station.is_verified === true;
                            if (stationFilter === 'verified') return isVerified;
                            if (stationFilter === 'pending') return !isVerified;
                            return true;
                          })
                          .sort((a, b) => {
                            if (sortBy === 'name') {
                              return a.name.localeCompare(b.name);
                            } else if (sortBy === 'status') {
                              const aVerified = a.is_verified === 1 || a.is_verified === true;
                              const bVerified = b.is_verified === 1 || b.is_verified === true;
                              return (bVerified ? 1 : 0) - (aVerified ? 1 : 0);
                            } else {
                              return new Date(b.created_at) - new Date(a.created_at);
                            }
                          })
                          .map((station) => {
                            const isVerified = station.is_verified === 1 || station.is_verified === true;
                            return (
                              <tr key={station.id} className={isVerified ? 'row-verified' : 'row-pending'}>
                                <td><strong>{station.name}</strong></td>
                                <td>{station.city}, {station.state}</td>
                                <td>{station.connector_type}</td>
                                <td>{station.power_kw} kW</td>
                                <td>{station.owner_name || station.owner_email}</td>
                                <td>{new Date(station.created_at).toLocaleDateString()}</td>
                                <td>
                                  <span className={isVerified ? 'status-verified' : 'status-pending'}>
                                    {isVerified ? '✅ Verified' : '⏳ Pending'}
                                  </span>
                                </td>
                                <td>
                                  {isVerified ? (
                                    <button
                                      onClick={() => handleVerifyStation(station.id, false)}
                                      className="btn-unverify"
                                      title="Click to unverify this station"
                                    >
                                      Unverify
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleVerifyStation(station.id, true)}
                                      className="btn-verify"
                                      title="Click to verify this station"
                                    >
                                      Verify
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="admin-section">
                <div className="section-header">
                  <h3>Platform Statistics</h3>
                  <button onClick={fetchData} className="btn-refresh" title="Refresh statistics">
                    🔄 Refresh
                  </button>
                </div>
                {stats ? (
                  <>
                    <div className="stats-grid">
                      <div className="stat-card stat-primary">
                        <div className="stat-value">{stats.totalUsers || 0}</div>
                        <div className="stat-label">Total Users</div>
                      </div>
                      <div className="stat-card stat-primary">
                        <div className="stat-value">{stats.totalOwners || 0}</div>
                        <div className="stat-label">Total Owners</div>
                        <div className="stat-sublabel">
                          {stats.verifiedOwners || 0} verified, {stats.pendingOwners || 0} pending
                        </div>
                      </div>
                      <div className="stat-card stat-primary">
                        <div className="stat-value">{stats.totalStations || 0}</div>
                        <div className="stat-label">Total Stations</div>
                        <div className="stat-sublabel">
                          {stats.verifiedStations || 0} verified, {stats.pendingStations || 0} pending
                        </div>
                      </div>
                      <div className="stat-card stat-success">
                        <div className="stat-value">{stats.verifiedStations || 0}</div>
                        <div className="stat-label">Verified Stations</div>
                        <div className="stat-sublabel">
                          {stats.totalStations > 0 
                            ? Math.round((stats.verifiedStations / stats.totalStations) * 100) 
                            : 0}% verification rate
                        </div>
                      </div>
                      <div className="stat-card stat-warning">
                        <div className="stat-value">{stats.pendingStations || 0}</div>
                        <div className="stat-label">Pending Verification</div>
                        <div className="stat-sublabel">Awaiting admin approval</div>
                      </div>
                      <div className="stat-card stat-info">
                        <div className="stat-value">{stats.totalPowerCapacity || 0}</div>
                        <div className="stat-label">Total Power Capacity</div>
                        <div className="stat-sublabel">kW (verified stations)</div>
                      </div>
                    </div>
                    
                    <div className="stats-details">
                      <div className="detail-card">
                        <h4>Owner Statistics</h4>
                        <div className="detail-item">
                          <span>Total Owners:</span>
                          <strong>{stats.totalOwners || 0}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Verified Owners:</span>
                          <strong className="text-success">{stats.verifiedOwners || 0}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Pending Owners:</span>
                          <strong className="text-warning">{stats.pendingOwners || 0}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Verification Rate:</span>
                          <strong>
                            {stats.totalOwners > 0 
                              ? Math.round((stats.verifiedOwners / stats.totalOwners) * 100) 
                              : 0}%
                          </strong>
                        </div>
                      </div>
                      
                      <div className="detail-card">
                        <h4>Station Statistics</h4>
                        <div className="detail-item">
                          <span>Total Stations:</span>
                          <strong>{stats.totalStations || 0}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Verified Stations:</span>
                          <strong className="text-success">{stats.verifiedStations || 0}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Pending Stations:</span>
                          <strong className="text-warning">{stats.pendingStations || 0}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Verification Rate:</span>
                          <strong>
                            {stats.totalStations > 0 
                              ? Math.round((stats.verifiedStations / stats.totalStations) * 100) 
                              : 0}%
                          </strong>
                        </div>
                        <div className="detail-item">
                          <span>Total Power Capacity:</span>
                          <strong>{stats.totalPowerCapacity || 0} kW</strong>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-data">Loading statistics...</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

