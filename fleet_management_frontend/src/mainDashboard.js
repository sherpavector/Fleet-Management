import React from "react";
import { Link } from "react-router-dom";
import "./MainDashboard.css";
import bg1 from './images/bg1.jpg';
import bg2 from './images/bg2.jpg';
import bg3 from './images/bg3.jpg';
import bg4 from './images/bg4.jpg';
import bg5 from './images/bg5.jpg';
import bg6 from './images/bg6.jpg';

const MainDashboard = () => {

  return (
    <div className="main-container">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">Prayaan Vihar - Fleet Management </h1>
        <div className="nav-links">
          <Link to="/client-login">Client login</Link>
          <Link to="/vendor-login">Vendor login</Link>
          <Link to="/driver-login">Driver login</Link>
          <Link to="/admin-login">Admin login</Link>
        </div>
      </nav>

      <h2 className="title">Prayaan Vihar - Fleet Management</h2>
      <p className="content"> Clients can easily book vehicles for their transportation needs with real-time availability and transparent pricing.
      <br/>They can also track trip progress.</p>
      {/* Image Gallery Section */}
      <section className="features-section">
        <div className="feature-grid">
          <div className="feature-card">
            <img src={bg6} alt="Fleet Booking" />
          </div>
          <div className="feature-card">
            <img src={bg4} alt="Driver Management" />
          </div>
          <div className="feature-card">
            <img src={bg5} alt="Live GPS Tracking" />
          </div>
        </div>
      </section>
      <section className="hero-section">
        <div className="hero-content">
          <h3>About Prayaan Vihar - Fleet Management</h3>
          <p>
            Our Fleet Management System is a comprehensive platform designed to streamline operations
            for transportation businesses. It enables clients to book vehicles, vendors to manage fleets and drivers,
            drivers to track and manage trips, and admins to oversee the entire system. The goal is to improve
            efficiency, reduce costs, and provide real-time visibility into all aspects of fleet operations.
          </p>
        </div>
      </section>
      <section className="features-section">
        <h3>Our Services</h3>
        <div className="feature-grid">
          <div className="feature-card">
            <img src={bg3} alt="Vendor Tools" />
            <h4>Client Booking</h4>
          </div>
          <div className="feature-card">
            <img src={bg2} alt="Vendor Tools" />
            <h4>Tracking Progress</h4>
          </div>
          <div className="feature-card">
            <img src={bg1} alt="Admin Oversight" />
            <h4>View Past Completed Trips</h4>
          </div>
        </div>
      </section >

    </div >
  );
};

export default MainDashboard;
