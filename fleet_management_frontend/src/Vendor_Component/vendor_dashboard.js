import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VendorNavbar from './vendor_navbar';
import { Link, useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

const VendorDashboard = () => {
    const vendorData = JSON.parse(localStorage.getItem('vendorData'))?.vendorData;
    const vendorID = vendorData?.vendorID;
    const [summary, setSummary] = useState({});

    useEffect(() => {
        if (vendorID) {
            axios.get(`http://localhost:5000/api/vendor/summary/${vendorID}`)
                .then(res => setSummary(res.data))
                .catch(err => console.error('Failed to fetch summary', err));
        }
    }, [vendorID]);

    if (!vendorID) return <p>Please log in as vendor.</p>;

    return (
        <>
            <VendorNavbar />
            <div className="vendor-dashboard">
                <h2>Welcome, <span>{vendorData.companyName}</span></h2>
                <div className="summary-container">
                    <Link className="card" to="/vendor-manage-driver">
                        <h3>Drivers</h3>
                        <p>Total: {summary.totalDrivers || 0}</p>
                        <p>Active: {summary.activeDrivers || 0}</p>
                        <p>Inactive: {summary.inactiveDrivers || 0}</p>
                    </Link>

                    <Link className="card" to="/vendor-manage-vehicle">
                        <h3>Vehicles</h3>
                        <p>Total: {summary.totalVehicles || 0}</p>
                        <p>Assigned: {summary.assignedVehicles || 0}</p>
                        <p>Unassigned: {summary.unassignedVehicles || 0}</p>
                    </Link>

                    <Link className="card" to="/view-trips">
                        <h3>Trips</h3>
                        <p>Requested: {summary.requestedTrips || 0}</p>
                        <p>Ongoing: {summary.ongoingTrips || 0}</p>
                        <p>Completed: {summary.completedTrips || 0}</p>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default VendorDashboard;
