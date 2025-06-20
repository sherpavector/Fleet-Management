import React, { useState, useEffect } from 'react';
import styles from '../styles/AddDriver.module.css';
import { useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const AddDriver = () => {
  const [formData, setFormData] = useState({
    name: '',
    empid: '',
    email: '',
    password: '',
    licenseNumber: '',
    contactNumber: '',
    ongoingTraining: false,
    policeVerificationDoneDate: '',
    Status: 'Available',
    vendorID: ''
  });

  const [vendors, setVendors] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/managedriver/vendors')
      .then((response) => response.json())
      .then((data) => setVendors(data))
      .catch((error) => {
        console.error("Error fetching vendors:", error);
        alert("Error fetching vendor list. Please try again.");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'vendorID' ? parseInt(value) : (type === 'checkbox' ? checked : value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, empid, email, password, licenseNumber, contactNumber, vendorID } = formData;

    if (!name || !empid || !email || !password || !licenseNumber || !contactNumber || !vendorID) {
      alert("All fields are required");
      return;
    }

    fetch('http://localhost:5000/add-driver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        alert("Driver added successfully");
        setFormData({
          name: '',
          empid: '',
          email: '',
          password: '',
          licenseNumber: '',
          contactNumber: '',
          ongoingTraining: false,
          policeVerificationDoneDate: '',
          Status: 'Available',
          vendorID: ''
        });
        navigate('/manage-driver');
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error adding driver. Please try again.");
      });
  };

  return (
    <>
      <h2 className={styles.heading}>Add New Driver</h2>
      <div className={styles.backLink}
        style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px", marginBottom: "20px", justifyContent: "center" }}
      >
        <ArrowBackRoundedIcon />
        <a style={{ color: "black", fontSize: "20px" }} href='/manage-driver'>Go Back</a>
      </div>
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formgroup}>
            <label className={styles.formlabel}>Driver's Name: </label>
            <input className={styles.inputs} type="text" name="name" value={formData.name} onChange={handleChange} required />

            <label className={styles.formlabel}>Employee Id: </label>
            <input className={styles.inputs} type="text" name="empid" value={formData.empid} onChange={handleChange} required />
          </div>

          <div className={styles.formgroup}>
            <label className={styles.formlabel}>Email Id: </label>
            <input className={styles.inputs} type="email" name="email" value={formData.email} onChange={handleChange} required />

            <label className={styles.formlabel}>Create Password: </label>
            <input className={styles.inputs} type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className={styles.formgroup}>
            <label className={styles.formlabel}>License Number:</label>
            <input className={styles.inputs} type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required />

            <label className={styles.formlabel}>Contact Number:</label>
            <input className={styles.inputs} type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
          </div>

          <div className={styles.formgroup}>
            <label className={styles.formlabel}>Police Verification Done Date:</label>
            <input className={styles.dateinputs} type="date" name="policeVerificationDoneDate" value={formData.policeVerificationDoneDate} onChange={handleChange} />

            <label className={styles.checkboxLabel}>Ongoing Training:
              <input className={styles.checkBox} type="checkbox" name="ongoingTraining" checked={formData.ongoingTraining} onChange={handleChange} />
            </label>

            <label className={styles.formlabel}>Select Vendor:</label>
            <select className={styles.inputs} name="vendorID" value={formData.vendorID} onChange={handleChange} required>
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.vendorID} value={vendor.vendorID}>
                  {vendor.VendorName}
                </option>
              ))}
            </select>

            <button type="submit" className={styles.addButton}>Add Driver</button>
          </div>
        </form>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </>
  );
};

export default AddDriver;
 