import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import styles from '../styles/ManageVendors.module.css';

const ManageVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [editingVendor, setEditingVendor] = useState(null);
    const [newVendor, setNewVendor] = useState({
        VendorName: '',
        VendorNumber: '',
        ContactPersonName: '',
        ContactPersonEmail: '',
        ContactPersonPhone: '',
        Name: '',
        Email: '',
        Password: ''
    });

    const fetchVendors = async () => {
        const res = await axios.get('http://localhost:5000/api/admin/managevendors');
        setVendors(res.data);
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (editingVendor) {
            setEditingVendor((prev) => ({ ...prev, [name]: value }));
        } else {
            setNewVendor((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleEdit = (vendor) => {
        setEditingVendor({ ...vendor });
    };

    const handleUpdate = async () => {
        await axios.put(`http://localhost:5000/api/admin/managevendors/${editingVendor.VendorID}`, editingVendor);
        setEditingVendor(null);
        fetchVendors();
    };

    const handleAdd = async () => {
        try {
            await axios.post('http://localhost:5000/api/admin/managevendors', newVendor);
            alert('Vendor added');
            setNewVendor({
                VendorName: '',
                VendorNumber: '',
                ContactPersonName: '',
                ContactPersonEmail: '',
                ContactPersonPhone: '',
                Name: '',
                Email: '',
                Password: ''
            });
            fetchVendors();
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert('Error adding vendor');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            await axios.delete(`http://localhost:5000/api/admin/managevendors/${id}`);
            fetchVendors();
        }
    };

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <h2 className={styles.heading}>Manage Vendors</h2>
                <h3 className={styles.subHeading}>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                <div className={styles.form}>
                    {(editingVendor ? editingVendor : newVendor) && (
                        <>
                            {!editingVendor && (
                                <>
                                    <input className={styles.input} name="Name" placeholder="User Name" value={newVendor.Name} onChange={handleChange} />
                                    <input className={styles.input} name="Email" placeholder="Create Email" value={newVendor.Email} onChange={handleChange} />
                                    <input className={styles.input} name="Password" type="password" placeholder="Create Password" value={newVendor.Password} onChange={handleChange} />
                                </>
                            )}
                            <input className={styles.input} name="VendorName" placeholder="Vendor Name" value={(editingVendor || newVendor).VendorName} onChange={handleChange} />
                            <input className={styles.input} name="VendorNumber" placeholder="Vendor Number" value={(editingVendor || newVendor).VendorNumber} onChange={handleChange} />
                            <input className={styles.input} name="ContactPersonName" placeholder="Contact Person" value={(editingVendor || newVendor).ContactPersonName} onChange={handleChange} />
                            <input className={styles.input} name="ContactPersonEmail" placeholder="Contact Email" value={(editingVendor || newVendor).ContactPersonEmail} onChange={handleChange} />
                            <input className={styles.input} name="ContactPersonPhone" placeholder="Contact Phone" value={(editingVendor || newVendor).ContactPersonPhone} onChange={handleChange} />
                            <button onClick={editingVendor ? handleUpdate : handleAdd}>
                                {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                            </button>
                            {editingVendor && <button onClick={() => setEditingVendor(null)}>Cancel</button>}
                        </>
                    )}
                </div>

                <h3 className={styles.subHeading}>All Vendors</h3>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Vendor Name</th>
                            <th>Contact Number</th>
                            <th>Vendor Number</th>
                            <th>Login Email</th>
                            <th>Password</th>
                            <th>Contact Person Name</th>
                            <th>Contact Email ID</th>
                            <th>User Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.map((vendor) => (
                            <tr key={vendor.VendorID}>
                                <td>{vendor.VendorName}</td>
                                <td>{vendor.ContactPersonPhone}</td>
                                <td>{vendor.VendorNumber}</td>
                                <td>{vendor.Email}</td>
                                <td>{vendor.Password}</td>
                                <td>{vendor.ContactPersonName}</td>
                                <td>{vendor.ContactPersonEmail}</td>
                                <td>{vendor.UserName}</td>
                                <td>
                                    <button onClick={() => handleEdit(vendor)}>Edit</button>
                                    <button onClick={() => handleDelete(vendor.VendorID)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ManageVendors;
