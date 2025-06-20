import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from "../styles/ManageClients.module.css";
import Navbar from './Navbar';

const ManageClients = () => {
    const [clients, setClients] = useState([]);
    const [clientForm, setClientForm] = useState({
        ClientName: '',
        PrimaryContactName: '',
        PrimaryContactEmail: '',
        PrimaryContactPhone: '',
        BillingAddress: ''
    });

    const [errors, setErrors] = useState({});
    const [editingClient, setEditingClient] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/manage-clients')
            .then((response) => setClients(response.data))
            .catch((error) => console.error("There was an error fetching the clients:", error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClientForm({ ...clientForm, [name]: value });

        // Clear error as user types
        setErrors(prev => ({ ...prev, [name]: "" }));
    };



    const handleSubmit = (e) => {
        e.preventDefault(); // ✅ correct typo here

        const {
            ClientName,
            PrimaryContactName,
            PrimaryContactEmail,
            PrimaryContactPhone,
            BillingAddress
        } = clientForm;

        // ✅ Validation
        if (!ClientName.trim()) {
            window.alert("Please enter the client name.");
            return;
        }
        if (!PrimaryContactName.trim()) {
            window.alert("Please enter the primary contact name.");
            return;
        }
        if (!PrimaryContactEmail.trim()) {
            window.alert("Please enter the primary contact email.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(PrimaryContactEmail)) {
            window.alert("Please enter a valid email address.");
            return;
        }
        if (!PrimaryContactPhone.trim()) {
            window.alert("Please enter the primary contact phone.");
            return;
        }
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(PrimaryContactPhone)) {
            window.alert("Please enter a valid 10-digit phone number.");
            return;
        }
        if (!BillingAddress.trim()) {
            window.alert("Please enter the billing address.");
            return;
        }

        // ✅ Proceed to Add or Edit
        if (editingClient) {
            axios.put(`http://localhost:5000/manage-clients/${editingClient.ClientID}`, clientForm)
                .then((response) => {
                    setClients(clients.map(client =>
                        client.ClientID === editingClient.ClientID ? response.data : client
                    ));
                    window.alert("Client updated successfully!");
                    resetForm();
                })
                .catch((error) => {
                    console.error("Error updating client:", error);
                    window.alert("Failed to update client.");
                });
        } else {
            axios.post('http://localhost:5000/manage-clients', clientForm)
                .then((response) => {
                    setClients([...clients, response.data]);
                    window.alert("Client added successfully!");
                    resetForm();
                })
                .catch((error) => {
                    console.error("Error adding client:", error);
                    window.alert("Failed to add client.");
                });
        }
    };


    const handleEdit = (client) => {
        setClientForm(client);
        setEditingClient(client);
    };


    const resetForm = () => {
        setClientForm({
            ClientName: '',
            PrimaryContactName: '',
            PrimaryContactEmail: '',
            PrimaryContactPhone: '',
            BillingAddress: ''
        });
        setEditingClient(null);
        setErrors({});
    };

    return (
        <>
            <Navbar />
            <div className={styles.mangecontainer}>
                <h2 className={styles.heading}>Manage Clients</h2>
                <div className={styles.container}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.row}>
                            <input
                                className={styles.inputbox}
                                type="text"
                                name="ClientName"
                                value={clientForm.ClientName}
                                onChange={handleChange}
                                placeholder="Client Name"
                            />
                            {errors.ClientName && <p className={styles.error}>{errors.ClientName}</p>}

                            <input
                                className={styles.inputbox}
                                type="text"
                                name="PrimaryContactName"
                                value={clientForm.PrimaryContactName}
                                onChange={handleChange}
                                placeholder="Primary Contact Name"
                            />
                        </div>
                        <div className={styles.row}>
                            <input
                                className={styles.inputbox}
                                type="email"
                                name="PrimaryContactEmail"
                                value={clientForm.PrimaryContactEmail}
                                onChange={handleChange}
                                placeholder="Primary Contact Email"
                            />
                            {errors.PrimaryContactEmail && <p className={styles.error}>{errors.PrimaryContactEmail}</p>}

                            <input
                                className={styles.inputbox}
                                type="tel"
                                name="PrimaryContactPhone"
                                value={clientForm.PrimaryContactPhone}
                                onChange={handleChange}
                                placeholder="Primary Contact Phone"
                            />
                            {errors.PrimaryContactPhone && <p className={styles.error}>{errors.PrimaryContactPhone}</p>}

                        </div>
                        <div className={styles.row}>
                            <textarea
                                className={styles.textbox}
                                name="BillingAddress"
                                value={clientForm.BillingAddress}
                                onChange={handleChange}
                                placeholder="Billing Address"
                            />
                            {errors.BillingAddress && <p className={styles.error}>{errors.BillingAddress}</p>}

                        </div>

                        <button className={styles.btnn} type="submit">
                            {editingClient ? 'Update Client' : 'Add Client'}
                        </button>
                    </form>
                </div>

                <div>
                    <h3 className={styles.subHeading}>Client List</h3>
                    <div className={styles.clientContainer}>
                        {clients.map(client => (
                            <div key={client.ClientID} className={styles.card}>
                                <p data-fulltext={client.ClientName}><strong>Client Name: </strong>{client.ClientName}</p>
                                <p data-fulltext={client.PrimaryContactName}><strong>Primary Contact Name: </strong>{client.PrimaryContactName}</p>
                                <p data-fulltext={client.PrimaryContactEmail}><strong>Primary Contact Email: </strong>{client.PrimaryContactEmail}</p>
                                <p data-fulltext={client.PrimaryContactPhone}><strong>Primary Contact Phone </strong>{client.PrimaryContactPhone}</p>
                                <p data-fulltext={client.BillingAddress}><strong>Billing Address: </strong>{client.BillingAddress}</p>
                                <p>
                                    <button className={styles.editButton} onClick={() => handleEdit(client)}>Edit</button>
                                </p>
                            </div>
                        ))}
                    </div>
                </div >
            </div >
        </>
    );
};

export default ManageClients;
