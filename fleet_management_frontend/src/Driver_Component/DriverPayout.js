import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DriverPayout.css';

const DriverPayout = ({ driverData }) => {
  const driverId = driverData?.driverData?.driverID;
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingEarnings, setPendingEarnings] = useState(0);


  const fetchPendingEarnings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/driver/${driverId}/pending-earnings`);
      if (res.data.success) {
        setPendingEarnings(res.data.totalPending);
      }
    } catch (err) {
      console.error('Failed to fetch pending earnings:', err);
    }
  };


  useEffect(() => {
    if (driverId) {
      fetchPayoutHistory();
      fetchPendingEarnings();
    }
  }, [driverId]);

  const fetchPayoutHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/driver/${driverId}/payout-history`);
      setHistory(res.data.payoutHistory || []);
    } catch (err) {
      console.error('Failed to load payout history', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amount) || amountValue <= 0) {
      return setErrorMsg('Enter a valid amount');
    }
    if (amountValue > pendingEarnings) {
      return setErrorMsg(`Amount cannot exceed total pending earnings ₹${pendingEarnings}`);
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/driver/${driverId}/payout-request`, {
        amount: amountValue,
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setErrorMsg('');
        setAmount('');
        fetchPayoutHistory();       // refresh history
        fetchPendingEarnings();     // refresh pending earnings after request
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Request failed');
      setSuccessMsg('');
    }
  };


  return (
    <div className="payout-container">
      <h2>Payout Request</h2>

      {successMsg && <p className="success">{successMsg}</p>}
      {errorMsg && <p className="error">{errorMsg}</p>}

      <h4>Total Pending Earnings: ₹{pendingEarnings}</h4>
      <form onSubmit={handleSubmit} className="payout-form">
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit">Request Payout</button>
      </form>

      <h3>Payout History</h3>
      <table className="payout-history">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested At</th>
          </tr>
        </thead>
        <tbody>
          {history.length ? (
            history.map((item) => (
              <tr key={item.RequestID}>
                <td>₹{item.Amount}</td>
                <td>{item.Status}</td>
                <td>{new Date(item.RequestDate).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="3">No payout requests yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DriverPayout;
