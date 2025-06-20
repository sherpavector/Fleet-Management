import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import styles from '../styles/VehicleManagement.module.css';

const PriceListManagement = () => {
  const [priceLists, setPriceLists] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [formData, setFormData] = useState({
    vehicleType: '',
    ratePerKm: '',
    ratePerHour: '',
    minimumKm: '',
    baseRate: '',
    waitingChargePerHour: '',
    nightCharge: '',
    vendorId: '' // Added here
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/pricelist/vendors') // You should have this endpoint
      .then((res) => setVendors(res.data))
      .catch((err) => console.error('Failed to fetch vendors', err));
  }, []);


  useEffect(() => {
    fetchPriceLists();
    fetchVehicleTypes();
  }, []);

  const fetchPriceLists = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/manage-pricelists');
      setPriceLists(res.data);
    } catch (err) {
      alert('Error fetching price lists');
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
    setFormData((prev) => ({ ...prev, [id]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/manage-pricelists/${editId}`, formData);
        alert('Price list updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/manage-pricelists', formData);
        alert('Price list added successfully');
      }
      fetchPriceLists();
      resetForm();
    } catch (err) {
      alert('Error saving price list');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleType: '',
      ratePerKm: '',
      ratePerHour: '',
      minimumKm: '',
      baseRate: '',
      waitingChargePerHour: '',
      nightCharge: ''
    });
    setEditId(null);
  };

  const handleEdit = (pl) => {
    setEditId(pl.PriceListID);
    setFormData({
      vehicleType: pl.VehicleType,
      ratePerKm: pl.RatePerKm,
      ratePerHour: pl.RatePerHour,
      minimumKm: pl.MinimumKm,
      baseRate: pl.BaseRate,
      waitingChargePerHour: pl.WaitingChargePerHour,
      nightCharge: pl.NightCharge,
      vendorId: pl.VendorID // Set this on edit
    });
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this price list?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/manage-pricelists/${id}`);
      alert('Price list deleted successfully');
      fetchPriceLists();
    } catch (err) {
      alert('Error deleting price list');
    }
  };

  return (
    <div className={styles.priceContainer}>
      <h2 >Price List Management</h2>
      <div className={styles.backLink}
        style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", marginBottom: "20px", justifyContent: "center" }}
      >
        <ArrowBackRoundedIcon />
        <a style={{ color: "black", fontSize: "20px" }} href='/manage-vehicle'>Go Back</a>
      </div>
      <form onSubmit={handleSubmit} className={styles.priceForm}>
        <select id="vehicleType" value={formData.vehicleType} onChange={handleInputChange} required>
          <option value="">Select Vehicle Type</option>
          {vehicleTypes.map((type, idx) => (
            <option key={idx} value={type}>{type}</option>
          ))}
        </select>
        <label>
          <select
            id="vendorId"
            value={formData.vendorId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.VendorID} value={vendor.VendorID}>
                {vendor.VendorName}
              </option>
            ))}
          </select>
        </label>
        <input type="number" id="ratePerKm" placeholder="Rate Per Km" value={formData.ratePerKm} onChange={handleInputChange} />
        <input type="number" id="ratePerHour" placeholder="Rate Per Hour" value={formData.ratePerHour} onChange={handleInputChange} />
        <input type="number" id="minimumKm" placeholder="Minimum Km" value={formData.minimumKm} onChange={handleInputChange} />
        <input type="number" id="baseRate" placeholder="Base Rate" value={formData.baseRate} onChange={handleInputChange} />
        <input type="number" id="waitingChargePerHour" placeholder="Waiting Charge Per Hour" value={formData.waitingChargePerHour} onChange={handleInputChange} />
        <input type="number" id="nightCharge" placeholder="Night Charge" value={formData.nightCharge} onChange={handleInputChange} />
        <button className={styles.priceAddButton} type="submit">{editId ? 'Update' : 'Add'} Price</button>
      </form>

      <table className={styles.priceTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle Type</th>
            <th>Vendor Name</th>
            <th>Rate/Km</th>
            <th>Rate/Hour</th>
            <th>Minimum Km</th>
            <th>Base Rate</th>
            <th>Waiting Charge</th>
            <th>Night Charge</th>
            <th colSpan={2}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {priceLists.map((pl) => (
            <tr key={pl.PriceListID}>
              <td>{pl.PriceListID}</td>
              <td>{pl.VehicleType}</td>
              <td>{pl.VendorName}</td>
              <td>{pl.RatePerKm}</td>
              <td>{pl.RatePerHour}</td>
              <td>{pl.MinimumKm}</td>
              <td>{pl.BaseRate}</td>
              <td>{pl.WaitingChargePerHour}</td>
              <td>{pl.NightCharge}</td>
              <td colSpan={2}>
                <button className={styles.priceEditButton} onClick={() => handleEdit(pl)}>Edit</button>
                <button className={styles.priceDeleteButton} onClick={() => handleDelete(pl.PriceListID)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PriceListManagement;
