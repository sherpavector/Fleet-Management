import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './payment.css';
import { useNavigate } from 'react-router-dom';

const ClientPayment = () => {
  const [tripId, setTripId] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [amount, setAmount] = useState('--');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reminder, setReminder] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedTripId = localStorage.getItem('paymentTripId');
    const storedClientId = localStorage.getItem('clientId');

    if (!storedTripId || !storedClientId) {
      alert('Trip ID or Client ID not found. Please go back and try again.');
      return;
    }

    setTripId(storedTripId);
    setClientId(storedClientId);

    // Fetch trip cost
    axios
      .get(`http://localhost:5000/api/trip-cost/${storedTripId}`)
      .then((res) => setAmount(res.data.TotalCost))
      .catch((err) => {
        console.error('Error fetching trip cost:', err);
        alert('Failed to fetch trip cost');
      });
  }, []);

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/payments/dummy', {
        tripId,
        clientId,
        method: paymentMethod,
      });

      setSuccessMessage('Payment Successful!');
      alert(`Payment Successful! Amount Paid: ₹${res.data.amount}`);
      localStorage.removeItem('paymentTripId');
      localStorage.removeItem('paymentClientId');
      setReminder(false);

      // Redirect to booking history after successful payment
      navigate('/client-booking-history');
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed');
      setReminder(true);
    }
  };

  return (
    <div className="dummy-payment-container">
      <h2>Complete Your Payment</h2>
      <div className="paymentContainer">
        <div className="amount-display">Total Fare: <strong>₹{amount}</strong></div>
        <div className="payment-method">
          <label>Select Payment Method:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
            <option value="upi">UPI</option>
          </select>
        </div>

        <button className='pay-btn' onClick={handlePayment}>Pay Now</button>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {reminder && <div className="reminder">Reminder: Payment is still pending!</div>}
      </div>
    </div>
  );
};

export default ClientPayment;
