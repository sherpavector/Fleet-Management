import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AlertSender.css';
import VendorNavbar from './vendor_navbar';

const Alerts = ({ driverData }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchAlerts = async () => {
            const vendorID = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;
            try {
                const response = await axios.get(`http://localhost:5000/api/vendor/alerts?vendorId=${vendorID}`);
                if (response.data.success) {
                    setAlerts(response.data.alerts);
                } else {
                    setError('Failed to fetch alerts');
                }
            } catch (err) {
                setError('Error fetching alerts');
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);


    return (
        <>
            <VendorNavbar />
            <div className="alertsContainer">
                <h2>Notfications</h2>
                {loading && <p>Loading alerts...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {alerts.length === 0 && !loading && !error ? (
                    <p>No alerts available</p>
                ) : (
                    <ul>
                        {alerts.map((alert) => (
                            <li className="alertsList" key={alert.RequestID}>
                                <p>Subject: {alert.Subject}</p>
                                <p>Sent By: {alert.SenderName} ({alert.SenderType})</p>
                                <p>Message: {alert.Message}</p>
                                <p><small>{new Date(alert.AlertTime).toLocaleString()}</small></p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default Alerts;
