import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VendorNavbar from './vendor_navbar';
import styles from './manageDriver.module.css';

const ManageDrivers = () => {
    const vendorId = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;
    const [drivers, setDrivers] = useState([]);
    const [editingDriver, setEditingDriver] = useState(null);
    const [selectedDriverVehicleType, setSelectedDriverVehicleType] = useState('');
    const [showPaymentRateForm, setShowPaymentRateForm] = useState(false);
    const [paymentRateDriverId, setPaymentRateDriverId] = useState(null);
    const [paymentRateData, setPaymentRateData] = useState(null);
    const [isUpdatingPaymentRate, setIsUpdatingPaymentRate] = useState(false);
    const [driverPaymentStatus, setDriverPaymentStatus] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        const res = await axios.get(`http://localhost:5000/api/vendor/drivers/${vendorId}`);
        const fetchedDrivers = res.data.drivers;
        setDrivers(fetchedDrivers);

        const promises = fetchedDrivers.map(driver =>
            axios
                .get(`http://localhost:5000/api/vendor/driver-payment-rates/${driver.DriverID}`)
                .then(res => [driver.DriverID, res.data && Object.keys(res.data).length > 0])
                .catch(() => [driver.DriverID, false])
        );

        const results = await Promise.all(promises);
        const statusMap = Object.fromEntries(results);
        setDriverPaymentStatus(statusMap);
    };

    const handleStatusToggle = async (driverId, currentStatus) => {
        const newStatus = currentStatus === 'Available' ? 'Unavailable' : 'Available';
        await axios.patch(`http://localhost:5000/api/vendor/drivers/${driverId}/status`, {
            status: newStatus,
            vendorID: vendorId,
        });
        fetchDrivers();
    };

    const handleEdit = (driver) => {
        setEditingDriver({ ...driver });
        setShowEditModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingDriver({ ...editingDriver, [name]: value });
    };

    const handleSave = async () => {
        await axios.put(`http://localhost:5000/api/vendor/drivers/${editingDriver.DriverID}`, {
            name: editingDriver.Name,
            licenseNumber: editingDriver.LicenseNumber,
            contactNumber: editingDriver.ContactNumber,
            vendorID: vendorId,
        });
        alert('Driver details updated successfully'); 
        setEditingDriver(null);
        setShowEditModal(false);
        fetchDrivers();
    };

    const handleAssignVehicle = (driverId) => {
        window.location.href = `/vendor-assign-vehicle/${driverId}`;
    };

    const handleRemoveVehicle = async (driverId) => {
        const confirm = window.confirm('Are you sure you want to unassign this vehicle?');
        if (!confirm) return;
        try {
            const res = await axios.put(`http://localhost:5000/api/vendor/drivers/${driverId}/unassign-vehicle`);
            if (res.status === 200) {
                alert('Vehicle unassigned successfully.');
                fetchDrivers();
            } else {
                alert('Failed to unassign vehicle.');
            }
        } catch (error) {
            console.error('Error removing vehicle:', error);
            alert('An error occurred while removing the vehicle.');
        }
    };

    const handleAddPaymentRate = async (driverId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/vendor/drivers/${driverId}/vehicle-type`);
            setSelectedDriverVehicleType(res.data.vehicleType);
            setPaymentRateDriverId(driverId);

            const rateRes = await axios.get(`http://localhost:5000/api/vendor/driver-payment-rates/${driverId}`);
            if (rateRes.data && Object.keys(rateRes.data).length > 0) {
                setPaymentRateData(rateRes.data);
                setIsUpdatingPaymentRate(true);
            } else {
                setPaymentRateData(null);
                setIsUpdatingPaymentRate(false);
            }

            setShowPaymentRateForm(true);
        } catch (err) {
            alert('No vehicle assigned or failed to fetch vehicle type.');
            console.error(err);
        }
    };

    const handlePaymentRateSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const paymentRate = {
            DriverID: paymentRateDriverId,
            VehicleType: selectedDriverVehicleType,
            RatePerKm: parseFloat(formData.get('RatePerKm')),
            RatePerHour: parseFloat(formData.get('RatePerHour')),
            MinimumKm: parseInt(formData.get('MinimumKm')),
            BaseRate: parseFloat(formData.get('BaseRate')),
            BataPerDay: parseFloat(formData.get('BataPerDay')),
        };

        if (
            isNaN(paymentRate.RatePerKm) ||
            isNaN(paymentRate.RatePerHour) ||
            isNaN(paymentRate.MinimumKm) ||
            isNaN(paymentRate.BaseRate) ||
            isNaN(paymentRate.BataPerDay)
        ) {
            alert("Please enter valid numbers for all fields.");
            return;
        }

        try {
            if (isUpdatingPaymentRate) {
                const response = await axios.put('http://localhost:5000/api/vendor/driver-payment-rates', paymentRate);
                if (response.status === 200) {
                    alert('Payment rate updated successfully');
                    setShowPaymentRateForm(false);
                }
            } else {
                const response = await axios.post('http://localhost:5000/api/vendor/driver-payment-rates', paymentRate);
                if (response.status === 201) {
                    alert('Payment rate saved successfully');
                    setShowPaymentRateForm(false);
                }
            }
        } catch (error) {
            console.error('Error saving or updating payment rate:', error);
            alert('Failed to save or update payment rate');
        }
    };

    const handleView = (driverId) => {
        window.location.href = `/vendor-driver-profile/${driverId}`;
    };

    return (
        <>
            <VendorNavbar />
            <div className={styles.manageContainer}>
                <h2 className={styles.heading}>Manage Your Drivers</h2>
                <button className={styles.driverBtn} onClick={() => navigate('/vendor-add-driver')}>
                    Add new Driver
                </button>

                {showEditModal && editingDriver && (
                    <div className={styles.editForm}>
                        <div className={styles.editformGroup}>
                            <h3 className="text-xl font-bold mb-4">Edit Driver</h3>
                            <label>Name:
                                <input type="text" name="Name" value={editingDriver.Name} onChange={handleInputChange} className="w-full border p-2 rounded" />
                            </label>
                            <label>License Number:
                                <input type="text" name="LicenseNumber" value={editingDriver.LicenseNumber} onChange={handleInputChange} className="w-full border p-2 rounded" />
                            </label>
                            <label>Contact Number:
                                <input type="text" name="ContactNumber" value={editingDriver.ContactNumber} onChange={handleInputChange} className="w-full border p-2 rounded" />
                            </label>
                            <div className="flex justify-end gap-4 mt-4">
                                <button className={styles.cancelDriverBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button className={styles.editedDriverBtn} onClick={handleSave}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {showPaymentRateForm && (
                    <div style={{ margin: '10px' }}>
                        <h3>{isUpdatingPaymentRate ? 'Update Payment Rate' : 'Add Payment Rate'}</h3>
                        <form style={{ margin: 'auto' }} onSubmit={handlePaymentRateSubmit}>
                            <label>Vehicle Type</label>
                            <input type="text" value={selectedDriverVehicleType} readOnly /><br />
                            <label>Rate Per Km</label>
                            <input type="number" name="RatePerKm" required defaultValue={paymentRateData?.RatePerKm || ''} /><br />
                            <label>Rate Per Hour</label>
                            <input type="number" name="RatePerHour" required defaultValue={paymentRateData?.RatePerHour || ''} /><br />
                            <label>Minimum Km</label>
                            <input type="number" name="MinimumKm" required defaultValue={paymentRateData?.MinimumKm || ''} /><br />
                            <label>Base Rate</label>
                            <input type="number" name="BaseRate" required defaultValue={paymentRateData?.BaseRate || ''} /><br />
                            <label>Bata Per Day</label>
                            <input type="number" name="BataPerDay" required defaultValue={paymentRateData?.BataPerDay || ''} /><br />
                            <button type="submit">{isUpdatingPaymentRate ? 'Update' : 'Save'}</button>
                            <button type="button" onClick={() => setShowPaymentRateForm(false)}>Cancel</button>
                        </form>
                    </div>
                )}

                <table className={styles.driverTable}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>License</th>
                            <th>Status</th>
                            <th colSpan={2}>Assigned Vehicle</th>
                            <th colSpan={6}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((driver) => (
                            <tr key={driver.DriverID}>
                                <td>{driver.Name}</td>
                                <td>{driver.ContactNumber}</td>
                                <td>{driver.LicenseNumber}</td>
                                <td>{driver.Status}</td>
                                <td colSpan={2}>
                                    {driver.AssignedVehicleNumber && driver.AssignedVehicle
                                        ? `${driver.AssignedVehicleNumber} - ${driver.AssignedVehicle}`
                                        : 'No Vehicle Assigned'}
                                </td>
                                <td colSpan={6}>
                                    <button className={styles.button} onClick={() => handleEdit(driver)}>Edit</button>
                                    {driver.Status === 'Available' && (
                                        <button className={styles.button} onClick={() => handleStatusToggle(driver.DriverID, driver.Status)}>
                                            Deactivate
                                        </button>
                                    )}
                                    {driver.Status === 'Unavailable' && (
                                        <button className={styles.button} onClick={() => handleStatusToggle(driver.DriverID, driver.Status)}>
                                            Activate
                                        </button>
                                    )}

                                    <button className={styles.button} onClick={() => handleView(driver.DriverID)}>View</button>
                                    {driver.AssignedVehicleNumber ? (
                                        <button className={styles.button} onClick={() => handleRemoveVehicle(driver.DriverID)}>Remove Vehicle</button>
                                    ) : (
                                        <button className={styles.button} onClick={() => handleAssignVehicle(driver.DriverID)}>Assign Vehicle</button>
                                    )}
                                    <button className={styles.button} onClick={() => handleAddPaymentRate(driver.DriverID)}>
                                        {driverPaymentStatus[driver.DriverID] ? 'Update Payment Rate' : 'Add Payment Rate'}
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

export default ManageDrivers;
