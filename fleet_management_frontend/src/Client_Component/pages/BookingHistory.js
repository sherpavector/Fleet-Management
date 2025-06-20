import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyTrips.css';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import RatingForm from './RatingForm';

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedTripForRating, setSelectedTripForRating] = useState(null);
  const [ratedTripIds, setRatedTripIds] = useState([]);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedTripForPayment, setSelectedTripForPayment] = useState(null);
  const [requestedPage, setRequestedPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [cancelledPage, setCancelledPage] = useState(1);
  const tripsPerPage = 3;



  const navigate = useNavigate();

  useEffect(() => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return;

    axios
      .get(`http://localhost:5000/api/client/my-trips/${clientId}`)
      .then((res) => {
        setTrips(res.data);

        // Mark rated trips
        const rated = res.data
          .filter(trip => trip.Rating != null)
          .map(trip => trip.TripID);
        setRatedTripIds(rated);

        // Automatically check for pending payment trips
        const pendingPaymentTrip = res.data.find(
          (trip) =>
            trip.TripStatus === 'Completed' &&
            (trip.PaymentStatus === 'Pending' || !trip.PaymentStatus)
        );

        if (pendingPaymentTrip) {
          setSelectedTripForPayment(pendingPaymentTrip);
          setShowPaymentPopup(true);
        }
      })
      .catch((err) => console.error('Error fetching trips:', err));
  }, []);

  const handleRatingSubmit = (tripId) => {
    setRatedTripIds((prev) => [...prev, tripId]);
    setShowRatingForm(false);
    setSelectedTripForRating(null);
  };

  const activeTrips = trips.filter(
    (trip) =>
      trip.TripStatus === 'Requested' ||
      trip.TripStatus === 'Assigned' ||
      trip.TripStatus === 'InProgress'
  );
  const completedTrips = trips.filter((trip) => trip.TripStatus === 'Completed');
  const cancelledTrips = trips.filter((trip) => trip.TripStatus === 'Cancelled');

  const handleCancel = (trip) => {
    const tripStart = new Date(trip.StartTime);
    const now = new Date();
    const diffMs = tripStart - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      alert("You cannot cancel a trip less than 1 hour before its start time.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this trip?")) return;

    axios
      .put(`http://localhost:5000/api/client/cancel-trip/${trip.TripDetailID}`)
      .then(() => {
        setTrips((prevTrips) =>
          prevTrips.map((t) =>
            t.TripDetailID === trip.TripDetailID ? { ...t, TripStatus: 'Cancelled' } : t
          )
        );
      })
      .catch((err) => console.error('Error cancelling trip:', err));
  };

  const paginate = (data, page) => {
    const start = (page - 1) * tripsPerPage;
    return data.slice(start, start + tripsPerPage);
  };


  const renderTripsTable = (tripList, type, currentPage, setCurrentPage) => {
    const totalPages = Math.ceil(tripList.length / tripsPerPage);
    const paginatedTrips = paginate(tripList, currentPage);
    const isCancelled = type === 'Cancelled';
    const isRequested = type === 'Requested';
    const isCompleted = type === 'Completed';

    return (
      <>
        <table className="trips-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Trip Type</th>
              <th>Pickup</th>
              <th>Drop</th>
              <th>Vehicle Type</th>
              <th>Date</th>
              {!isCancelled && <th>Distance (km)</th>}
              {!isCancelled && <th>Total Cost (₹)</th>}
              {isRequested && <th>Actions</th>}
              {isCompleted && <th>Give Rating</th>}
              {isCompleted && <th>Payment</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedTrips.map((trip) => (
              <tr key={trip.TripDetailID}>
                <td style={{ color: 'red' }}>
                  {trip.TripStatus === 'Cancelled' ? (
                    trip.DriverID ? 'Cancelled by Driver' : 'Cancelled by Client'
                  ) : (
                    trip.TripStatus
                  )}
                </td>

                <td>{trip.TripType}</td>
                <td>{trip.PickupLocation}</td>
                <td>{trip.DropLocation}</td>
                <td>{trip.VehicleType}</td>
                <td>{new Date(trip.StartTime).toLocaleDateString()}</td>
                {!isCancelled && <td>{trip.TotalDistance} km</td>}
                {!isCancelled && <td>₹ {trip.TotalCost}</td>}
                {isRequested && (
                  <td>
                    {trip.TripStatus === 'Requested' && (
                      <button className="bookingBtn" onClick={() => handleCancel(trip)}>
                        Cancel
                      </button>
                    )}
                    {(trip.TripStatus === 'Assigned' || trip.TripStatus === 'InProgress') && (
                      <button
                        className="bookingBtn"
                        onClick={() => navigate(`/client-tracker/${trip.TripID}`)}
                      >
                        Track
                      </button>
                    )}
                  </td>
                )}
                {isCompleted && (
                  <td>
                    <button
                      className="bookingBtn"
                      onClick={() => {
                        setSelectedTripForRating(trip.TripID);
                        setShowRatingForm(true);
                      }}
                      disabled={ratedTripIds.includes(trip.TripID)}
                      style={{
                        cursor: ratedTripIds.includes(trip.TripID) ? 'not-allowed' : 'pointer',
                        opacity: ratedTripIds.includes(trip.TripID) ? 0.5 : 1,
                      }}
                    >
                      {ratedTripIds.includes(trip.TripID) ? 'Rated' : 'Give Rating'}
                    </button>
                  </td>
                )}
                {isCompleted && (
                  <td>
                    {trip.PaymentStatus === 'Paid' && (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Paid</span>
                    )}
                    {(trip.PaymentStatus === 'Pending' || !trip.PaymentStatus) && (
                      <>
                        <button
                          className='bookingBtn'
                          onClick={() => {
                            setSelectedTripForPayment(trip);
                            setShowPaymentPopup(true);
                          }}
                        >
                          Pay Now
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {
          totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )
        }
      </>
    );
  };

  return (
    <>
      <Navbar />
      <div className="my-trips-container">
        <h2>My Trips</h2>

        <div className="trip-section">
          <h3>Requested Trips</h3>
          {activeTrips.length === 0 ? (
            <p className="no-trips">No requested trips.</p>
          ) : (
            renderTripsTable(activeTrips, 'Requested', requestedPage, setRequestedPage)
          )}
        </div>

        <div className="trip-section">
          <h3>Completed Trips</h3>
          {completedTrips.length === 0 ? (
            <p className="no-trips">No completed trips.</p>
          ) : (
            renderTripsTable(completedTrips, 'Completed', completedPage, setCompletedPage)
          )}
        </div>

        <div className="trip-section">
          <h3>Cancelled Trips</h3>
          {cancelledTrips.length === 0 ? (
            <p className="no-trips">No cancelled trips.</p>
          ) : (
            renderTripsTable(cancelledTrips, 'Cancelled', cancelledPage, setCancelledPage)
          )}
        </div>

      </div>

      {/* Popup Rating Form */}
      {showRatingForm && (
        <RatingForm
          tripId={selectedTripForRating}
          onClose={() => {
            setShowRatingForm(false);
            setSelectedTripForRating(null);
            // Refresh trips to update ratings
            const clientId = localStorage.getItem('clientId');
            if (clientId) {
              axios
                .get(`http://localhost:5000/api/client/my-trips/${clientId}`)
                .then((res) => setTrips(res.data))
                .catch((err) => console.error('Error fetching trips:', err));
            }
          }}
          onSubmitSuccess={handleRatingSubmit}
        />
      )}

      {/* Payment Popup */}
      {showPaymentPopup && selectedTripForPayment && (
        <div className="payment-popup-overlay">
          <div className="payment-popup">
            <h3 style={{color:'red'}}>Remainder!</h3>
            <h3>Payment Pending</h3>
            <p>
              Your payment for <strong>Trip ID: {selectedTripForPayment.TripID}</strong> is pending.
            </p>
            <p>Please complete the payment to continue using our services.</p>
            <div className="popup-actions">
              <button
                className="bookingBtn"
                onClick={() => {
                  localStorage.setItem('paymentTripId', selectedTripForPayment.TripID);
                  setShowPaymentPopup(false);
                  navigate('/client-payment');
                }}
              >
                Proceed to Pay
              </button>
              <button
                className="cancelBtn"
                onClick={() => {
                  setShowPaymentPopup(false);
                  setSelectedTripForPayment(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyTrips;
