import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './TripsPage.css';

function TripsPage({ driverData }) {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);
  const trackingIntervalRef = useRef(null);

  const driverId = driverData?.driverData?.driverID;
  console.log("driverData:", driverData);

  useEffect(() => {
    if (driverId) {
      console.log('Fetching trips for driver ID:', driverId);

      // 1. Load all trips for display
      axios.get(`http://localhost:5000/api/driver/${driverId}/view-trips`)
        .then(res => {
          console.log('Trips fetched:', res.data.trips);
          setTrips(res.data.trips);
        })
        .catch(err => {
          console.error('Error fetching trips:', err);
          setError('Could not load trips.');
        });

      // 2. Check if any active trip is in progress — if yes, resume tracking
      axios.get(`http://localhost:5000/api/driver/${driverId}/active-trip`)
        .then(res => {
          const activeTrip = res.data.activeTrip;
          if (activeTrip) {
            console.log("Ongoing trip found. Resuming tracking...");

            // Fetch vehicleId and resume tracking
            axios.get(`http://localhost:5000/api/drivers/${driverId}/vehicle`)
              .then(response => {
                const vehicleId = response.data.vehicleId;
                startLiveTracking(vehicleId);
              })
              .catch(err => {
                console.error('Error fetching vehicle ID:', err);
              });
          } else {
            console.log("No active trip. No tracking needed.");
          }
        })
        .catch(err => {
          console.error('Error checking active trip:', err);
        });
    }
  }, [driverId]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, []);

  const handleStatusUpdate = (tripId, newStatus) => {
    axios.put(`http://localhost:5000/api/trips/${tripId}/status`, { status: newStatus })
      .then(res => {
        console.log(res.data.message);

        setTrips(prevTrips =>
          prevTrips.map(trip =>
            trip.TripID === tripId ? { ...trip, Status: newStatus } : trip
          )
        );

        if (newStatus === 'InProgress') {
          // Fetch vehicle ID using driverId
          axios.get(`http://localhost:5000/api/drivers/${driverId}/vehicle`)
            .then(response => {
              const vehicleId = response.data.vehicleId;
              startLiveTracking(vehicleId); // Start tracking here
            })
            .catch(err => {
              console.error('Error fetching vehicle ID:', err);
            });
        }

        if (newStatus === 'Completed' || newStatus === 'Cancelled') {
          stopLiveTracking(); // Stop tracking if trip ends
        }

      })
      .catch(err => {
        console.error('Failed to update trip status:', err);
        setError('Could not update trip status.');
      });
  };

  const startLiveTracking = (vehicleId) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Avoid multiple intervals
    if (trackingIntervalRef.current) {
      console.log('Tracking already active');
      return;
    }

    console.log('Starting live tracking every 10 seconds...');
    const intervalId = setInterval(() => {
      console.log("Fetching driver's location...");
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;

          console.log(`Sending location: ${latitude}, ${longitude}`);

          axios.post('http://localhost:5000/api/livetracking/update', {
            vehicleId,
            latitude,
            longitude,
          }).then(res => {
            console.log('Location sent:', res.data);
          }).catch(err => {
            console.error('Error sending location:', err);
          });
        },
        err => {
          console.error('Error fetching location:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 10000); // Every 10 seconds

    trackingIntervalRef.current = intervalId;
  };

  const stopLiveTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
      console.log('Live tracking stopped');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString();

  return (
    <div className="trips-page">
      <h2 className="title">Assigned Trips</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!driverId && <p style={{ color: 'red' }}>Driver ID missing.</p>}
      {trips.length === 0 && !error ? (
        <p>No trips assigned yet.</p>
      ) : (
        <table className="trip-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Trip Date</th>
              <th>Pickup – Drop</th>
              <th>Trip Type</th>
              <th>Client Name</th>
              <th>Status</th>
              <th colSpan={2}>Action</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, index) => (
              <tr key={index}>
                <td><strong>{trip.TripID}</strong></td>
                <td>{formatDate(trip.Date)}</td>
                <td><strong>{trip.PickupLocation} ➡️ {trip.DropLocation}</strong></td>
                <td>{trip.TripType}</td>
                <td>{trip.ClientName}</td>
                <td><strong>{trip.Status}</strong></td>
                <td colSpan={2}>
                  {trip.Status === 'Assigned' && (
                    <>
                      <button className='tripButton' onClick={() => handleStatusUpdate(trip.TripID, 'InProgress')}>Accept</button>
                      <button className='tripButton' onClick={() => handleStatusUpdate(trip.TripID, 'Cancelled')}>Reject</button>
                    </>
                  )}
                  {trip.Status === 'InProgress' && (
                    <button className='tripButton' onClick={() => handleStatusUpdate(trip.TripID, 'Completed')}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TripsPage;
