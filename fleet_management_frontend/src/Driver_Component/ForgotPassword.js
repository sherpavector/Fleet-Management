import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import navigate hook
import './ForgotPassword.css';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Initialize navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !newPassword) {
      setError('Email and new password are required');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/resetpassword', {
        email,
        newPassword,
      });

      if (res.data.success) {
        setSuccess('Password updated successfully. Redirecting to login...');
        navigate('/driver-login');
      } else {
        setError(res.data.message || 'Error updating password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <div
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px" }}
        >
          <ArrowBackRoundedIcon />
          <span>Back</span>
        </div>
      </form>

    </div>
  );
};

export default ForgotPassword;
