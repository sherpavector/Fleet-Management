import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './vendor_navbar';
import styles from '../styles/VehicleManagement.module.css';

const VehicleManagement = () => {
    const [vehicles, setVehicles] = useState([]);
    const [viewDetailsVehicle, setViewDetailsVehicle] = useState(null);
    const [vehiclePriceList, setVehiclePriceList] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [priceLists, setPriceLists] = useState([]);
    const navigate = useNavigate();

    const vendorID = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;

    const [newVehicle, setNewVehicle] = useState({
        typeOfVehicle: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleNumber: '',
        fitnessCertificateExpiry: '',
        rcExpiryDate: '',
        taxExpiryDate: '',
        insuranceExpiryDate: ''
    });

    const fetchVehicles = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/vendor/manage-vehicles?vendorID=${vendorID}`);
            setVehicles(response.data);
        } catch (error) {
            console.error('Error fetching vehicles', error);
        }
    };

    const fetchPriceLists = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/vendor/manage-pricelists/${vendorID}`);
            setPriceLists(res.data);
        } catch (err) {
            console.error('Error fetching price lists', err);
        }
    };

    const addVehicle = async (e) => {
        e.preventDefault();
        const formattedVehicle = formatDates({ ...newVehicle, vendorID });
        try {
            await axios.post('http://localhost:5000/api/vendor/manage-vehicles', formattedVehicle);
            alert("Vehicle added successfully");
            fetchVehicles();
            resetForm();
        } catch (error) {
            console.error('Error adding vehicle', error);
        }
    };

    const updateVehicle = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) return;
        const formattedVehicle = formatDates({ ...newVehicle, vendorID });
        try {
            await axios.put(`http://localhost:5000/api/vendor/manage-vehicles/${selectedVehicle.VehicleID}`, formattedVehicle);
            alert("Vehicle updated successfully");
            fetchVehicles();
            resetForm();
        } catch (error) {
            console.error('Error updating vehicle', error);
        }
    };

    const deleteVehicle = async (vehicleID) => {
        if (window.confirm("Do you want to delete this vehicle?")) {
            try {
                await axios.delete(`http://localhost:5000/api/vendor/manage-vehicles/${vehicleID}`);
                alert("Vehicle deleted successfully");
                fetchVehicles();
            } catch (error) {
                console.error('Error deleting vehicle', error);
            }
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setNewVehicle(prev => ({ ...prev, [id]: value }));
    };

    const editVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setNewVehicle({
            typeOfVehicle: vehicle.TypeOfVehicle,
            vehicleMake: vehicle.VehicleMake,
            vehicleModel: vehicle.VehicleModel,
            vehicleNumber: vehicle.VehicleNumber,
            fitnessCertificateExpiry: vehicle.FitnessCertificateExpiry?.split('T')[0] || '',
            rcExpiryDate: vehicle.RCExpiryDate?.split('T')[0] || '',
            taxExpiryDate: vehicle.TaxExpiryDate?.split('T')[0] || '',
            insuranceExpiryDate: vehicle.InsuranceExpiryDate?.split('T')[0] || ''
        });
    };

    const resetForm = () => {
        setSelectedVehicle(null);
        setNewVehicle({
            typeOfVehicle: '',
            vehicleMake: '',
            vehicleModel: '',
            vehicleNumber: '',
            fitnessCertificateExpiry: '',
            rcExpiryDate: '',
            taxExpiryDate: '',
            insuranceExpiryDate: ''
        });
    };

    const formatDates = (vehicle) => ({
        ...vehicle,
        fitnessCertificateExpiry: formatDate(vehicle.fitnessCertificateExpiry),
        rcExpiryDate: formatDate(vehicle.rcExpiryDate),
        taxExpiryDate: formatDate(vehicle.taxExpiryDate),
        insuranceExpiryDate: formatDate(vehicle.insuranceExpiryDate)
    });

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const viewVehicleDetails = async (vehicle) => {
        setViewDetailsVehicle(vehicle);
        try {
            const res = await axios.get(`http://localhost:5000/api/vendor/manage-pricelists/${vendorID}`);
            const matchedPrice = res.data.find(pl => pl.VehicleType === vehicle.TypeOfVehicle);
            setVehiclePriceList(matchedPrice || null);
        } catch (err) {
            console.error('Error fetching price list', err);
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchPriceLists();
    }, []);

    return (
        <>
            <Navbar />
            <div className={styles.vehicleContainer}>
                <h1 className={styles.title}>Vehicle Management</h1>

                <div className={styles.formContainer}>
                    <h2 className={styles.subHeading}>{selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                    <form className={styles.vehicleform} onSubmit={selectedVehicle ? updateVehicle : addVehicle}>
                        {['typeOfVehicle', 'vehicleMake', 'vehicleModel', 'vehicleNumber'].map(field => (
                            <div key={field} className={styles.inputGroup}>
                                <label htmlFor={field} className={styles.label}>{field.replace(/([A-Z])/g, ' $1')}</label>
                                <input
                                    type="text"
                                    id={field}
                                    value={newVehicle[field]}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    required
                                />
                            </div>
                        ))}

                        {[{ id: 'fitnessCertificateExpiry', label: 'Fitness Certificate Expiry' },
                        { id: 'rcExpiryDate', label: 'RC Expiry Date' },
                        { id: 'taxExpiryDate', label: 'Tax Expiry Date' },
                        { id: 'insuranceExpiryDate', label: 'Insurance Expiry Date' }]
                            .map(({ id, label }) => (
                                <div key={id} className={styles.inputGroup}>
                                    <label htmlFor={id} className={styles.label}>{label}</label>
                                    <input
                                        type="date"
                                        id={id}
                                        value={newVehicle[id]}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                    />
                                </div>
                            ))}

                        <div className={styles.formActions}>
                            <button className={styles.submitButton} type="submit">
                                {selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                            </button>
                            {selectedVehicle && (
                                <button className={styles.submitButton} type="button" onClick={resetForm}>Cancel</button>
                            )}
                        </div>
                    </form>
                </div>

                {viewDetailsVehicle && (
                    <div className={styles.detailsBox}>
                        <h3>Vehicle Details</h3>
                        <div className={styles.detailsGrid}>
                            {[{ label: 'Type', value: viewDetailsVehicle.TypeOfVehicle },
                            { label: 'Make', value: viewDetailsVehicle.VehicleMake },
                            { label: 'Model', value: viewDetailsVehicle.VehicleModel },
                            { label: 'Number', value: viewDetailsVehicle.VehicleNumber },
                            { label: 'Vendor ID', value: viewDetailsVehicle.VendorID },
                            { label: 'Fitness Expiry', value: new Date(viewDetailsVehicle.FitnessCertificateExpiry).toLocaleDateString() },
                            { label: 'RC Expiry', value: new Date(viewDetailsVehicle.RCExpiryDate).toLocaleDateString() },
                            { label: 'Tax Expiry', value: new Date(viewDetailsVehicle.TaxExpiryDate).toLocaleDateString() },
                            { label: 'Insurance Expiry', value: new Date(viewDetailsVehicle.InsuranceExpiryDate).toLocaleDateString() }]
                                .map(({ label, value }) => (
                                    <p key={label}><strong>{label}:</strong> {value}</p>
                                ))}
                        </div><br />
                        <hr />
                        <div className={styles.priceList}>
                            <h3>Associated Price List</h3>
                            {vehiclePriceList ? (
                                <ul className={styles.detailsGrid}>
                                    <p><strong>Rate/Km:</strong> {vehiclePriceList.RatePerKm}</p>
                                    <p><strong>Rate/Hour:</strong> {vehiclePriceList.RatePerHour}</p>
                                    <p><strong>Minimum Km:</strong> {vehiclePriceList.MinimumKm}</p>
                                    <p><strong>Base Rate:</strong> {vehiclePriceList.BaseRate}</p>
                                    <p><strong>Waiting Charge/Hour:</strong> {vehiclePriceList.WaitingChargePerHour}</p>
                                    <p><strong>Night Charge:</strong> {vehiclePriceList.NightCharge}</p>
                                </ul>
                            ) : <p>No price list found for this vehicle type.</p>}
                        </div>

                        <button className={styles.closeButton} onClick={() => {
                            setViewDetailsVehicle(null);
                            setVehiclePriceList(null);
                        }}>Close</button>
                    </div>
                )}

                <h2 className={styles.subHeading}>All Vehicles</h2>
                <table className={styles.vehicleTable}>
                    <thead>
                        <tr>
                            <th>Vehicle ID</th>
                            <th>Type</th>
                            <th>Number</th>
                            <th colSpan={4}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(vehicle => (
                            <tr key={vehicle.VehicleID}>
                                <td>{vehicle.VehicleID}</td>
                                <td>{vehicle.TypeOfVehicle}</td>
                                <td>{vehicle.VehicleNumber}</td>
                                <td><button className={styles.viewButton} onClick={() => viewVehicleDetails(vehicle)}>View</button></td>
                                <td><button className={styles.editButton} onClick={() => editVehicle(vehicle)}>Edit</button></td>
                                <td><button className={styles.deleteButton} onClick={() => deleteVehicle(vehicle.VehicleID)}>Delete</button></td>
                                <td>
                                    <button
                                        className={styles.viewButton}
                                        onClick={() => navigate('/vendor-price-list', {
                                            state: { vehicleType: vehicle.TypeOfVehicle }
                                        })}
                                    >
                                        {
                                            priceLists.some(pl => pl.VehicleType === vehicle.TypeOfVehicle)
                                                ? 'Update Price List'
                                                : 'Add Price List'
                                        }
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default VehicleManagement;
