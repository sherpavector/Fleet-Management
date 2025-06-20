import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DriverProfile.css';

const DriverProfile = ({ driverData }) => {
  const driverId = driverData?.driverData?.driverID;

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    licenseNumber: '',
    contactNumber: '',
    ongoingTraining: false,
    driverStatus: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!driverId) {
      setError('Driver ID is missing');
      return;
    }

    axios
      .get(`http://localhost:5000/api/driver/${driverId}/view-profile`)
      .then((response) => {
        const data = response.data.profile;
        setProfile(data);
        setFormData({
          licenseNumber: data.LicenseNumber || '',
          contactNumber: data.ContactNumber || '',
          ongoingTraining: Boolean(data.OngoingTraining),
          driverStatus: data.DriverStatus || ''
        });
      })
      .catch((err) => {
        setError('Error fetching profile');
        console.error(err);
      });
  }, [driverId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    axios
      .put(`http://localhost:5000/api/driver/${driverId}/profile`, formData)
      .then(() => {
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        setProfile({
          ...profile,
          ...formData,
          UpdatedAt: new Date().toISOString()
        });
      })
      .catch((err) => {
        setError('Error updating profile');
        console.error(err);
      });
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="driver-profile">
      <h2>Driver Profile</h2>

      {error && <div className="error" style={{ color: 'red' }}>{error}</div>}
      {success && <div className="success" style={{ color: 'green' }}>{success}</div>}

      <div className="profile-info">
        <p><strong>Name:</strong> {profile.Name}</p>
        <p><strong>Employee ID:</strong> {profile.EmployeeID || 'N/A'}</p>
        <p><strong>License Number:</strong> {profile.LicenseNumber}</p>
        <p><strong>Contact Number:</strong> {profile.ContactNumber}</p>
        <p><strong>Ongoing Training:</strong> {profile.OngoingTraining ? 'Yes' : 'No'}</p>
        <p><strong>Driver Status:</strong> {profile.DriverStatus}</p>
        <p>
          <strong>Police Verification Date:</strong>{' '}
          {profile.PoliceVerificationDoneDate && !isNaN(new Date(profile.PoliceVerificationDoneDate).getTime())
            ? new Date(profile.PoliceVerificationDoneDate).toLocaleDateString()
            : 'Not Available'}
        </p>
        <p>
          <strong>Created At:</strong>{' '}
          {profile.CreatedAt && !isNaN(new Date(profile.CreatedAt).getTime())
            ? new Date(profile.CreatedAt).toLocaleString()
            : 'Not Available'}
        </p>
        <p>
          <strong>Updated At:</strong>{' '}
          {profile.UpdatedAt && !isNaN(new Date(profile.UpdatedAt).getTime())
            ? new Date(profile.UpdatedAt).toLocaleString()
            : 'Not Available'}
        </p>

      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div>
            <label>License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="ongoingTraining"
                checked={formData.ongoingTraining}
                onChange={handleInputChange}
              />
              Ongoing Training
            </label>
          </div>
          <div>
            <label>Driver Status</label>
            <input
              type="text"
              name="driverStatus"
              value={formData.driverStatus}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit">Update Profile</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => setIsEditing(true)}>Edit Profile</button>
      )}
    </div>
  );
};

export default DriverProfile;
