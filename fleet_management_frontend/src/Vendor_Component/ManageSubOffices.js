import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/ManageSubOffices.module.css';
import VendorNavbar from '../Vendor_Component/vendor_navbar';

export default function ManageSubOffices() {
    const [subOffices, setSubOffices] = useState([]);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({
        SubOfficeID: 0,
        ClientID: '',
        SubOfficeName: '',
        Address: '',
        ContactPersonName: '',
        ContactPersonEmail: '',
        ContactPersonPhone: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    function fetchData() {
        const vendorID = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;
        console.log("Sending VendorID:", vendorID);
        axios.get(`http://localhost:5000/api/vendor/clients?vendorid=${vendorID}`)
            .then(res => setClients(res.data));

        axios.get(`http://localhost:5000/api/vendor/suboffices?vendorid=${vendorID}`)
            .then(res => setSubOffices(res.data));
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function startEdit(so) {
        setForm({ ...so });
    }

    function handleSubmit(e) {
        e.preventDefault();
        const apiUrl = form.SubOfficeID
            ? `http://localhost:5000/api/vendor/suboffices/${form.SubOfficeID}`
            : 'http://localhost:5000/api/vendor/suboffices';
        const method = form.SubOfficeID ? 'put' : 'post';
        axios[method](apiUrl, form).then(() => {
            setForm({
                SubOfficeID: 0,
                ClientID: '',
                SubOfficeName: '',
                Address: '',
                ContactPersonName: '',
                ContactPersonEmail: '',
                ContactPersonPhone: ''
            });
            fetchData();
        });
    }

    function handleDelete(id) {
        if (!window.confirm('Delete this sub-office?')) return;
        axios.delete(`http://localhost:5000/api/vendor/suboffices/${id}`).then(fetchData);
    }

    return (
        <>
            <VendorNavbar />
            <div className={styles.container}>
                <h1 className={styles.heading}>Manage Sub‑Offices</h1>

                <div className={styles.formContainer}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Client</label>
                            <select name="ClientID" value={form.ClientID} onChange={handleChange} required>
                                <option value="">— select client —</option>
                                {clients.map(c => (
                                    <option key={c.ClientID} value={c.ClientID}>
                                        {c.ClientName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Sub‑Office Name</label>
                            <input name="SubOfficeName" value={form.SubOfficeName} onChange={handleChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Address</label>
                            <input name="Address" value={form.Address} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contact Person</label>
                            <input name="ContactPersonName" value={form.ContactPersonName} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contact Email</label>
                            <input name="ContactPersonEmail" value={form.ContactPersonEmail} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contact Phone</label>
                            <input name="ContactPersonPhone" value={form.ContactPersonPhone} onChange={handleChange} />
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            {form.SubOfficeID ? 'Update' : 'Create'}
                        </button>
                    </form>
                </div>

                <h2 className={styles.heading}>Existing Sub‑Offices</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.subofficetable}>
                        <thead>
                            <tr>
                                <th>Sub‑Office Name</th>
                                <th>Client</th>
                                <th colSpan={2}>Address</th>
                                <th>Contact Person</th>
                                <th colSpan={2}>Contact Email</th>
                                <th>Contact Phone</th>
                                <th colSpan={2}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subOffices.map(so => (
                                <tr key={so.SubOfficeID}>
                                    <td>{so.SubOfficeName}</td>
                                    <td>{so.ClientName}</td>
                                    <td colSpan={2}>{so.Address}</td>
                                    <td>{so.ContactPersonName}</td>
                                    <td colSpan={2}>{so.ContactPersonEmail}</td>
                                    <td>{so.ContactPersonPhone}</td>
                                    <td colSpan={2}>
                                        <button onClick={() => startEdit(so)} className={styles.editBtn}>Edit</button>
                                        <button onClick={() => handleDelete(so.SubOfficeID)} className={styles.deleteBtn}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </>
    );
}
