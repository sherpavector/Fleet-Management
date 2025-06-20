import React, { useState } from 'react';
import axios from 'axios';
import styles from '../styles/Login.module.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Send login request to the server
      const response = await axios.post('http://localhost:5000/login', {
        email,
        password,
      }, { withCredentials: true }); // Include credentials for session handling

      // If login is successful, redirect to the dashboard
      window.location.href = '/admin-dashboard';
    } catch (err) {
      // Handle login failure
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
      <h2 className={styles.heading}>Admin Login</h2>
        <div>
          <label>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className={styles.button} type="submit">Login</button>
        <a className={styles.text} href="/forgotpassword?role=admin">Forgot Password ?</a>
        {error && <p className={styles.error}>{error}</p>} {/* Error message styling */}
      </form>
    </div>
  );
};

export default AdminLogin;
