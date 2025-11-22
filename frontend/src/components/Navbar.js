import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-icon">
            <span className="lightning">⚡</span>
          </div>
          <div className="brand-text">
            <span className="brand-primary">EV Smart</span>
            <span className="brand-secondary">Assistant</span>
          </div>
        </Link>
        
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-icon">🏠</span>
              Home
            </Link>
            <Link to="/calculator/range" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-icon">🔋</span>
              Range Calculator
            </Link>
            <Link to="/calculator/route-check" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-icon">🗺️</span>
              Route Check
            </Link>
            <Link to="/stations" className="nav-link" onClick={closeMobileMenu}>
              <span className="nav-icon">📍</span>
              Stations
            </Link>
          </div>
          
          <div className="nav-auth">
            {isAuthenticated ? (
              <>
                {isOwner && (
                  <Link to="/owner/dashboard" className="nav-link dashboard-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">👤</span>
                    Owner
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin/dashboard" className="nav-link dashboard-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">👑</span>
                    Admin
                  </Link>
                )}
                <div className="nav-user">
                  <div className="user-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="username">{user?.username}</span>
                </div>
                <button onClick={handleLogout} className="nav-button logout-btn">
                  <span className="btn-icon">🚪</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link login-link" onClick={closeMobileMenu}>
                  <span className="nav-icon">🔑</span>
                  Login
                </Link>
                <Link to="/register" className="nav-button register-btn" onClick={closeMobileMenu}>
                  <span className="btn-icon">✨</span>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
