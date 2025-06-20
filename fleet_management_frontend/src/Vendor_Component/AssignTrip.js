import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../styles/AssignTrip.module.css';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const AssignSingleTrip = () => {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [filteredDrivers, setFilteredDrivers] = useState([]);
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const vendorId = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;

        if (!vendorId) return alert('Vendor not logged in');

        // Fetch trip
        axios.get(`http://localhost:5000/api/trip/${tripId}`)
            .then(res => {
                setTrip(res.data);

                // After getting trip, fetch drivers
                axios.get(`http://localhost:5000/api/vendor/available-drivers/${vendorId}`)
                    .then(driverRes => {
                        setDrivers(driverRes.data);

                        // Filter drivers based on VehicleType match
                        const matchingDrivers = driverRes.data.filter(driver =>
                            driver.VehicleType === res.data.VehicleType
                        );
                        setFilteredDrivers(matchingDrivers);
                    })
                    .catch(err => console.error("Failed to fetch drivers", err));
            })
            .catch(err => console.error("Failed to fetch trip", err));
    }, [tripId]);

    const handleAssign = () => {
        if (!selectedDriverId) return alert("Please select a driver");

        axios.post('http://localhost:5000/api/vendor/assign-trip', {
            tripId,
            driverId: selectedDriverId
        }).then(() => {
            alert("Trip assigned!");
            navigate('/vendor-client-bookings');
        }).catch(err => {
            console.error("Failed to assign trip", err);
            alert("Assignment failed.");
        });
    };

    if (!trip) return <p>Loading trip...</p>;

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Assign Trip #{trip.TripID}</h2>
            <div className={styles.backLink}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", marginBottom: "20px", justifyContent: "center" }}
            >
                <ArrowBackRoundedIcon />
                <a style={{ color: "black", fontSize: "20px" }} href='/vendor-client-bookings'>Go Back</a>
            </div>
            <div className={styles.cardContainer}>
                <div className={styles.card}>
                    <p><strong>Trip ID:</strong> {trip.TripID}</p>
                    <p><strong>Pickup Location:</strong> {trip.PickupLocation}</p>
                    <p><strong>Drop Location:</strong> {trip.DropLocation}</p>
                    <p><strong>Start Date:</strong> {new Date(trip.StartTime).toLocaleDateString()} - {new Date(trip.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Required Vehicle Type:</strong> {trip.VehicleType}</p>

                    <div className={styles.controls}>
                        <select
                            value={selectedDriverId}
                            onChange={(e) => setSelectedDriverId(e.target.value)}
                        >
                            <option value="">Select Driver</option>
                            {filteredDrivers.length > 0 ? (
                                filteredDrivers.map(d => (
                                    <option key={d.DriverID} value={d.DriverID}>
                                        {`${d.DriverName} - ${d.VehicleType} (${d.VehicleNumber})`}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No matching drivers available</option>
                            )}
                        </select>

                        <button onClick={handleAssign}>Assign</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignSingleTrip;
