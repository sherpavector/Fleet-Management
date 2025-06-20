import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import styles from './manageDriver.module.css';

const AssignVehicle = () => {
    const { driverId } = useParams();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');

    useEffect(() => {
        fetchAvailableVehicles();
    }, []);

    const fetchAvailableVehicles = async () => {
        try {
            const vendorId = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;
            const res = await axios.get(`http://localhost:5000/api/vendor/${vendorId}/available-vehicles`);

            // Remove duplicate VehicleID entries
            const uniqueVehicles = Array.from(
                new Map(res.data.map(v => [v.VehicleID, v])).values()
            );

            setVehicles(uniqueVehicles);
        } catch (err) {
            console.error('Error fetching vendor vehicles:', err);
        }
    };



    const handleAssign = async () => {
        if (!selectedVehicleId) {
            alert('Please select a vehicle');
            return;
        }

        try {
            await axios.put(`http://localhost:5000/api/vendor/drivers/${driverId}/assign-vehicle`, {
                vehicleId: selectedVehicleId,
            });
            alert('Vehicle assigned successfully');
            navigate('/vendor-manage-driver');
        } catch (err) {
            console.error('Error assigning vehicle:', err);
            alert('Failed to assign vehicle');
        }
    };

    return (

        <div className={styles.container}>
            <h2 className={styles.assignVehicleHeading}>Assign Vehicle to Driver</h2>
            <div className={styles.backLink}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", marginBottom: "30px", justifyContent: "center" }}
            >
                <ArrowBackRoundedIcon />
                <a style={{ color: "white", fontSize: "20px" }} href='/vendor-manage-driver'>Go Back</a>
            </div>
            <form className={styles.formcontainer}>
                <div>
                    <label className={styles.text}>Select Vehicle: </label>
                    <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                        <option value="">Select a vehicle</option>
                        {vehicles.map(vehicle => (
                            <option key={`${vehicle.VehicleID}-${vehicle.VehicleNumber}`} value={vehicle.VehicleID}>
                                {vehicle.VehicleNumber} - {vehicle.TypeOfVehicle}
                            </option>
                        ))}
                    </select>
                    <br /><br />
                    <button className={styles.btn} onClick={handleAssign}>Assign Vehicle</button>
                    <button className={styles.btn} onClick={() => navigate('/vendor-manage-driver')}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default AssignVehicle;
