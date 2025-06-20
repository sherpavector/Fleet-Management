import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ConfirmBooking.css';

const ConfirmBooking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [tripType, setTripType] = useState('Short Trip'); // default value

  const handleConfirm = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/client/bookings/confirm', {
        ...state,
        bookingDetails: additionalDetails,
        clientId: localStorage.getItem('clientId'),
        tripType,  // send selected trip type
        distance: state.distance,         // send distance
        totalCost: state.totalCost
      });

      if (res.data.success) {
        alert('Trip booked successfully!');
        navigate('/client-booking-history');
      } else {
        alert('Failed to confirm booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error during booking confirmation');
    }
  };

  return (
    <>
    <div className="confirm-booking">
      <h2>Confirm Your Booking</h2>
      <p><strong>Pickup:</strong> {state.pickup}</p>
      <p><strong>Drop:</strong> {state.drop}</p>
      <p><strong>Vehicle:</strong> {state.vehicle}</p>
      {/* <p><strong>Vendor:</strong> {state.vendorId}</p> */}
      <p><strong>Distance:</strong> {state.distance} km</p>
      <p><strong>Total Cost:</strong> ₹{state.totalCost}</p>

      <div className="form-group">
        <label>Trip Type</label>
        <select value={tripType} onChange={(e) => setTripType(e.target.value)}>
          <option value="Short Trip">Short Trip</option>
          <option value="Day Engagement">Day Engagement</option>
          <option value="Year Round">Year Round</option>
          <option value="Weekly">Weekly</option>
        </select>
      </div>

      <textarea
        placeholder="Additional booking details..."
        value={additionalDetails}
        onChange={(e) => setAdditionalDetails(e.target.value)}
      ></textarea>

      <button onClick={handleConfirm}>Confirm Booking</button>
    </div>
    </>
  );
};

export default ConfirmBooking;
