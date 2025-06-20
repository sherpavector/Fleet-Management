import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AddDriver.module.css';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const ManageDriver = () => {
  const [drivers, setDrivers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDriverVehicleType, setSelectedDriverVehicleType] = useState('');
  const [showPaymentRateForm, setShowPaymentRateForm] = useState(false);
  const [paymentRateDriverId, setPaymentRateDriverId] = useState(null);
  const [paymentRateData, setPaymentRateData] = useState(null);  // Store the current payment rate data
  const [isUpdatingPaymentRate, setIsUpdatingPaymentRate] = useState(false);  // Track if updating
  const [vendors, setVendors] = useState([]); // State to store vendors
  const [selectedVendor, setSelectedVendor] = useState(''); // State for selected vendor

  const navigate = useNavigate();
  const [editedDriver, setEditedDriver] = useState({
    DriverID: '',
    Name: '',
    LicenseNumber: '',
    ContactNumber: '',
  });

  // Fetch all vendors when the component mounts
  const fetchVendors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  // Fetch all drivers when the component mounts
  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/drivers?vendorId=${selectedVendor}`);
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      fetchDrivers(); // Fetch drivers when vendor changes
    }
  }, [selectedVendor]);

  // Handle edit button click
  const handleEdit = (driver) => {
    setIsEditing(true);
    setEditedDriver({
      DriverID: driver.DriverID,
      Name: driver.Name,
      LicenseNumber: driver.LicenseNumber,
      ContactNumber: driver.ContactNumber,
    });
  };

  // Handle form field change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDriver((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission to update driver details
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(`http://localhost:5000/api/drivers/${editedDriver.DriverID}`, editedDriver);
      if (response.status === 200) {
        setDrivers(drivers.map(driver =>
          driver.DriverID === editedDriver.DriverID ? editedDriver : driver
        ));
        setIsEditing(false);
        setEditedDriver({
          DriverID: '',
          Name: '',
          LicenseNumber: '',
          ContactNumber: '',
        });
      }
    } catch (error) {
      console.error('Error updating driver:', error);
    }
  };

  const handleAssignVehicle = (driverId) => {
    window.location.href = `/assign-vehicle/${driverId}`;
  }

  const handleRemoveVehicle = async (driverId) => {
    const confirm = window.confirm('Are you sure you want to unassign this vehicle?');
    if (!confirm) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/${driverId}/unassign-vehicle`);
      if (res.status === 200) {
        alert('Vehicle unassigned successfully.');
        fetchDrivers(); // refresh list
      } else {
        alert('Failed to unassign vehicle.');
      }
    } catch (error) {
      console.error('Error removing vehicle:', error);
      alert('An error occurred while removing the vehicle.');
    }
  };

  const handleDeactivate = (driverId) => {
    axios.post(`http://localhost:5000/api/deactivate-driver/${driverId}`)
      .then(() => {
        alert('Driver deactivated');
        setDrivers(drivers.map(driver =>
          driver.DriverID === driverId ? { ...driver, Status: 'Unavailable' } : driver
        ));
      })
      .catch(error => {
        alert('Failed to deactivate driver');
        console.error('Error deactivating driver:', error);
      });
  };

  const handleActivate = (driverId) => {
    axios.post(`http://localhost:5000/api/activate-driver/${driverId}`)
      .then(() => {
        alert('Driver activated');
        setDrivers(drivers.map(driver =>
          driver.DriverID === driverId ? { ...driver, Status: 'Available' } : driver
        ));
      })
      .catch(error => {
        alert('Failed to activate driver');
        console.error('Error activating driver:', error);
      });
  };

  const handleView = (driverId) => {
    window.location.href = `/driver-profile/${driverId}`;
  }

  const handleAddPaymentRate = async (driverId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/drivers/${driverId}/vehicle-type`);
      setSelectedDriverVehicleType(res.data.vehicleType);
      setPaymentRateDriverId(driverId);

      // Check if payment rate exists for this driver and vehicle type
      const rateRes = await axios.get(`http://localhost:5000/api/driver-payment-rates/${driverId}`);
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
        // Update payment rate
        const response = await axios.put('http://localhost:5000/api/driver-payment-rates', paymentRate);
        if (response.status === 200) {
          alert('Payment rate updated successfully');
          setShowPaymentRateForm(false);
        }
      } else {
        // Add new payment rate
        const response = await axios.post('http://localhost:5000/api/driver-payment-rates', paymentRate);
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

  return (
    <>
      <Navbar />
      <div className={styles.manageDriversContainer}>
        <h2 className={styles.heading}>Manage Drivers</h2>
        <button onClick={() => navigate('/add-driver')} className={styles.driverBtn}>
          Add new Driver
        </button>

        {/* Vendor Filter Dropdown */}
        <div style={{ margin: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <label htmlFor="vendorSelect">Filter by Vendor:</label>
          <select
            id="vendorSelect"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.VendorID} value={vendor.VendorID}>
                {vendor.VendorName}
              </option>
            ))}
          </select>
        </div>

        {showPaymentRateForm && (
          <div className={styles.driverContainer}>
            <h3 className={styles.heading}>{isUpdatingPaymentRate ? 'Update Payment Rate' : 'Add Payment Rate'}</h3>
            <form
              className={styles.editForm}
              onSubmit={handlePaymentRateSubmit}
            >
              <div className={styles.editformGroup}>
                <label>Vehicle Type</label>
                <input type="text" value={selectedDriverVehicleType} readOnly />
              </div>
              <div className={styles.editformGroup}>
                <label>Rate Per Km</label>
                <input type="number" name="RatePerKm" required defaultValue={paymentRateData?.RatePerKm || ''} />
              </div>
              <div className={styles.editformGroup}>
                <label>Rate Per Hour</label>
                <input type="number" name="RatePerHour" required defaultValue={paymentRateData?.RatePerHour || ''} />
              </div>
              <div className={styles.editformGroup}>
                <label>MinimumKm</label>
                <input type="number" name="MinimumKm" required defaultValue={paymentRateData?.MinimumKm || ''} />
              </div>
              <div className={styles.editformGroup}>
                <label>BaseRate</label>
                <input type="number" name="BaseRate" required defaultValue={paymentRateData?.BaseRate || ''} />
              </div>
              <div className={styles.editformGroup}>
                <label>BataPerDay</label>
                <input type="number" name="BataPerDay" required defaultValue={paymentRateData?.BataPerDay || ''} />
              </div>
              <button className={styles.editedDriverBtn} type="submit">{isUpdatingPaymentRate ? 'Update Payment Rate' : 'Save Rate'}</button>
              <button className={styles.cancelDriverBtn} onClick={() => setShowPaymentRateForm(false)}>Cancel</button>
            </form>
          </div>
        )}


        {isEditing ? (
          <div className={styles.driverContainer}>
            <h3 className={styles.heading}>Edit Driver</h3>
            <form onSubmit={handleUpdate} className={styles.editForm}>
              <div className={styles.editformGroup}>
                <label>License Number</label>
                <input
                  type="text"
                  name="LicenseNumber"
                  value={editedDriver.LicenseNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.editformGroup}>
                <label>Contact Number</label>
                <input
                  type="text"
                  name="ContactNumber"
                  value={editedDriver.ContactNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button className={styles.editedDriverBtn} type="submit">Update Driver</button>
              <button className={styles.cancelDriverBtn} type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </form>
          </div>
        ) : (
          <table className={styles.driverTable}>
            <thead>
              <tr>
                {/* <th>Driver ID</th> */}
                <th>Driver Name</th>
                <th>Status</th>
                <th>License Number</th>
                <th >Contact</th>
                <th>Assigned Vehicle</th>
                <th colSpan={10}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? (
                drivers.map(driver => (
                  <tr key={driver.DriverID}>
                    {/* <td >{driver.DriverID}</td> */}
                    <td >{driver.DriverName}</td>
                    <td >{driver.Status}</td>
                    <td>{driver.LicenseNumber}</td>
                    <td >{driver.ContactNumber}</td>
                    <td>
                      {driver.AssignedVehicleNumber && driver.AssignedVehicle
                        ? `${driver.AssignedVehicleNumber} - ${driver.AssignedVehicle}`
                        : 'No Vehicle Assigned'}
                    </td>

                    <td colSpan={9}>
                      <button className={styles.button} onClick={() => handleView(driver.DriverID)}>View</button>
                      <button className={styles.button} onClick={() => handleEdit(driver)}>Edit</button>
                      {driver.AssignedVehicleNumber ? (
                        <button
                          className={styles.button}
                          onClick={() => handleRemoveVehicle(driver.DriverID)}
                        >
                          Remove Vehicle
                        </button>
                      ) : (
                        <button
                          className={styles.button}
                          onClick={() => handleAssignVehicle(driver.DriverID)}
                        >
                          Assign Vehicle
                        </button>
                      )}
                      <button className={styles.button} onClick={() => handleAddPaymentRate(driver.DriverID)}>Add Payment Rate</button>
                      {driver.Status === 'Available' ? (
                        <button className={styles.button} onClick={() => handleDeactivate(driver.DriverID)}>Deactivate</button>
                      ) : driver.Status === 'Unavailable' ? (
                        <button className={styles.button} onClick={() => handleActivate(driver.DriverID)}>Activate</button>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>No drivers found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default ManageDriver;
