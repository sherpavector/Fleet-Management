import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AddDriver.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const AssignVehicle = () => {
    const { driverId } = useParams();
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const navigate = useNavigate();

    // Fetch only available vehicles when the component mounts
    useEffect(() => {
        const fetchAvailableVehicles = async () => {
            try {
                // Fetch vehicles where status is 'Available'
                const response = await axios.get('http://localhost:5000/api/vehicles/available');
                console.log(response.data); // Log the response data to check if it's being fetched correctly
                setVehicles(response.data);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };

        fetchAvailableVehicles();
    }, []);


    // Handle vehicle selection
    const handleVehicleChange = (e) => {
        setSelectedVehicle(e.target.value);
    };

    // Handle vehicle assignment
    const handleAssignVehicle = async (e) => {
        e.preventDefault();

        if (!selectedVehicle) {
            alert('Please select a vehicle');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/assign-vehicle', {
                driverId,
                vehicleId: selectedVehicle,
            });

            if (response.status === 200) {
                alert('Vehicle assigned successfully');
                navigate(`/manage-driver`);  // Navigate back to the Manage Driver page
            }
        } catch (error) {
            console.error('Error assigning vehicle:', error);
            alert('Failed to assign vehicle');
        }
    };

    return (
        <div className={styles.assignVehicleContainer}>
            <h2>Assign Vehicle to Driver</h2>
            <div className={styles.backLink}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", marginBottom: "30px", justifyContent: "center" }}
            >
                <ArrowBackRoundedIcon />
                <a style={{ color: "black", fontSize: "20px" }} href='/manage-driver'>Go Back</a>
            </div>
            <form className={styles.assignform} onSubmit={handleAssignVehicle}>
                <div className={styles.formGroup}>
                    <label className={styles.assignLabel}>Select Vehicle</label>
                    <select value={selectedVehicle} onChange={handleVehicleChange}>
                        <option className={styles.assignOption} value="">-- Select a Vehicle --</option>
                        {vehicles.length > 0 ? (
                            vehicles.map(vehicle => (
                                <option key={vehicle.VehicleID} value={vehicle.VehicleID}>
                                    {vehicle.VehicleNumber} ({vehicle.TypeOfVehicle}) - {vehicle.VendorName}
                                </option>
                            ))
                        ) : (
                            <option>No available vehicles</option>
                        )}
                    </select>
                </div>
                <button type="submit" className={styles.assignButton}>Assign Vehicle</button>
            </form>
        </div>
    );
};

export default AssignVehicle;
