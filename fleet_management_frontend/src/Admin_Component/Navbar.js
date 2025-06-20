import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import axios from 'axios';

const Navbar = () => {


  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/logout');
      localStorage.clear(); // or sessionStorage.clear() if you use that
      window.location.href = '/'; // or use navigate("/") if using useNavigate()
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };


  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Prayaan Vihar - Fleet Management</div>
      <div className={styles.links}>
        <Link className={styles.link} to="/admin-dashboard">Admin Dashboard</Link>
        <Link className={styles.link} to="/trip-page">Client Bookings</Link>
        <Link className={styles.link} to="/trip-history">Trip History</Link>
        <Link className={styles.link} to="/manage-driver">Manage Drivers</Link>
        <Link className={styles.link} to="/manage-vehicle">Manage Vehicles</Link>
        <Link className={styles.link} to="/manage-vendor">Manage Vendors</Link>
        <Link className={styles.link} to="/manage-clients">Manage Clients</Link>
        <Link className={styles.link} to="/contract-list">Manage Contracts</Link>
        <Link className={styles.link} to="/admin-alerts">Alerts</Link>
        <Link className={styles.link} to="/allnotification/:driverId">Send Notifications</Link>
        <Link className={styles.logoutButton} onClick={handleLogout}>Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;
