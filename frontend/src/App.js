import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RangeCalculator from './pages/RangeCalculator';
import RouteCheck from './pages/RouteCheck';
import Stations from './pages/Stations';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/calculator/range" element={<RangeCalculator />} />
              <Route path="/calculator/route-check" element={<RouteCheck />} />
              <Route path="/stations" element={<Stations />} />
              <Route
                path="/owner/dashboard"
                element={
                  <PrivateRoute>
                    <OwnerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute requiredRole="admin">
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
