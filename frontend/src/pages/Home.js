import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🌱</span>
            <span>Sustainable Transportation</span>
          </div>
          <h1>
            <span className="gradient-text">EV Smart Route</span>
            <br />
            <span className="highlight">& Charging Assistant</span>
          </h1>
          <p className="hero-subtitle">
            Experience the future of electric vehicle travel with intelligent route planning, 
            precise range calculations, and verified charging station networks.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">45+</div>
              <div className="stat-label">Verified Stations</div>
            </div>
            <div className="stat">
              <div className="stat-number">98%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
          <div className="hero-buttons">
            <Link to="/calculator/range" className="btn btn-primary">
              <span className="btn-icon">🔋</span>
              Calculate Range
            </Link>
            <Link to="/calculator/route-check" className="btn btn-secondary">
              <span className="btn-icon">🗺️</span>
              Check Route
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card">
            <div className="card-icon">⚡</div>
            <div className="card-content">
              <div className="card-title">Live Tracking</div>
              <div className="card-subtitle">Real-time battery monitoring</div>
            </div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">📍</div>
            <div className="card-content">
              <div className="card-title">Smart Navigation</div>
              <div className="card-subtitle">Optimal route planning</div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features for Smart EV Travel</h2>
            <p>Everything you need to make your electric vehicle journey smooth and efficient</p>
          </div>
          
          <div className="features">
            <div className="feature-card">
              <div className="feature-header">
                <div className="feature-icon">🔋</div>
                <h3>Intelligent Range Calculator</h3>
              </div>
              <p>Get precise range estimates based on your vehicle's battery status, driving conditions, and real-world efficiency data.</p>
              <div className="feature-highlights">
                <span className="highlight-tag">AI-Powered</span>
                <span className="highlight-tag">Real-time Data</span>
              </div>
              <Link to="/calculator/range" className="feature-link">
                Try Calculator 
                <span className="link-arrow">→</span>
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <div className="feature-icon">🗺️</div>
                <h3>Smart Route Validation</h3>
              </div>
              <p>Instantly verify if your destination is reachable and get recommendations for charging stops along your route.</p>
              <div className="feature-highlights">
                <span className="highlight-tag">Instant Results</span>
                <span className="highlight-tag">Smart Alerts</span>
              </div>
              <Link to="/calculator/route-check" className="feature-link">
                Check Route 
                <span className="link-arrow">→</span>
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <div className="feature-icon">📍</div>
                <h3>Verified Station Network</h3>
              </div>
              <p>Access our curated database of owner-verified charging stations with real-time availability and authentic reviews.</p>
              <div className="feature-highlights">
                <span className="highlight-tag">Owner Verified</span>
                <span className="highlight-tag">Live Status</span>
              </div>
              <Link to="/stations" className="feature-link">
                Browse Stations 
                <span className="link-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="workflow-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Three simple steps to optimize your EV journey</p>
          </div>
          
          <div className="workflow">
            <div className="workflow-step">
              <div className="step-visual">
                <div className="step-number">1</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h4>Input Your Details</h4>
                <p>Enter your current battery level, vehicle specifications, and destination to get started with personalized calculations.</p>
              </div>
            </div>
            
            <div className="workflow-step">
              <div className="step-visual">
                <div className="step-number">2</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h4>Get Smart Analysis</h4>
                <p>Our AI analyzes your data against real-world conditions to provide accurate range estimates and route feasibility.</p>
              </div>
            </div>
            
            <div className="workflow-step">
              <div className="step-visual">
                <div className="step-number">3</div>
              </div>
              <div className="step-content">
                <h4>Travel with Confidence</h4>
                <p>Follow our recommendations and find verified charging stations to ensure a smooth and stress-free journey.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Smart EV Journey?</h2>
            <p>Join thousands of EV owners who trust our platform for reliable travel planning</p>
            <div className="cta-buttons">
              <Link to="/calculator/range" className="btn btn-primary btn-large">
                Get Started Now
              </Link>
              <Link to="/stations" className="btn btn-outline btn-large">
                Explore Stations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

