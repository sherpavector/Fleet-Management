import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VendorNavbar from './vendor_navbar';
import './AlertSender.css';

const AlertSender = () => {
    const [drivers, setDrivers] = useState([]);
    const [driverID, setDriverID] = useState('');
    const [alertType, setAlertType] = useState('');
    const [alertDetails, setAlertDetails] = useState('');
    const [tripID, setTripID] = useState(null);
    const [alerts, setAlerts] = useState([]); // all alerts fetched

    const vendorID = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;

    useEffect(() => {
        if (vendorID) {
            axios.get(`http://localhost:5000/api/vendor/${vendorID}/driver-alerts`)
                .then(res => {
                    if (res.data.success) {
                        setAlerts(res.data.alerts);
                    }
                })
                .catch(err => console.error('Error fetching vendor driver alerts:', err));
        }
    }, [vendorID]);

    useEffect(() => {
        if (vendorID) {
            axios.get(`http://localhost:5000/api/drivers/vendors/${vendorID}/drivers`)
                .then(res => setDrivers(res.data))
                .catch(err => console.error('Error fetching drivers:', err));
        }
    }, [vendorID]);

    useEffect(() => {
        if (driverID) {
            axios.get(`http://localhost:5000/api/trips/active/${driverID}`)
                .then(res => setTripID(res.data.tripID))
                .catch(err => {
                    console.error('Error fetching active trip:', err);
                    setTripID(null);
                });
        }
    }, [driverID]);

    const handleSendAlert = (e) => {
        e.preventDefault();

        axios.post('http://localhost:5000/api/vendor/alerts/send', {
            vendorID,
            driverID,
            alertType,
            alertDetails,
        })
            .then(res => {
                alert(`Alert sent! (TripID: ${res.data.tripID || 'N/A'})`);
                setAlertDetails('');
            })
            .catch(err => {
                console.error('Error sending alert:', err);
                alert(err.response?.data?.message || 'Error sending alert');
            });
    };

    // Separate alerts by senderType from the fetched alerts
    const driverAlerts = alerts.filter((a) => a.senderType === 'Driver');
    const vendorAlerts = alerts.filter((a) => a.senderType === 'Vendor');

    return (
        <>
            <VendorNavbar />
            <div className="p-4 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-4">Send Alert to Driver</h2>
                <form onSubmit={handleSendAlert} className="alert-form">
                    <label className="block mb-2">Select Driver</label>
                    <select
                        value={driverID}
                        onChange={e => setDriverID(e.target.value)}
                        required
                        className="w-full mb-4 p-2 border rounded"
                    >
                        <option value="">-- Select Driver --</option>
                        {drivers.map(driver => (
                            <option key={driver.DriverID} value={driver.DriverID}>
                                {driver.DriverName}
                            </option>
                        ))}
                    </select>

                    {tripID && (
                        <div className="mb-4 text-sm text-gray-600">
                            Current Trip ID: <strong>{tripID}</strong>
                        </div>
                    )}

                    <label className="block mb-2">Alert Type</label>
                    <select
                        value={alertType}
                        onChange={e => setAlertType(e.target.value)}
                        required
                        className="w-full mb-4 p-2 border rounded"
                    >
                        {['Select Alert Type', 'Panic', 'Tampering', 'OverSpeed', 'GeoFence', 'DriverDeviation'].map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <label className="block mb-2">Alert Details</label>
                    <textarea
                        value={alertDetails}
                        onChange={e => setAlertDetails(e.target.value)}
                        required
                        className="w-full mb-4 p-2 border rounded"
                    />

                    <button type="submit" className="text-white px-4 py-2 rounded">
                        Send Alert
                    </button>
                </form>

                <div className="alerts-grid">
                    <div className="alert-box">
                        <h3>Alerts Sent By You</h3>
                        {vendorAlerts.length === 0 ? (
                            <p>No alerts sent by you.</p>
                        ) : (
                            <ul>
                                {vendorAlerts.map((alert) => (
                                    <li key={alert.AlertID}>
                                        <strong>{alert.AlertType}</strong>
                                        <p>{alert.AlertDetails}</p>
                                        <small>{new Date(alert.AlertTime).toLocaleString()}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="alert-box">
                        <h3 className="text-lg font-semibold mt-8 mb-2">Alerts Sent by Your Drivers</h3>
                        {driverAlerts.length === 0 ? (
                            <p className="text-sm text-gray-500">No alerts sent by drivers yet.</p>
                        ) : (
                            <ul className="space-y-4">
                                {driverAlerts.map(alert => (
                                    <li key={alert.AlertID} className="alert-item">
                                        <div>
                                            <strong>{alert.DriverName} sent a {alert.AlertType} alert</strong>
                                        </div>
                                        <p>{alert.AlertDetails}</p>
                                        <div className="time">
                                            <small>{new Date(alert.AlertTime).toLocaleString()}</small>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>

            </div>
        </>
    );
};

export default AlertSender;
