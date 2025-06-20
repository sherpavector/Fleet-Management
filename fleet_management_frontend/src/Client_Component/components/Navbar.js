import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
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
        <Link className={styles.link} to="/client-dashboard">Book Now</Link>
        <Link className={styles.link} to="/client-booking-history">Booking History</Link>        
        <Link className={styles.link} to="/client-billings">Payment History</Link>
        <Link className={styles.link} to="/user-profile">User Profile</Link>
        <Link className={styles.logoutButton} onClick={handleLogout}>Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;
