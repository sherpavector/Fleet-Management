import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from "./Navbar";
import styles from '../styles/AdminAlertsPage.module.css';

const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'Vendor', or 'Driver'

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/alerts');
      setAlerts(res.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Filter alerts based on selected filter
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'All') return true;
    return alert.senderType === filter;
  });

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Admin - Alerts Panel</h1>

        <div style={{ marginBottom: '1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <label htmlFor="filter" style={{ marginRight: '0.5rem' }}>Filter by Sender:</label>
          <select
            id="filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}
          >
            <option value="All">All</option>
            <option value="Vendor">Vendor</option>
            <option value="Driver">Driver</option>
          </select>
        </div>

        <div className={styles.grid}>
          {filteredAlerts.length === 0 ? (
            <p>No alerts to display.</p>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.AlertID} className={styles.card}>
                <div className={styles.alertType}>{alert.AlertType}</div>
                <p className={styles.alertText}>
                  <strong>Details:</strong> {alert.AlertDetails}
                </p>
                <p className={styles.alertText}><strong>Sent By:</strong> {alert.senderType}</p>
                <p className={styles.alertText}>
                  <strong>Time:</strong> {new Date(alert.AlertTime).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAlertsPage;
