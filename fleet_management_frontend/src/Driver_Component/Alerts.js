import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Alerts = ({ driverData }) => {
  const driverId = driverData?.driverData?.driverID;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New alert form
  const [alertType, setAlertType] = useState('Panic');
  const [alertDetails, setAlertDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  useEffect(() => {
    if (!driverId) {
      setError('Driver ID missing');
      setLoading(false);
      return;
    }
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/driver/${driverId}/alerts`)
      .then((res) => {
        if (res.data.success) {
          setAlerts(res.data.alerts);
          setError(null);
        } else {
          setError('Failed to fetch alerts');
        }
      })
      .catch(() => setError('Error fetching alerts'))
      .finally(() => setLoading(false));
  }, [driverId]);

  // Separate alerts by senderType
  const driverAlerts = alerts.filter((a) => a.senderType === 'Driver');
  const vendorAlerts = alerts.filter((a) => a.senderType === 'Vendor');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    if (!alertDetails.trim()) {
      setSendError('Please enter alert details');
      return;
    }

    setSending(true);
    try {
      const response = await axios.post('http://localhost:5000/api/alerts/driver/send', {
        driverID: driverId,
        alertType,
        alertDetails,
      });

      if (response.data.success) {
        setSendSuccess('Alert sent successfully!');
        setAlertDetails('');

        // Refresh alerts
        const res = await axios.get(`http://localhost:5000/api/driver/${driverId}/alerts`);
        if (res.data.success) setAlerts(res.data.alerts);
      } else {
        setSendError('Failed to send alert');
      }
    } catch {
      setSendError('Error sending alert');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="alerts-container">
      <h2>Driver Alerts</h2>

      <form onSubmit={handleSubmit} className="alert-form">
        <label>
          Alert Type:
          <select value={alertType} onChange={(e) => setAlertType(e.target.value)}>
            <option value="Panic">Panic</option>
            <option value="Tampering">Tampering</option>
            <option value="OverSpeed">OverSpeed</option>
            <option value="GeoFence">GeoFence</option>
            <option value="DriverDeviation">DriverDeviation</option>
          </select>
        </label>
        <br /><br/>
        <label>
          Alert Details:
          <textarea
            rows={4}
            placeholder="Describe the alert..."
            value={alertDetails}
            onChange={(e) => setAlertDetails(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={sending}>
          {sending ? 'Sending...' : 'Send Alert'}
        </button>

        {sendError && <p style={{ color: 'red' }}>{sendError}</p>}
        {sendSuccess && <p style={{ color: 'green' }}>{sendSuccess}</p>}
      </form>

      <hr />

      {loading && <p>Loading alerts...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div className="alerts-grid">
          <div className="alert-box">
            <h3>Alerts Sent By You</h3>
            {driverAlerts.length === 0 ? (
              <p>No alerts sent by you.</p>
            ) : (
              <ul>
                {driverAlerts.map((alert) => (
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
            <h3>Alerts Sent By Vendor</h3>
            {vendorAlerts.length === 0 ? (
              <p>No alerts sent by vendor.</p>
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
        </div>
      )}
    </div>
  );
};

export default Alerts;
