import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './UserProfile.css';

const ClientProfile = () => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const clientId = localStorage.getItem('clientId');

  useEffect(() => {
    if (!clientId) {
      alert('Client not logged in');
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/client/profile/${clientId}`)
      .then((res) => {
        setClient(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching client profile:', err);
        setLoading(false);
      });
  }, [clientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    axios.put(`http://localhost:5000/api/client/profile/${clientId}`, client)
      .then(() => {
        alert('Profile updated successfully!');
        setSaving(false);
      })
      .catch(err => {
        console.error('Error updating profile:', err);
        alert('Failed to update profile.');
        setSaving(false);
      });
  };

  if (loading) return <p>Loading profile...</p>;
  if (!client) return <p>Client data not found.</p>;

  return (
    <>
      <Navbar />
      <div className="client-profile-container">
        <h2>My Profile</h2>
        <form onSubmit={handleSubmit} className="client-profile-form">
          <label>
            Name:
            <input
              type="text"
              name="ClientName"
              value={client.ClientName || ''}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Primary Contact Name:
            <input
              type="text"
              name="PrimaryContactName"
              value={client.PrimaryContactName || ''}
              onChange={handleChange}
            />
          </label>

          <label>
            Primary Contact Email:
            <input
              type="email"
              name="PrimaryContactEmail"
              value={client.PrimaryContactEmail || ''}
              onChange={handleChange}
            />
          </label>

          <label>
            Primary Contact Phone:
            <input
              type="tel"
              name="PrimaryContactPhone"
              value={client.PrimaryContactPhone || ''}
              onChange={handleChange}
            />
          </label>

          <label>
            Billing Address:
            <textarea
              name="BillingAddress"
              value={client.BillingAddress || ''}
              onChange={handleChange}
            />
          </label>

          <label>
            Government ID Number:
            <input
              type="text"
              name="GovernmentIDProof"
              placeholder='E.g. Aadhar Number'
              value={client.GovernmentIDProof || ''}
              onChange={handleChange}
            />
          </label>

          <label>
            PAN:
            <input
              type="text"
              name="PAN"
              value={client.PAN || ''}
              onChange={handleChange}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  );
};

export default ClientProfile;
