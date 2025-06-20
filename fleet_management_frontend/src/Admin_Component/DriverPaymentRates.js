import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/VehicleManagement.module.css';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useParams } from 'react-router-dom';

const DriverPaymentRates = () => {
    const { driverId } = useParams();
    const [rates, setRates] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [formData, setFormData] = useState({
        DriverID: '',
        VehicleType: '',
        RatePerKm: '',
        RatePerHour: '',
        MinimumKm: '',
        BaseRate: '',
        BataPerDay: ''
    });
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchRates();
        fetchVehicleTypes();
    }, []);

    const fetchRates = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/driver-payment-rates');
            if (Array.isArray(res.data)) {
                setRates(res.data);
            } else {
                console.error("API did not return an array:", res.data);
                setRates([]); // fallback to empty
            }
        } catch (err) {
            alert('Error fetching driver payment rates');
            console.error(err);
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/manage-vehicle-types');
            setVehicleTypes(res.data.map((v) => v.TypeOfVehicle));
        } catch (err) {
            alert('Error fetching vehicle types');
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                DriverID: driverId  // Always attach from URL param
            }
            if (editId) {
                await axios.put(`http://localhost:5000/api/driver-payment-rates/${editId}`, payload);
                alert('Payment rate updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/driver-payment-rates', {
                    ...formData,
                    DriverID: driverId
                });

                alert('Payment rate added successfully');
            }
            fetchRates();
            resetForm();
        } catch (err) {
            alert('Error saving payment rate');
        }
    };

    const resetForm = () => {
        setFormData({
            VehicleType: '',
            RatePerKm: '',
            RatePerHour: '',
            MinimumKm: '',
            BaseRate: '',
            BataPerDay: ''
        });
        setEditId(null);
    };

    const handleEdit = (rate) => {
        setEditId(rate.DriverRateID);
        setFormData({
            VehicleType: rate.VehicleType,
            RatePerKm: rate.RatePerKm,
            RatePerHour: rate.RatePerHour,
            MinimumKm: rate.MinimumKm,
            BaseRate: rate.BaseRate,
            BataPerDay: rate.BataPerDay
        });
    };


    return (
        <div className={styles.priceContainer}>
            <h2>Driver Payment Rates</h2>
            <div className={styles.backLink}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", marginBottom: "20px", justifyContent: "center" }}
            >
                <ArrowBackRoundedIcon />
                <a style={{ color: "black", fontSize: "20px" }} href='/manage-driver'>Go Back</a>
            </div>

            <form onSubmit={handleSubmit} className={styles.priceForm}>
                <select id="VehicleType" value={formData.VehicleType} onChange={handleInputChange} required>
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                    ))}
                </select>
                <input type="number" id="RatePerKm" placeholder="Rate Per Km" value={formData.RatePerKm} onChange={handleInputChange} />
                <input type="number" id="RatePerHour" placeholder="Rate Per Hour" value={formData.RatePerHour} onChange={handleInputChange} />
                <input type="number" id="MinimumKm" placeholder="Minimum Km" value={formData.MinimumKm} onChange={handleInputChange} />
                <input type="number" id="BaseRate" placeholder="Base Rate" value={formData.BaseRate} onChange={handleInputChange} />
                <input type="number" id="BataPerDay" placeholder="Bata Per Day" value={formData.BataPerDay} onChange={handleInputChange} />
                <button className={styles.priceAddButton} type="submit">{editId ? 'Update' : 'Add'} Rate</button>
            </form>

            <table className={styles.priceTable}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Driver ID</th>
                        <th>Vehicle Type</th>
                        <th>Rate/Km</th>
                        <th>Rate/Hour</th>
                        <th>Min Km</th>
                        <th>Base Rate</th>
                        <th>Bata/Day</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rates.map((r) => (
                        <tr key={r.DriverRateID}>
                            <td>{r.DriverRateID}</td>
                            <td>{r.DriverID}</td>
                            <td>{r.VehicleType}</td>
                            <td>{r.RatePerKm}</td>
                            <td>{r.RatePerHour}</td>
                            <td>{r.MinimumKm}</td>
                            <td>{r.BaseRate}</td>
                            <td>{r.BataPerDay}</td>
                            <td>
                                <button className={styles.priceEditButton} onClick={() => handleEdit(r)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DriverPaymentRates;
