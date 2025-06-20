import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();             // Clear localStorage + state
    navigate('/driver-login'); // Navigate to login
    window.location.reload(); // optional: reloads the page (if necessary)
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">Prayaan Vihar - Fleet Management</div>
      <ul className="navbar-links">
        <li><Link to="/driver-dashboard">Dashboard</Link></li>
        <li><Link to="/trips">Trips</Link></li>
        <li><Link to="/TripStatus">Completed Trips</Link></li>
        <li><Link to="/DriverPayout">Payout</Link></li>
        <li><Link to="/earnings">Earnings</Link></li>
        <li><Link to="/documents">Documents</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/alerts">Alerts</Link></li>
        <li><Link to="/Support">Support</Link></li>
        <li><button className="logout-button" onClick={handleLogout}>Logout</button></li>
      </ul>
    </nav>
  );
};

export default Navbar;
