import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TripStatus.css';

const TripStatus = ({ driverData }) => {
  const [trips, setTrips] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 3; // number of trips per page

  const driverId = driverData?.driverData?.driverID;

  useEffect(() => {
    if (driverId) {
      const fetchTrips = async () => {
        try {
          const [tripsRes, ratingsRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/driver/${driverId}/all-trips`),
            axios.get(`http://localhost:5000/api/driver/${driverId}/ratings`)
          ]);

          setTrips(tripsRes.data.trips || []);
          setRatings(ratingsRes.data || []);
          setCurrentPage(1); // reset page on new data
        } catch (err) {
          console.error('Error loading data:', err);
          setErrorMsg('Error loading trips or ratings');
        }
      };

      fetchTrips();
    }
  }, [driverId]);

  // Group trips by TripID and sum earnings
  const groupTripsByTripID = (tripArray) => {
    const grouped = {};

    tripArray.forEach(trip => {
      const id = trip.TripID;
      if (!grouped[id]) {
        grouped[id] = { ...trip, Earning: parseFloat(trip.Earning || 0) };
      } else {
        grouped[id].Earning += parseFloat(trip.Earning || 0);
      }
    });

    // Convert to array
    const groupedArray = Object.values(grouped);

    // Sort descending by TripID
    groupedArray.sort((a, b) => b.TripID - a.TripID);

    return groupedArray;
  };

  const groupedTrips = groupTripsByTripID(trips);

  // Pagination logic:
  const indexOfLastTrip = currentPage * tripsPerPage;
  const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
  const currentTrips = groupedTrips.slice(indexOfFirstTrip, indexOfLastTrip);
  const totalPages = Math.ceil(groupedTrips.length / tripsPerPage);

  const getRatingLabel = (rating) => {
    switch (rating) {
      case 1: return 'Terrible';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  // Helper: Find rating for a trip
  const getRatingForTrip = (tripID) => {
    const ratingObj = ratings.find(r => r.TripID === tripID);
    return ratingObj?.Rating ?? null;
  };

  // Get Feedback for a TripID
  const getFeedbackForTrip = (tripID) => {
    const ratingObj = ratings.find(r => r.TripID === tripID);
    return ratingObj?.Feedback?.trim() || null;
  };

  const renderStars = (rating) => {
    if (rating == null) return 'No Rating';

    return (
      <div>
        {[...Array(5)].map((_, i) => (
          <span key={i} style={{ color: i < rating ? '#f5c518' : '#ccc', fontSize: '25px' }}>
            ★
          </span>
        ))}
        <div style={{ fontSize: '15px', color: '#333', marginTop: '4px' }}>
          {rating} – {getRatingLabel(rating)}
        </div>
      </div>
    );
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
  };

  return (
    <div className="trip-status-page">
      <h2>My Trips</h2>
      {errorMsg && <p className="error">{errorMsg}</p>}

      {trips.length === 0 ? (
        <p>No trips assigned yet.</p>
      ) : (
        <>
          <table className="status-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th colSpan={2}>Pickup – Drop</th>
                <th>Trip Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Client Name</th>
                <th>Status</th>
                <th>Earning</th>
                <th>Payment Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {currentTrips.map((trip, index) => (
                <tr key={`${trip.TripID}-${index}`}>
                  <td>{trip.TripID}</td>
                  <td colSpan={2}>{trip.PickupLocation} ➡️ {trip.DropLocation}</td>
                  <td>{trip.TripType}</td>
                  <td>{new Date(trip.StartTime).toLocaleDateString()}</td>
                  <td>{new Date(trip.EndTime).toLocaleDateString()}</td>
                  <td>{trip.ClientName}</td>
                  <td>{trip.Status}</td>
                  <td>{trip.Earning ? `₹${trip.Earning.toFixed(2)}` : '—'}</td>
                  <td>{trip.PaymentStatus}</td>
                  <td>
                    {renderStars(getRatingForTrip(trip.TripID))}
                    {(() => {
                      const feedback = getFeedbackForTrip(trip.TripID);
                      return feedback ? (
                        <>
                          <br />
                          Feedback: {feedback}
                        </>
                      ) : null;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls" style={{ marginTop: '15px', textAlign: 'center' }}>
            <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ marginRight: '10px' }}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ marginLeft: '10px' }}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TripStatus;
