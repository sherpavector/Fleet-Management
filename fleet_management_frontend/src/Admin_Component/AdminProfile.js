import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from "../styles/AdminProfile.module.css"; // Import CSS module

const AdminProfile = () => {
    const [admin, setAdmin] = useState({
        Name: '',
        Email: '',
        Role: '',
    });

    const [editMode, setEditMode] = useState(false);
    const [newData, setNewData] = useState({
        Name: '',
        Email: '',
        Role: '',
    });

    // Fetch admin data on component mount
    useEffect(() => {
        axios.get('http://localhost:5000/admin/profile', { withCredentials: true })
            .then(response => {
                setAdmin(response.data);
                setNewData({
                    Name: response.data.Name,
                    Email: response.data.Email,
                    Role: response.data.Role,
                });
            })
            .catch(error => {
                console.error('There was an error fetching the admin profile!', error);
            });
    }, []);


    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Handle profile update
    const handleProfileUpdate = (e) => {
        e.preventDefault();

        axios.put('http://localhost:5000/admin/profile', newData, { withCredentials: true }) // Send cookies for session
            .then(response => {
                setAdmin(newData);  // Update the state with the new data
                setEditMode(false);  // Disable edit mode
                alert('Profile updated successfully');
            })
            .catch(error => {
                console.error('There was an error updating the profile!', error);
            });
    };

    return (
        <div className={styles.profileContainer}>
            <div className={styles.adminDetails}>
                <h2>Admin Profile</h2>
                <div className={styles.profileInfo}>
                    <p><strong>Name:</strong> {admin.Name}</p>
                    <p><strong>Email:</strong> {admin.Email}</p>
                    <p><strong>Role:</strong> {admin.Role}</p>

                    {editMode ? (
                        <form onSubmit={handleProfileUpdate} className={styles.profileForm}>
                            <label className={styles.label}>
                                Name:
                                <input
                                    type="text"
                                    name="Name"
                                    value={newData.Name}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                />
                            </label>
                            <br />
                            <label className={styles.label}>
                                Email:
                                <input
                                    type="email"
                                    name="Email"
                                    value={newData.Email}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                />
                            </label>
                            <br />
                            <label className={styles.label}>
                                Role:
                                <select
                                    name="Role"
                                    value={newData.Role}
                                    onChange={handleInputChange}
                                    className={styles.select}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Driver">Driver</option>
                                    <option value="Client">Client</option>
                                </select>
                            </label>
                            <br />
                            <button className={`${styles.saveButton}`} type="submit">Save Changes</button>
                            <button
                                className={`${styles.cancelButton}`}
                                type="button"
                                onClick={() => setEditMode(false)}
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <button className={styles.profileButton} onClick={() => setEditMode(true)}>Edit Profile</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
