import React, { useEffect, useState } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import AdminProfile from './AdminProfile';
import styles from '../styles/AdminDashboard.module.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    driverCount: 0,
    vehicleCount: 0,
    vendorCount: 0,
    bookingCount: 0,
    pendingBookings: 0,
    paidBookings: 0,
    vehicleStatusSummary: {
      moving: 0,
      stopped: 0,
      inactive: 0,
    },
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/admin-dashboard', { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to fetch admin dashboard stats:', err));
  }, []);

  const cardData = [
    {
      title: <Link to="/manage-driver" style={{ textDecoration: "none", color: "#333" }}>Total Drivers</Link>,
      value: stats.driverCount,
      icon: <Link to="/manage-driver"><PeopleIcon style={{ fontSize: "100px", color: "#1a3c74" }} /></Link>,
    },
    {
      title: <Link to="/manage-vehicle" style={{ textDecoration: "none", color: "#333" }}>Total Vehicles</Link>,
      value: stats.vehicleCount,
      icon: <Link to="/manage-vehicle"><LocalShippingIcon style={{ fontSize: "100px", color: "#1a3c74" }} /></Link>,
    },
    {
      title: <Link to="/manage-vendor" style={{ textDecoration: "none", color: "#333" }}>Total Vendors</Link>,
      value: stats.vendorCount,
      icon: <Link to="/manage-vendor"><BusinessIcon style={{ fontSize: "100px", color: "#1a3c74" }} /></Link>,
    },
    {
      title: <Link to="/trip-page" style={{ textDecoration: "none", color: "#333" }}>Requested Trips</Link>,
      value: stats.pendingBookings,
      icon: <Link to="/trip-page"><ReceiptIcon style={{ fontSize: "100px", color: "#1a3c74" }} /></Link>,
    },
    {
      title: <Link to="/trip-page" style={{ textDecoration: "none", color: "#333" }}>Ongoing Trips</Link>,
      value: stats.bookingCount,
      icon: <Link to="/trip-page"><ReceiptIcon style={{ fontSize: "100px", color: "#1a3c74" }} /></Link>,
    },
    {
      title: <Link to="/trip-page" style={{ textDecoration: "none", color: "#333" }}>Completed Trips</Link>,
      value: stats.paidBookings,
      icon: <Link to="/trip-history"><ReceiptIcon style={{ fontSize: "100px", color: "#1a3c74" }} /></Link>,
    },

  ];

  return (
    <>
      <Navbar />
      <AdminProfile />
      <div className={styles.dashboardContainer}>
        <h4 className={styles.title}>
          Admin Dashboard
        </h4>
        <div className={styles.adminContainer}>
          {cardData.map((item, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardContent}>
                <div>
                  <h6 className={styles.cardTitle}>
                    {item.title}
                  </h6>
                  <h4 className={styles.cardValue}>
                    {item.value}
                  </h4>
                </div>
                <div>{item.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
