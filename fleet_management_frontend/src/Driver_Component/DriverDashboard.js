import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './DriverDashboard.css';

function DriverDashboard({ driverData }) {
  const [driverId, setDriverId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState('0.00');
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [weeklyOverview, setWeeklyOverview] = useState([]);

  useEffect(() => {
    if (!driverId) return;

    axios.get(`http://localhost:5000/api/driver/${driverId}/weekly-overview`)
      .then(res => setWeeklyOverview(res.data.overview))
      .catch(err => console.error('Error fetching weekly overview:', err));
  }, [driverId]);


  useEffect(() => {
    if (!driverId) return;

    axios.get(`http://localhost:5000/api/driver/${driverId}/vehicle`)
      .then(res => setVehicle(res.data.vehicle))
      .catch(err => console.error('Error fetching vehicle:', err));
  }, [driverId]);


  // Set driverId once when driverData is available
  useEffect(() => {
    const actualDriver = driverData?.driverData;
    if (actualDriver?.driverID || actualDriver?.driver_id) {
      setDriverId(actualDriver.driverID || actualDriver.driver_id);
    }
  }, [driverData]);


  console.log('Driver ID set to:', driverId);
  console.log('DriverData:', driverData);

  useEffect(() => {
    if (!driverId) return;

    let isMounted = true;

    axios.get(`http://localhost:5000/api/driver/${driverId}/profile`)
      .then(res => {
        console.log('Profile fetched:', res.data);
        if (isMounted) setProfile(res.data.profile);
      })
      .catch(err => console.error('Profile fetch error:', err));

    axios.get(`http://localhost:5000/api/driver/${driverId}/earnings`)
      .then(res => {
        console.log('Earnings fetched:', res.data);
        if (isMounted) setTotalEarnings(res.data.totalEarnings);
      })
      .catch(err => console.error('Earnings fetch error:', err));

    axios.get(`http://localhost:5000/api/driver/${driverId}/trips`)
      .then(res => {
        console.log('Trips fetched:', res.data);
        if (isMounted) setTrips(res.data.trips);
      })
      .catch(err => console.error('Trips fetch error:', err));


    return () => {
      isMounted = false;
    };
  }, [driverId]);

  return (
    <>
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
          <h2 className="welcome-text">
            Welcome, <span>{profile?.Name || driverData?.driverData?.email}</span>
          </h2>


          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Current Vehicle</h3>
              {vehicle ? (
                <p>{vehicle.TypeOfVehicle} - {vehicle.VehicleMake} {vehicle.VehicleModel} ({vehicle.VehicleNumber})</p>
              ) : (
                <p>No vehicle assigned</p>
              )}
            </div>


            <Link to="/earnings" className="dashboard-card-link">
              <div className="dashboard-card">
                <h3>Today's Earning</h3>
                <p className="highlight">₹{totalEarnings}</p>
              </div>
            </Link>

            <Link to="/trips" className="dashboard-card-link">
              <div className="dashboard-card">
                <h3>Upcoming Trips</h3>
                <ul className="trip-list">
                  {trips.length ? (
                    trips.slice(0, 3).map((trip, index) => (
                      <li key={index}>
                        {trip.PickupLocation} ➡️ {trip.DropLocation}
                      </li>
                    ))
                  ) : (
                    <li>No upcoming trips</li>
                  )}
                </ul>
              </div>
            </Link>

            <div className="dashboard-card">
              <h3>Weekly Overview</h3>
              {weeklyOverview.length ? (
                <ul className="weekly-list">
                  {weeklyOverview.map((item, idx) => (
                    <li key={idx}>
                      {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}:
                      ₹{item.total.toFixed(2)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No earnings this week</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default DriverDashboard;
