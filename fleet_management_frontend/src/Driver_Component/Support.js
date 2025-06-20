import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Support.css'; // Optional for styling

const Support = ({ driverData }) => {
  const [supportRequests, setSupportRequests] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const driverId = driverData?.driverData?.driverID;

  // Fetch support history for the driver
  useEffect(() => {
    const fetchSupportHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/driver/${driverId}/support-history`);
        if (response.data.success) {
          setSupportRequests(response.data.supportRequests);
        } else {
          setError('Failed to fetch support history');
        }
      } catch (err) {
        setError('Error fetching support history');
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchSupportHistory();
    } else {
      setError('Driver ID is missing');
      setLoading(false);
    }
  }, [driverId]);

  // Handle the submission of new support requests
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!subject || !message) {
      setError('Both subject and message are required');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/driver/${driverId}/support`, {
        subject,
        message,
      });

      if (response.data.success) {
        setSuccess('Support request submitted successfully');
        setSubject('');
        setMessage('');
      } else {
        setError('Failed to submit support request');
      }
    } catch (err) {
      setError('Error submitting support request');
    }
  };

  return (
    <div className="support-container">
      <h2>Support</h2>

      {/* Form to submit new support request */}
      <form onSubmit={handleSubmit} className="support-form">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe your issue"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit">Submit Request</button>
      </form>

      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      {/* Display previous support requests */}
      <div className="support-history">
        <h3>Support History</h3>
        {loading && <p>Loading your support history...</p>}
        {supportRequests.length === 0 && !loading && !error ? (
          <p>No support history available</p>
        ) : (
          <ul>
            {supportRequests.map((request) => (
              <li key={request.RequestID}>
                <p><strong>Subject: {request.Subject}</strong></p>
                <p>Message: {request.Message}</p>
                <p><small>{new Date(request.CreatedAt).toLocaleString()}</small></p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Support;
