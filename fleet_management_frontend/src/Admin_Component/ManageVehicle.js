import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import styles from '../styles/VehicleManagement.module.css';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [viewDetailsVehicle, setViewDetailsVehicle] = useState(null);
  const [vehiclePriceList, setVehiclePriceList] = useState(null);
  const navigate = useNavigate();
  const [newVehicle, setNewVehicle] = useState({
    typeOfVehicle: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleNumber: '',
    vendorID: '',
    fitnessCertificateExpiry: '',
    rcExpiryDate: '',
    taxExpiryDate: '',
    insuranceExpiryDate: ''
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/manage-vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles', error);
    }
  };

  const addVehicle = async (e) => {
    e.preventDefault();
    const formattedNewVehicle = formatDates(newVehicle);
    try {
      await axios.post('http://localhost:5000/api/manage-vehicles', formattedNewVehicle);
      alert("Vehicle Added Successfully");
      fetchVehicles();
      resetForm();
    } catch (error) {
      console.error('Error adding vehicle', error);
    }
  };

  const updateVehicle = async (e) => {
    e.preventDefault();
    const formattedNewVehicle = formatDates(newVehicle);
    try {
      await axios.put(`http://localhost:5000/api/manage-vehicles/${selectedVehicle.VehicleID}`, formattedNewVehicle);
      fetchVehicles();
      alert("Vehicle Updated Successfully");
      resetForm();
    } catch (error) {
      console.error('Error updating vehicle', error);
    }
  };

  const deleteVehicle = async (vehicleID) => {
    try {
      if (window.confirm("Do you want to delete this vehicle?")) {
        await axios.delete(`http://localhost:5000/api/manage-vehicles/${vehicleID}`);
        alert("Vehicle deleted Successfully");
        fetchVehicles();
      }
    } catch (error) {
      console.error('Error deleting vehicle', error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewVehicle({ ...newVehicle, [id]: value });
  };

  const editVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewVehicle({
      typeOfVehicle: vehicle.TypeOfVehicle,
      vehicleMake: vehicle.VehicleMake,
      vehicleModel: vehicle.VehicleModel,
      vehicleNumber: vehicle.VehicleNumber,
      vendorID: vehicle.VendorID,
      fitnessCertificateExpiry: vehicle.FitnessCertificateExpiry.split('T')[0] || '',
      rcExpiryDate: vehicle.RCExpiryDate.split('T')[0] || '',
      taxExpiryDate: vehicle.TaxExpiryDate.split('T')[0] || '',
      insuranceExpiryDate: vehicle.InsuranceExpiryDate.split('T')[0] || ''
    });
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setNewVehicle({
      typeOfVehicle: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleNumber: '',
      vendorID: '',
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
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const viewVehicleDetails = async (vehicle) => {
    setViewDetailsVehicle(vehicle);
    try {
      const res = await axios.get(`http://localhost:5000/api/manage-pricelists`);
      const matchedPrice = res.data.find(pl => pl.VehicleType === vehicle.TypeOfVehicle);
      setVehiclePriceList(matchedPrice);
    } catch (err) {
      console.error('Error fetching price list', err);
      setVehiclePriceList(null);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/vehicles/vendors');
      setVendors(res.data);
    } catch (error) {
      console.error('Error fetching vendors', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchVendors();
  }, []);

  return (
    <>
      <Navbar />
      <div className={styles.vehicleContainer}>
        <h2 className={styles.title}>Vehicle Management</h2>
        <div className={styles.formContainer}>
          <h3 className={styles.subHeading}>{selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
          <form className={styles.vehicleform} onSubmit={selectedVehicle ? updateVehicle : addVehicle}>
            {[
              { id: 'typeOfVehicle', label: 'Type of Vehicle' },
              { id: 'vehicleMake', label: 'Vehicle Make' },
              { id: 'vehicleModel', label: 'Vehicle Model' },
              { id: 'vehicleNumber', label: 'Vehicle Number' }
            ].map(field => (
              <div key={field.id} className={styles.inputGroup}>
                <label htmlFor={field.id} className={styles.label}>{field.label}</label>
                <input
                  className={styles.input}
                  type="text"
                  id={field.id}
                  value={newVehicle[field.id]}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ))}

            <div className={styles.inputGroup}>
              <label htmlFor="vendorID" className={styles.label}>Vendor</label>
              <select
                id="vendorID"
                className={styles.input}
                value={newVehicle.vendorID}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.VendorID} value={vendor.VendorID}>
                    {vendor.VendorName}
                  </option>
                ))}
              </select>
            </div>

            {[
              { id: 'fitnessCertificateExpiry', label: 'Fitness Certificate Expiry' },
              { id: 'rcExpiryDate', label: 'RC Expiry Date' },
              { id: 'taxExpiryDate', label: 'Tax Expiry Date' },
              { id: 'insuranceExpiryDate', label: 'Insurance Expiry Date' }
            ].map(field => (
              <div key={field.id} className={styles.inputGroup}>
                <label htmlFor={field.id} className={styles.label}>{field.label}</label>
                <input
                  className={styles.input}
                  type="date"
                  id={field.id}
                  value={newVehicle[field.id]}
                  onChange={handleInputChange}
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
            <h3 className={styles.subHeading}>Vehicle Details</h3>
            <div className={styles.detailsGrid}>
              <p><strong>Type:</strong> {viewDetailsVehicle.TypeOfVehicle}</p>
              <p><strong>Make:</strong> {viewDetailsVehicle.VehicleMake}</p>
              <p><strong>Model:</strong> {viewDetailsVehicle.VehicleModel}</p>
              <p><strong>Number:</strong> {viewDetailsVehicle.VehicleNumber}</p>
              <p><strong>Vendor ID:</strong> {viewDetailsVehicle.VendorID}</p>
              <p><strong>Fitness Expiry:</strong> {new Date(viewDetailsVehicle.FitnessCertificateExpiry).toLocaleDateString()}</p>
              <p><strong>RC Expiry:</strong> {new Date(viewDetailsVehicle.RCExpiryDate).toLocaleDateString()}</p>
              <p><strong>Tax Expiry:</strong> {new Date(viewDetailsVehicle.TaxExpiryDate).toLocaleDateString()}</p>
              <p><strong>Insurance Expiry:</strong> {new Date(viewDetailsVehicle.InsuranceExpiryDate).toLocaleDateString()}</p>
            </div>
            <br />
            <hr />
            <div className={styles.priceList}>
              <h3 className={styles.subHeading}>Associated Price List</h3>
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
              <th colSpan={3}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.VehicleID}>
                <td>{vehicle.VehicleID}</td>
                <td>{vehicle.TypeOfVehicle}</td>
                <td>{vehicle.VehicleNumber}</td>
                <td>
                  <button className={styles.viewButton} onClick={() => viewVehicleDetails(vehicle)}>View</button>
                  <button className={styles.editButton} onClick={() => editVehicle(vehicle)}>Edit</button>
                  <button className={styles.deleteButton} onClick={() => deleteVehicle(vehicle.VehicleID)}>Delete</button>
                  <button className={styles.viewButton} onClick={() => navigate('/price-list')}>View Price Lists</button>
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
