import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/client/login", {
        email,
        password,
      });

      const clientId = res.data.user.ClientID || res.data.user.clientid;
      localStorage.setItem("clientId", clientId); // Store client ID in localStorage

      alert("Login successful!");
      navigate("/client-dashboard");
    } catch (err) {
      alert("Login failed.");
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: '100px' }} >
      <h2>Client Login</h2>
      <form style={{ marginLeft: '400px' }} onSubmit={handleLogin}>
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
        <p><Link to="/client-forgotpassword">Forgot Password?</Link></p>
      </form>

      <div className="login-links">
        
        <p>Don't have an account? <Link to="/client-signup">Register here</Link></p>
      </div>
    </div>
  );
};

export default ClientLogin;
