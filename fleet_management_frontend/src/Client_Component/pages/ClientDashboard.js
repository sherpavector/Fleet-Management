import React, { useState, useEffect } from 'react';
import './Bookings.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ClientNavbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Reverse geocoding + marker component
const LocationPicker = ({ position, setPosition, setAddress, label }) => {
  const [markerText, setMarkerText] = useState('');

  useMapEvents({
  click: async (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    setPosition([lat, lng]);

    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json',
        },
        headers: {
          'Accept-Language': 'en', // Force English
        },
      });

      const displayName = res.data.display_name;
      setAddress(displayName);
      setMarkerText(displayName);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setMarkerText('Address not found');
    }
  },
});


  return position ? (
    <Marker position={position}>
      <Popup>{markerText || label}</Popup>
    </Marker>
  ) : null;
};

const Bookings = () => {
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [vehicle, setVehicle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [travelOptions, setTravelOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTravelOptions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/bookings/available-vehicles');
        setTravelOptions(response.data);
      } catch (error) {
        console.error('Error fetching travel options:', error);
      }
    };

    fetchTravelOptions();
  }, []);

  const handleCheck = async () => {
    if (!pickupText || !dropText || !vehicle || !startDate) {
      alert('Please fill all fields before checking.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/bookings/calculate', {
        pickup: pickupText,
        drop: dropText,
        vehicleType: vehicle,
      });

      if (response.data && response.data.vendorOptions) {
        setVendorOptions(response.data.vendorOptions);
        setShowResults(true);
      } else {
        alert('No vendor options available');
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
      alert('An error occurred while calculating the cost');
    }
  };

  const handleBooking = (selectedOption) => {
    navigate('/confirm-booking', {
      state: {
        pickup: pickupText,
        drop: dropText,
        vehicle: selectedOption.vehicleType,
        startDate,
        vendorId: selectedOption.vendorID,
        vendorName: selectedOption.vendorName,
        totalCost: selectedOption.totalCost,
        distance: selectedOption.distance,
      },
    });
  };

  return (
    <>
      <ClientNavbar />
      <div className="booking-container" style={{ marginTop: '30px' }}>
        <h2 className="title">Book Your Travel</h2>

        <div className="form-group">
          <label>Pickup Location</label>
          <input
            type="text"
            value={pickupText}
            onChange={(e) => setPickupText(e.target.value)}
            placeholder="Enter pickup point or click map"
          />
          <div className="map-wrapper">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '250px', marginTop: '10px' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LocationPicker
                position={pickupCoords}
                setPosition={setPickupCoords}
                setAddress={setPickupText}
                label="Pickup"
              />
            </MapContainer>
          </div>
        </div>

        <div className="form-group">
          <label>Drop Location</label>
          <input
            type="text"
            value={dropText}
            onChange={(e) => setDropText(e.target.value)}
            placeholder="Enter drop point or click map"
          />
          <div className="map-wrapper">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '250px', marginTop: '10px' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LocationPicker
                position={dropCoords}
                setPosition={setDropCoords}
                setAddress={setDropText}
                label="Drop"
              />
            </MapContainer>
          </div>
        </div>

        <div className="form-group">
          <label>Vehicle Type</label>
          {travelOptions.length > 0 ? (
            <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">Select Vehicle</option>
              {[...new Set(travelOptions.map((opt) => opt.VehicleType))].map(
                (type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                )
              )}
            </select>
          ) : (
            <p>Loading vehicles...</p>
          )}
        </div>

        <div className="form-group">
          <label>Travel Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <button className="check-button" onClick={handleCheck}>
          Check
        </button>

        {showResults && (
          <div className="results">
            <h3>Available Travels:</h3>
            {vendorOptions.length > 0 ? (
              vendorOptions.map((option, index) => (
                <div key={index} className="travel-card">
                  <p><strong>Vendor:</strong> {option.vendorName}</p>
                  <p><strong>Vehicle:</strong> {option.vehicleType}</p>
                  <p><strong>Distance:</strong> {option.distance} km</p>
                  <p><strong>Total Cost:</strong> ₹{option.totalCost}</p>
                  <button className="book-button" onClick={() => handleBooking(option)}>
                    Book Now
                  </button>
                </div>
              ))
            ) : (
              <p>No results found</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Bookings;
