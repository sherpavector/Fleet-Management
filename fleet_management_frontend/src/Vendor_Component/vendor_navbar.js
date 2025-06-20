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
      window.location.href = '/vendor-login'; // or use navigate("/") if using useNavigate()
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };


  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Prayaan Vihar - Fleet Management</div>
      <div className={styles.links}>
        <Link className={styles.link} to="/vendor-dashboard">Dashboard</Link>
        <Link className={styles.link} to="/vendor-client-bookings">Client Bookings</Link>
        <Link className={styles.link} to="/view-trips">Trip History</Link>
        <Link className={styles.link} to="/vendor-manage-driver">Manage Drivers</Link>
        <Link className={styles.link} to="/vendor-driver-earnings">Driver Payment</Link>
        <Link className={styles.link} to="/vendor-manage-vehicle">Manage Vehicles</Link>
        <Link className={styles.link} to="/vendor-payout-request">View Payout Request</Link>
        <Link className={styles.link} to="/service-schedule">Service Schedule</Link>
        <Link className={styles.link} to="/sub-office">Manage SubOffice</Link>
        <Link className={styles.link} to="/vendor-alerts">Notification</Link>
        <Link className={styles.link} to="/vendor-send-message">Send Alert to Driver</Link>
        <Link className={styles.logoutButton} onClick={handleLogout}>Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;
