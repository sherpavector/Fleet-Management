import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Use navigate to redirect after successful login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset any previous error

    try {
      // Make the login request to the backend
      const res = await axios.post('http://localhost:5000/api/driver/login', { email, password });

      if (res.data.success) {
        localStorage.setItem('driverData', JSON.stringify(res.data)); // ✅ Store driver data
        onLogin(res.data); // Pass to parent
        navigate('/driver-dashboard');      
      } else {
        setError('Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login error');
    }
  };

  return (
    <div className="login-container">
      <h2>Driver Login</h2>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>

      <div className="login-links">
        <p><Link to="/forgot-password">Forgot Password?</Link></p>
      </div>
    </div>
  );
};

export default Login;
