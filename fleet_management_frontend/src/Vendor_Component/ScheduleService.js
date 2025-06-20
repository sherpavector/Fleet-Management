import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/ScheduleService.module.css';
import VendorNavbar from '../Vendor_Component/vendor_navbar';

function ServiceScheduleForm() {
  const [vehicleId, setVehicleId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState(null); // Track editing

  const fetchSchedules = () => {
    axios.get('http://localhost:5000/api/service-schedule')
      .then(res => setSchedules(res.data))
      .catch(err => console.error(err));
  };

useEffect(() => {
 const vendorid = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID; // ✅ use localStorage

  axios.get(`http://localhost:5000/api/vehicles?vendorid=${vendorid}`)
    .then(res => setVehicles(res.data))
    .catch(err => console.error(err));

  fetchSchedules();
}, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/vehicle-service/schedule/${editId}`, {
          VehicleID: vehicleId,
          ServiceDate: date,
          Description: description
        });
        alert('Service updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/vehicle-service/schedule', {
          VehicleID: vehicleId,
          ServiceDate: date,
          Description: description
        });
        alert('Service scheduled successfully!');
      }
      setVehicleId('');
      setDate('');
      setDescription('');
      setEditId(null);
      fetchSchedules();
    } catch (error) {
      console.error(error);
      alert('Failed to save service schedule.');
    }
  };

  const handleEdit = (Service) => {
    setEditId(Service.ServiceID);
    setVehicleId(Service.VehicleID);
    setDate(Service.ServiceDate.split('T')[0]); // Format to yyyy-mm-dd
    setDescription(Service.Description);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicle-service/schedule/${id}`);
        alert('Schedule deleted successfully!');
        fetchSchedules();
      } catch (error) {
        console.error(error);
        alert('Failed to delete schedule.');
      }
    }
  };

  return (
    <>
      <VendorNavbar />
      <div className={styles.container}>
        <h2 className={styles.heading}>{editId ? 'Edit Service Schedule' : 'Schedule Vehicle Service'}</h2>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <label className={styles.label}>Vehicle:</label>
          <select className={styles.selectInput} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
            <option value="">Select Vehicle</option>
            {vehicles.map(v => (
              <option key={v.VehicleID} value={v.VehicleID}>
                {v.VehicleID} - {v.VehicleNumber}
              </option>
            ))}
          </select>
          <br />
          <label className={styles.label}>Service Date:</label>
          <input className={styles.dateInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <br />
          <label className={styles.label}>Description:</label>
          <textarea className={styles.textInput} value={description} onChange={(e) => setDescription(e.target.value)} required />
          <br />
          <button className={styles.submitButton} type="submit">{editId ? 'Update' : 'Schedule'}</button>
        </form>
        {message && <p>{message}</p>}
      </div>

      <div className={styles.container}>
        <h2 className="text-xl font-semibold mb-4">Scheduled Vehicle Services</h2>
        <table className={styles.serviceTable}>
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Vehicle</th>
              <th className="p-2 border">Service Date</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s, i) => (
              <tr key={s.ServiceID || i}>
                <td className="p-2 border">{s.VehicleID} - {s.VehicleNumber}</td>
                <td className="p-2 border">{new Date(s.ServiceDate).toLocaleDateString()}</td>
                <td className="p-2 border">{s.Description}</td>
                <td className="p-2 border">{s.Status}</td>
                <td className="p-2 border space-x-2">
                  <button onClick={() => handleEdit(s)} className={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(s.ServiceID)} className={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ServiceScheduleForm;
