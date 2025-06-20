import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from '../styles/DriverProfile.module.css';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const DriverProfile = () => {
    const { driverId } = useParams();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (driverId) {
            axios.get(`http://localhost:5000/api/drivers/${driverId}`)
                .then(response => {
                    setDriver(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching driver profile:', error);
                    setLoading(false);
                });
        }
    }, [driverId]);

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!driver) return <div className={styles.error}>Driver not found</div>;

    return (
        <div className={styles.profileContainer}>
            <h2 className={styles.sectionTitle}>Driver Profile</h2>
            <div className={styles.backLink}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", justifyContent: "center" }}
            >
                <ArrowBackRoundedIcon />
                <a style={{ color: "black", fontSize: "20px" }} href='/vendor-manage-driver'>Go Back</a>
            </div>
            <div className={styles.sectionContainer}>
                <section className={styles.section}>
                    <h3>Basic Information</h3>
                    <div className={styles.infoGrid}>
                        <div><strong>Name:</strong> {driver.Name}</div>
                        <div><strong>Employee ID:</strong> {driver.EmployeeID}</div>
                        <div><strong>License Number:</strong> {driver.LicenseNumber}</div>
                        <div><strong>Contact:</strong> {driver.ContactNumber}</div>
                        <div><strong>Email:</strong> {driver.Email}</div>
                        <div><strong>Date of Joining:</strong> {new Date(driver.CreatedAt).toLocaleDateString()}</div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Payment Rate</h3>
                    {driver.PaymentDetails && driver.PaymentDetails.length > 0 ? (
                        driver.PaymentDetails.map((payment, index) => (
                            <div key={index} className={styles.infoGrid}>
                                <div><strong>Rate Per Km:</strong> {payment.RatePerKm}</div>
                                <div><strong>Rate Per Hour:</strong> {payment.RatePerHour}</div>
                                <div><strong>Minimum Km:</strong> {payment.MinimumKm}</div>
                                <div><strong>Base Rate:</strong> {payment.BaseRate}</div>
                                <div><strong>Bata Per Day:</strong> {payment.BataPerDay}</div>
                            </div>
                        ))
                    ) : (
                        <p>No payment details available.</p>
                    )}
                </section>

                <section className={styles.section}>
                    <h3>License & Verification</h3>
                    <div className={styles.infoGrid}>
                        <div><strong>Issue Date:</strong> {driver.IssueDate ? new Date(driver.IssueDate).toLocaleDateString() : 'Not available'}</div>
                        <div><strong>Expiry Date:</strong> {driver.ExpiryDate ? new Date(driver.ExpiryDate).toLocaleDateString() : 'Not available'}</div>
                        <div><strong>Police Verification:</strong> {driver.PoliceVerificationDoneDate ? new Date(driver.PoliceVerificationDoneDate).toLocaleDateString() : 'Not available'}</div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Documents</h3>
                    {driver.Documents && driver.Documents.length > 0 ? (
                        <p className={styles.list}>
                            {driver.Documents.map((doc, index) => (
                                <strong key={index}>
                                    {doc.name} — <a href={doc.url} target="_blank" rel="noreferrer">View</a>
                                </strong>
                            ))}
                        </p>
                    ) : (
                        <p>No documents available.</p>
                    )}
                </section>

                <section className={styles.section}>
                    <h3>Vehicle Assignments</h3>
                    {driver.AssignedVehicles && driver.AssignedVehicles.length > 0 ? (
                        <p className={styles.list}>
                            {driver.AssignedVehicles.map((vehicle, index) => (
                                <strong key={index}>
                                    {vehicle.VehicleNumber} ({vehicle.TypeOfVehicle}) - {vehicle.VehicleStatus}
                                </strong>
                            ))}
                        </p>
                    ) : (
                        <p>No vehicles assigned.</p>
                    )}
                </section>

                <section className={styles.section}>
                    <h3>Trip Management</h3>
                    <p><strong>Total Trips Completed:</strong> {driver.TotalTrips ?? 0}</p>

                    {driver.Trips && driver.Trips.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.tripTable}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Client Name</th>
                                        <th>Pickup Location</th>
                                        <th>Drop Location</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {driver.Trips.map((trip, index) => (
                                        <tr key={trip.TripID ?? index}>
                                            <td>{index + 1}</td>
                                            <td>{trip.ClientName}</td>
                                            <td>{trip.PickupLocation}</td>
                                            <td>{trip.DropLocation}</td>
                                            <td>
                                                <span style={{ color: 'green', fontWeight: 'bold' }}>
                                                    {trip.TripStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>No completed trips.</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default DriverProfile;
