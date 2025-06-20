import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const ClientSignup = () => {
  const [formData, setFormData] = useState({
    ClientName: "",
    PrimaryContactName: "",
    PrimaryContactEmail: "",
    PrimaryContactPhone: "",
    BillingAddress: "",
    Password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/client/signup", formData);
      alert("Signup successful!");
      navigate("/client-login");
    } catch (err) {
      alert("Signup failed.");
      console.error(err);
    }
  };

  return (
    <div style={{marginTop:'50px'}}>
      <h2>Client Signup</h2>
      <form style={{marginLeft:'400px'}} onSubmit={handleSubmit}>
        <input name="ClientName" placeholder="Company Name" onChange={handleChange} required />
        <input name="PrimaryContactName" placeholder="Contact Person Name" onChange={handleChange} required />
        <input name="PrimaryContactEmail" placeholder="Email" onChange={handleChange} required />
        <input name="PrimaryContactPhone" placeholder="Phone" onChange={handleChange} required />
        <input name="BillingAddress" placeholder="Billing Address" onChange={handleChange} required />
        <input name="Password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Sign Up</button>
      </form>
       <div className="login-links">
        <p>Already have an account? <Link to="/client-login">Login</Link></p>
      </div>
    </div>
  );
};

export default ClientSignup;
