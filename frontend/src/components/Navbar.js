import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          ⚡ EV Smart Assistant
        </Link>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/calculator/range" className="nav-link">Range Calculator</Link>
          <Link to="/calculator/route-check" className="nav-link">Route Check</Link>
          <Link to="/stations" className="nav-link">Stations</Link>
          
          {isAuthenticated ? (
            <>
              {isOwner && (
                <Link to="/owner/dashboard" className="nav-link">Owner Dashboard</Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="nav-link">Admin Dashboard</Link>
              )}
              <span className="nav-user">Welcome, {user?.username}</span>
              <button onClick={handleLogout} className="nav-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-button">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
