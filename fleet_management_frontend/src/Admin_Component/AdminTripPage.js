import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import styles from "../styles/AdminTripPage.module.css";
import { useNavigate } from "react-router-dom";

const AdminTripPage = () => {
  const [trips, setTrips] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/vendors")
      .then((res) => res.json())
      .then((data) => setVendors(data))
      .catch((err) => console.error("Error fetching vendors:", err));
  }, []);

  useEffect(() => {
    let url = "http://localhost:5000/api/admin/trips";
    if (selectedVendor) {
      url += `?vendorId=${selectedVendor}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setTrips(data))
      .catch((err) => console.error("Error fetching trips:", err));
  }, [selectedVendor]);

  const updateTripStatus = async (tripId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/update-trip-status/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TripStatus: newStatus }),
      });

      if (res.ok) {
        setTrips((prev) =>
          prev.map((trip) =>
            trip.TripID === tripId ? { ...trip, TripStatus: newStatus } : trip
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleVendorChange = (e) => {
    setSelectedVendor(e.target.value);
  };

  const activeTrips = trips.filter(
    (trip) => trip.TripStatus !== "Completed" && trip.TripStatus !== "Cancelled"
  );

  const cancelledTrips = trips.filter((trip) => trip.TripStatus === "Cancelled");

  return (
    <>
      <Navbar />
      <div className={styles.pageContainer}>
        <h1 className={styles.heading}>All Booked Trips</h1>

        <div className={styles.filterContainer}>
          <label htmlFor="vendorFilter">Filter by Vendor: </label>
          <select id="vendorFilter" value={selectedVendor} onChange={handleVendorChange}>
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.VendorID} value={vendor.VendorID}>
                {vendor.VendorName}
              </option>
            ))}
          </select>
        </div>

        {/* === ACTIVE TRIPS TABLE === */}
        <h2 className={styles.subHeading}>Active Trips</h2>
        <div className={styles.tableContainer}>
          <table className={styles.tripTable}>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Client Name</th>
                <th>Trip Date</th>
                <th>Trip Status</th>
                <th>Trip Type</th>
                <th>Vehicle Type</th>
                <th>Pickup Location</th>
                <th>Drop Location</th>
                <th>Start Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeTrips.length > 0 ? (
                activeTrips.map((trip) => (
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
                    </td>
                    <td>{trip.TripType}</td>
                    <td>{trip.VehicleType}</td>
                    <td>{trip.PickupLocation}</td>
                    <td>{trip.DropLocation}</td>
                    <td>
                      {trip.StartTime
                        ? `${new Date(trip.StartTime).toLocaleDateString()} - ${new Date(trip.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : "N/A"}
                    </td>
                    <td>{(trip.TripStatus === 'Assigned' || trip.TripStatus === 'InProgress') && (
                      <button
                        className="bookingBtn"
                        onClick={() => navigate(`/live-tracking/${trip.TripID}`)}
                      >
                        Track
                      </button>
                    )}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>No active trips.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* === CANCELLED TRIPS TABLE === */}
        {cancelledTrips.length > 0 && (
          <>
            <h2 className={styles.subHeading}>Cancelled Trips</h2>
            <div className={styles.tableContainer}>
              <table className={styles.tripTable}>
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Client Name</th>
                    <th>Trip Date</th>
                    <th>Trip Status</th>
                    <th>Trip Type</th>
                    <th>Vehicle Type</th>
                    <th>Pickup Location</th>
                    <th>Drop Location</th>
                    <th>Start Time</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledTrips.map((trip) => (
                    <tr key={trip.TripID}>
                      <td>{trip.TripID}</td>
                      <td>{trip.ClientName}</td>
                      <td>{new Date(trip.TripDate).toLocaleDateString()}</td>
                      <td className={styles.cancelledText}>
                        {trip.DriverID ? 'Cancelled by Driver' : 'Cancelled by Client'}
                      </td>
                      <td>{trip.TripType}</td>
                      <td>{trip.VehicleType}</td>
                      <td>{trip.PickupLocation}</td>
                      <td>{trip.DropLocation}</td>
                      <td>
                        {trip.StartTime
                          ? `${new Date(trip.StartTime).toLocaleDateString()} - ${new Date(trip.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AdminTripPage;
