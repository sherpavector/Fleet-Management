import React, { useState, useEffect } from "react";
import VendorNavbar from "./vendor_navbar";
import styles from "../styles/AdminTripPage.module.css";
import { useNavigate } from "react-router-dom";

const VendorTripPage = () => {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const vendorId = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;
    if (!vendorId) return;

    fetch(`http://localhost:5000/api/vendor/${vendorId}/trips`)
      .then((res) => res.json())
      .then((data) => setTrips(data))
      .catch((error) => console.error("Error fetching vendor trips:", error));
  }, []);

  const updateTripStatus = async (tripId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/update-trip-status/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TripStatus: newStatus }),
      });

      if (res.ok) {
        setTrips((prevTrips) =>
          prevTrips.map((trip) =>
            trip.TripID === tripId ? { ...trip, TripStatus: newStatus } : trip
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAssignTrip = (tripId) => {
    navigate(`/vendor-assignTrip-driver/${tripId}`);
  };

  const handleCancelTrip = (tripId) => {
    updateTripStatus(tripId, "Cancelled");
  };

  const activeTrips = trips.filter(trip => trip.TripStatus !== "Completed" && trip.TripStatus !== "Cancelled");
  const cancelledTrips = trips.filter(trip => trip.TripStatus === "Cancelled");

  const renderTripRow = (trip) => (
    <tr key={trip.TripID}>
      <td>{trip.TripID}</td>
      <td>{trip.ClientName}</td>
      <td>{new Date(trip.TripDate).toLocaleDateString()}</td>
      <td>
        {trip.TripStatus}
        {trip.TripStatus === "Assigned" && (
          <span className={styles.infoText}> (Waiting for driver to accept)</span>
        )}
        {trip.TripStatus === "InProgress" && (
          <span className={styles.infoText}> (In Progress)</span>
        )}
        {trip.TripStatus === "Cancelled" && (
          <span className={styles.cancelledText}>
            {trip.DriverID ? " (Cancelled by Driver)" : " (Cancelled by Client)"}
          </span>
        )}

      </td>
      <td>{trip.TripType}</td>
      <td>{trip.PickupLocation}</td>
      <td>{trip.DropLocation}</td>
      <td>{trip.VehicleType}</td>
      <td>
        {trip.StartTime
          ? `${new Date(trip.StartTime).toLocaleDateString()} - ${new Date(trip.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : "N/A"}
      </td>
      <td>
        {trip.TripStatus === "Requested" && (
          <>
            <button onClick={() => handleAssignTrip(trip.TripID)} className={styles.assignBtn}>Assign</button>
            <button onClick={() => handleCancelTrip(trip.TripID)} className={styles.cancelBtn}>Cancel</button>
          </>
        )}
      </td>
    </tr>
  );

  return (
    <>
      <VendorNavbar />
      <div className={styles.pageContainer}>
        <h2 className={styles.heading}>Your Booked Trips</h2>

        {/* Active Trips Table */}
        <div className={styles.tableContainer}>
          <h2 className={styles.subHeading}>Active Trips</h2>
          <table className={styles.tripTable}>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Client Name</th>
                <th>Trip Date</th>
                <th>Trip Status</th>
                <th>Trip Type</th>
                <th>Pickup Location</th>
                <th>Drop Location</th>
                <th>Vehicle Type</th>
                <th>Start Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTrips.length > 0 ? activeTrips.map(renderTripRow) : (
                <tr><td colSpan="10" style={{ textAlign: "center" }}>No active trips.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cancelled Trips Table */}
        {cancelledTrips.length > 0 && (
          <div className={styles.tableContainer}>
            <h2 className={styles.subHeading}>Cancelled Trips</h2>
            <table className={styles.tripTable}>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Client Name</th>
                  <th>Trip Date</th>
                  <th>Trip Status</th>
                  <th>Trip Type</th>
                  <th>Pickup Location</th>
                  <th>Drop Location</th>
                  <th>Vehicle Type</th>
                  <th>Start Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cancelledTrips.map(renderTripRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default VendorTripPage;
