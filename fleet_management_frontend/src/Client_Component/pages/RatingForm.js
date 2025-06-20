import React, { useState } from 'react';
import './RatingForm.css';
import axios from 'axios';

const RatingForm = ({ tripId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');

  const getRatingLabel = (value) => {
    switch (value) {
      case 1: return 'Terrible';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return alert("Client not logged in");

    try {
      await axios.post('http://localhost:5000/api/client/rate-trip', {
        TripID: tripId,
        ClientID: clientId,
        Rating: rating,
        Feedback: feedback,
      });
      alert('Rating submitted successfully!');
      onClose(); // Close the popup
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating.');
    }
  };

  const displayValue = hover || rating;

  return (
    <div className="rating-popup-backdrop">
      <div className="rating-popup">
        <h3>Rate Your Trip</h3>
        <form onSubmit={handleSubmit}>
          {/* Display label text below stars */}
          {displayValue > 0 && (
            <div className="rating-label">
              {displayValue} Star{displayValue > 1 ? 's' : ''} – {getRatingLabel(displayValue)}
            </div>
          )}
          <div className="star-rating">
            {[...Array(5)].map((_, index) => {
              const star = index + 1;
              return (
                <span
                  key={index}
                  className={`star ${star <= displayValue ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </span>
              );
            })}
          </div>


          <textarea
            placeholder="Optional feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="rating-buttons">
            <button type="submit">Submit</button>
            <button className="cancelBtn" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingForm;
