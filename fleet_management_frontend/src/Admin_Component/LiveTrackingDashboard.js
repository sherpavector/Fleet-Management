// ClientTrackDriver.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import '../Client_Component/pages/ClientTrackDriver.css';
import Navbar from './Navbar';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const AdminTrackingPage = () => {
  const { tripId } = useParams(); // ⬅️ This gets tripId from the URL
  const [trackData, setTrackData] = useState(null);
  const [error, setError] = useState('');

  const fetchTracking = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/client/track-driver-by-trip/${tripId}`);
      setTrackData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setTrackData(null);
      setError('Unable to fetch tracking info.');
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [tripId]);

  return (
    <>
    <Navbar/>
    <div  className="client-track-driver-container" style={{ padding: 20 }}>
      <h2>Track Your Driver</h2>
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
      {trackData ? (
        <div>
          <p><strong>Driver:</strong> {trackData.DriverName}</p>
          <p><strong>Contact:</strong> {trackData.ContactNumber}</p>
          <p><strong>Vehicle:</strong> {trackData.VehicleNumber} ({trackData.TypeOfVehicle})</p>
          <p><strong>Pickup:</strong> {trackData.PickupLocation}</p>
          <p><strong>Drop:</strong> {trackData.DropLocation}</p>

          {trackData.Latitude && trackData.Longitude ? (
            <MapContainer
              center={[trackData.Latitude, trackData.Longitude]}
              zoom={15}
              style={{ height: '400px', width: '100%', marginTop: '20px' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[trackData.Latitude, trackData.Longitude]}>
                <Popup>{trackData.DriverName} - {trackData.VehicleNumber}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <p>Live location not available yet.</p>
          )}
        </div>
      ) : (
        <p>Loading tracking data...</p>
      )}
    </div>
    </>
  );
};

export default AdminTrackingPage;
