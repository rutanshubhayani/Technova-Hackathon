import React, { useState, useEffect } from 'react';
import './Stations.css';

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [indiaStations, setIndiaStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('verified'); // 'verified' or 'india'
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [searchRadius, setSearchRadius] = useState(50);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchStations();
    fetchIndiaStations();
    
    // Refresh stations every 10 seconds to get newly verified stations
    const interval = setInterval(() => {
      fetchStations();
    }, 10000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch(`${API_URL}/stations`);
      const data = await response.json();

      if (response.ok) {
        setStations(data.stations || []);
        if (!data.stations || data.stations.length === 0) {
          setInfo('No verified stations available yet. Stations need to be added by owners and verified by admins.');
        } else {
          setInfo('');
        }
        setError('');
      } else {
        setError(data.error || 'Failed to fetch stations');
        setInfo('');
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Network error. Please check if the server is running on http://localhost:5000');
      setInfo('');
    } finally {
      setLoading(false);
    }
  };

  const fetchIndiaStations = async () => {
    try {
      const response = await fetch(`${API_URL}/india-stations`);
      const data = await response.json();

      if (data.success) {
        setIndiaStations(data.stations || []);
      }
    } catch (err) {
      console.error('Error fetching India stations:', err);
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setUserLocation({ lat, lng });
        setShowLocationSearch(true);

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          if (data.display_name) {
            setUserAddress(data.display_name);
          } else {
            setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch (err) {
          console.error('Error getting address:', err);
          setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }

        // Find nearby stations and calculate distances
        await findNearbyStations(lat, lng);
        setLocationLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location. Please enter address manually.');
        setLocationLoading(false);
        console.error('Geolocation error:', err);
      }
    );
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find nearby stations and calculate distances for all stations
  const findNearbyStations = async (lat, lng, radius = searchRadius) => {
    try {
      setLocationLoading(true);
      
      // Fetch all verified stations
      const verifiedResponse = await fetch(`${API_URL}/stations`);
      const verifiedData = await verifiedResponse.json();

      // Fetch all India stations
      const indiaResponse = await fetch(`${API_URL}/india-stations`);
      const indiaData = await indiaResponse.json();

      // Calculate distances for all stations
      const allStationsWithDistance = [
        ...(verifiedData.stations || []).map(s => {
          const distance = calculateDistance(lat, lng, s.latitude, s.longitude);
          return { ...s, source: 'verified', distance: distance ? Math.round(distance * 10) / 10 : null };
        }),
        ...(indiaData.stations || []).map(s => {
          const distance = calculateDistance(lat, lng, s.latitude, s.longitude);
          return { ...s, source: 'india', distance: distance ? Math.round(distance * 10) / 10 : null };
        })
      ];

      // Filter by radius and sort by distance
      const nearbyStations = allStationsWithDistance
        .filter(s => s.distance !== null && s.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      setNearbyStations(nearbyStations);
      setLocationLoading(false);
    } catch (err) {
      console.error('Error finding nearby stations:', err);
      setError('Error finding nearby stations');
      setLocationLoading(false);
    }
  };

  // Handle manual address search
  const handleAddressSearch = async () => {
    if (!userAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    setLocationLoading(true);
    setError('');

    try {
      // Geocode address to get coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userAddress)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setUserLocation({ lat, lng });
        setShowLocationSearch(true);
        setUserAddress(data[0].display_name || userAddress);
        await findNearbyStations(lat, lng);
      } else {
        setError('Address not found. Please try a different address.');
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
      setError('Error finding address. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Clear location search
  const clearLocationSearch = () => {
    setShowLocationSearch(false);
    setUserLocation(null);
    setUserAddress('');
    setNearbyStations([]);
    setSearchTerm('');
    // Refresh stations to remove distance calculations
    fetchStations();
    fetchIndiaStations();
  };

  // Get stations with distance calculation when location is set
  const getStationsWithDistance = (stationList) => {
    if (!userLocation) return stationList;
    
    return stationList.map(station => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        station.latitude, 
        station.longitude
      );
      return {
        ...station,
        distance: distance ? Math.round(distance * 10) / 10 : null
      };
    });
  };

  const filteredStations = showLocationSearch && nearbyStations.length > 0
    ? nearbyStations
    : (() => {
        const baseStations = activeTab === 'verified' ? stations : indiaStations;
        const filtered = baseStations.filter(station =>
          station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Add distance if location is set
        if (userLocation) {
          const withDistance = getStationsWithDistance(filtered);
          return withDistance.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        return filtered;
      })();

  if (loading) {
    return (
      <div className="stations-page">
        <div className="loading">Loading stations...</div>
      </div>
    );
  }

  return (
    <div className="stations-page">
      <div className="stations-container">
        <h2>📍 Charging Stations</h2>
        <p className="stations-description">
          Browse verified charging stations and India's public charging network.
        </p>

        <div className="stations-tabs">
          <button
            className={activeTab === 'verified' ? 'tab-active' : 'tab'}
            onClick={() => {
              setActiveTab('verified');
              fetchStations(); // Refresh when switching tabs
            }}
          >
            Verified Stations ({stations.length})
          </button>
          <button
            className={activeTab === 'india' ? 'tab-active' : 'tab'}
            onClick={() => {
              setActiveTab('india');
              fetchIndiaStations(); // Refresh when switching tabs
            }}
          >
            India Network ({indiaStations.length})
          </button>
          <button
            onClick={() => {
              fetchStations();
              fetchIndiaStations();
            }}
            className="btn-refresh-stations"
            title="Refresh stations"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="location-search-section">
          {!showLocationSearch ? (
            <div className="location-search-controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search by name, city, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="location-buttons">
                <button onClick={getCurrentLocation} className="btn-location" disabled={locationLoading}>
                  {locationLoading ? '📍 Getting Location...' : '📍 Use Current Location'}
                </button>
                <div className="or-divider">OR</div>
                <div className="address-input-group">
                  <input
                    type="text"
                    placeholder="Enter address (e.g., Connaught Place, Delhi)"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                    className="address-input"
                  />
                  <button onClick={handleAddressSearch} className="btn-search-address" disabled={locationLoading}>
                    Search
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="location-active-section">
              <div className="location-info">
                <span className="location-icon">📍</span>
                <div className="location-details">
                  <strong>Searching near:</strong>
                  <span>{userAddress || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}</span>
                </div>
                <div className="radius-control">
                  <label>Search Radius: </label>
                  <select value={searchRadius} onChange={(e) => {
                    const newRadius = parseInt(e.target.value);
                    setSearchRadius(newRadius);
                    if (userLocation) {
                      findNearbyStations(userLocation.lat, userLocation.lng, newRadius);
                    }
                  }}>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                    <option value="500">500 km (Show All)</option>
                  </select>
                  <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    Stations are sorted by distance
                  </span>
                </div>
                <button onClick={clearLocationSearch} className="btn-clear-location">
                  Clear Location
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {info && !error && <div className="info-message">{info}</div>}

        {locationLoading ? (
          <div className="loading">Finding nearby stations and calculating distances...</div>
        ) : filteredStations.length === 0 ? (
          <div className="no-stations">
            {showLocationSearch && nearbyStations.length === 0 ? (
              <div>
                <p>No stations found within {searchRadius} km of your location.</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  Try increasing the search radius (up to 500 km) or check a different location.
                </p>
              </div>
            ) : userLocation && filteredStations.length > 0 ? (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#e7f3ff', borderRadius: '8px', fontSize: '0.9rem' }}>
                💡 Stations are sorted by distance from your location. Distances shown on each station card.
              </div>
            ) : searchTerm ? (
              'No stations found matching your search.'
            ) : activeTab === 'verified' && stations.length === 0 ? (
              <div>
                <p>No verified stations available yet.</p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  To see stations here:
                  <br />1. Register as an owner account
                  <br />2. Login as admin and verify the owner
                  <br />3. Owner adds stations through their dashboard
                  <br />4. Admin verifies the stations
                </p>
              </div>
            ) : activeTab === 'india' && indiaStations.length === 0 ? (
              'No India network stations available.'
            ) : (
              'No stations found matching your search.'
            )}
          </div>
        ) : (
          <div className="stations-grid">
            {filteredStations.map((station) => (
              <div key={station.id} className="station-card">
                <div className="station-header">
                  <h3>{station.name}</h3>
                  <span className={`status-badge ${station.availability}`}>
                    {station.availability}
                  </span>
                </div>
                <div className="station-details">
                  <p className="station-address">
                    📍 {station.address}, {station.city}, {station.state} {station.zip_code}
                  </p>
                  <div className="station-specs">
                    <div className="spec-item">
                      <span className="spec-label">Connector:</span>
                      <span className="spec-value">{station.connector_type}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Power:</span>
                      <span className="spec-value">{station.power_kw} kW</span>
                    </div>
                    {station.owner_name && (
                      <div className="spec-item">
                        <span className="spec-label">Owner:</span>
                        <span className="spec-value">{station.owner_name}</span>
                      </div>
                    )}
                    {station.network && (
                      <div className="spec-item">
                        <span className="spec-label">Network:</span>
                        <span className="spec-value">{station.network}</span>
                      </div>
                    )}
                    {station.source === 'india_api' && (
                      <div className="spec-item">
                        <span className="spec-label">Source:</span>
                        <span className="spec-value">🇮🇳 India Network</span>
                      </div>
                    )}
                  </div>
                  {userLocation && station.distance !== undefined && station.distance !== null && (
                    <div className="distance-badge">
                      📏 {station.distance} km away
                    </div>
                  )}
                  {userLocation && station.latitude && station.longitude && station.distance === undefined && (
                    <div className="distance-badge distance-calculating">
                      📏 Calculating...
                    </div>
                  )}
                  {station.latitude && station.longitude && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a
                        href={`https://www.google.com/maps?q=${station.latitude},${station.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link"
                      >
                        🗺️ View on Map
                      </a>
                      {userLocation && station.distance !== undefined && station.distance !== null && (
                        <a
                          href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${station.latitude},${station.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          🧭 Get Directions
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!locationLoading && (
          <div className="stations-count">
            {showLocationSearch && nearbyStations.length > 0 ? (
              `Found ${filteredStations.length} station(s) within ${searchRadius} km of your location`
            ) : userLocation ? (
              `Showing ${filteredStations.length} ${activeTab === 'verified' ? 'verified' : 'India network'} stations sorted by distance from your location`
            ) : (
              `Showing ${filteredStations.length} of ${activeTab === 'verified' ? stations.length : indiaStations.length} ${activeTab === 'verified' ? 'verified' : 'India network'} stations`
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stations;

