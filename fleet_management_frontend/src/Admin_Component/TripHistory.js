import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from '../styles/TripHistory.module.css';
import Navbar from './Navbar';

const TripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [ratingData, setRatingData] = useState({ rating: null, feedback: null, loading: false, error: null });

  const [paidPage, setPaidPage] = useState(1);
  const [notPaidPage, setNotPaidPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/vendors")
      .then(res => res.json())
      .then(data => setVendors(data))
      .catch(err => console.error("Error fetching vendors:", err));
  }, []);

  useEffect(() => {
    let url = "http://localhost:5000/api/admin/trip-history";
    if (selectedVendor) url += `?vendorId=${selectedVendor}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error("Error fetching trips:", err));
  }, [selectedVendor]);

  useEffect(() => {
    if (!selectedTrip) return;
    setRatingData({ rating: null, feedback: null, loading: true, error: null });
    axios.get(`http://localhost:5000/api/trip/${selectedTrip.TripID}/driver/${selectedTrip.DriverID}/rating`)
      .then(res => {
        if (res.data.success) {
          setRatingData({ rating: res.data.rating, feedback: res.data.feedback, loading: false, error: null });
        } else {
          setRatingData({ rating: null, feedback: null, loading: false, error: 'No rating found' });
        }
      })
      .catch(() => {
        setRatingData({ rating: null, feedback: null, loading: false, error: 'Failed to fetch rating' });
      });
  }, [selectedTrip]);

  const downloadCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(trips);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TripHistory");
    XLSX.writeFile(workbook, "TripHistory.xlsx");
  };

  const handleVendorChange = (e) => {
    setSelectedVendor(e.target.value);
  };

  const renderStars = (rating) => {
    if (rating == null) return 'No rating';
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const stars = [];

    for (let i = 0; i < full; i++) stars.push(<span key={'full' + i} style={{ color: '#f5c518', fontSize: '25px' }}>★</span>);
    if (half) stars.push(<span key='half' style={{ color: '#f5c518', fontSize: '25px' }}>☆</span>);
    while (stars.length < 5) stars.push(<span key={'empty' + stars.length} style={{ color: '#ccc', fontSize: '25px' }}>☆</span>);

    return stars;
  };

  const paidTrips = trips.filter(t => t.PaymentStatus?.toLowerCase() === 'paid');
  const notPaidTrips = trips.filter(t => t.PaymentStatus?.toLowerCase() !== 'paid');

  const paginate = (arr, page) => arr.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const closeModal = () => setSelectedTrip(null);

  const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px' }}>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
      </div>
    );
  };

  const generateBillPDF = () => {
    if (!selectedTrip) return;

    const element = document.getElementById('trip-invoice');
    if (!element) return;

    element.style.display = 'block';
    setTimeout(() => {
      html2canvas(element, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Trip_${selectedTrip.TripID}_Invoice.pdf`);
      }).finally(() => {
        element.style.display = 'none';
      });
    }, 300);
  };

  const formatDate = (str) => new Date(str).toLocaleDateString();
  const formatTime = (str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h2 className={styles.header}>Trip History</h2>

        <button onClick={downloadCSV} className={styles.downloadButton}>
          Download Excel
        </button>

        <div className={styles.filterContainer}>
          <label htmlFor="vendorFilter">Filter by Vendor: </label>
          <select id="vendorFilter" value={selectedVendor} onChange={handleVendorChange}>
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor.VendorID} value={vendor.VendorID}>
                {vendor.VendorName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.container}>
          <h2 style={{ color: 'green' }}>Paid Trips</h2>
          {paidTrips.length === 0 ? <p>No paid trips found.</p> : (
            <>
              <table className={styles.tripTable}>
                <thead>
                  <tr><th>Trip ID</th><th>Client</th><th>Pickup</th><th>Drop</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {paginate(paidTrips, paidPage).map(trip => (
                    <tr key={trip.TripID}>
                      <td>{trip.TripID}</td><td>{trip.ClientName}</td><td>{trip.PickupLocation}</td><td>{trip.DropLocation}</td>
                      <td><button className={styles.viewButton} onClick={() => setSelectedTrip(trip)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={paidPage} totalItems={paidTrips.length} onPageChange={setPaidPage} />
            </>
          )}

          <h2 style={{ color: 'red', marginTop: '50px' }}>Not Paid Trips</h2>
          {notPaidTrips.length === 0 ? <p>No unpaid trips found.</p> : (
            <>
              <table className={styles.tripTable}>
                <thead>
                  <tr><th>Trip ID</th><th>Client</th><th>Pickup</th><th>Drop</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {paginate(notPaidTrips, notPaidPage).map(trip => (
                    <tr key={trip.TripID}>
                      <td>{trip.TripID}</td><td>{trip.ClientName}</td><td>{trip.PickupLocation}</td><td>{trip.DropLocation}</td>
                      <td><button className={styles.viewButton} onClick={() => setSelectedTrip(trip)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={notPaidPage} totalItems={notPaidTrips.length} onPageChange={setNotPaidPage} />
            </>
          )}

          {/* Modal Popup */}
          {selectedTrip && (
            <div className={styles.modalOverlay} onClick={closeModal}>
              <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={closeModal}>X</button>
                <h3>Trip Details - ID {selectedTrip.TripID}</h3>
                <button className={styles.downloadBtn} onClick={generateBillPDF}>Download Bill</button>
                <p><strong>Status:</strong> {selectedTrip.TripStatus}</p>
                <p><strong>Client:</strong> {selectedTrip.ClientName}</p>
                <p><strong>Driver:</strong> {selectedTrip.DriverName}</p>
                <p><strong>Vehicle:</strong> {selectedTrip.VehicleNumber} - {selectedTrip.VehicleType}</p>
                <p><strong>Pickup Location:</strong> {selectedTrip.PickupLocation}</p>
                <p><strong>Drop Location:</strong> {selectedTrip.DropLocation}</p>
                <p><strong>Trip Type:</strong> {selectedTrip.TripType}</p>
                <p><strong>Start Time:</strong> {formatDate(selectedTrip.StartTime)} {formatTime(selectedTrip.StartTime)}</p>
                <p><strong>End Time:</strong> {formatDate(selectedTrip.EndTime)} {formatTime(selectedTrip.EndTime)}</p>
                <p><strong>Total Distance:</strong> {selectedTrip.TotalDistance} km</p>
                <p><strong>Total Cost:</strong> ₹{selectedTrip.TotalCost}</p>
                <p><strong>Payment Status:</strong> {selectedTrip.PaymentStatus}</p>
                <hr />
                <h4>Driver Rating & Feedback</h4>
                {ratingData.loading ? <p>Loading rating...</p> :
                  ratingData.error ? <p style={{ color: 'red' }}>{ratingData.error}</p> : (
                    <>
                      <p><strong>Rating:</strong> {renderStars(ratingData.rating)}</p>
                      <p><strong>Feedback:</strong> {ratingData.feedback || 'No feedback provided'}</p>
                    </>
                  )}
              </div>

              {/* Hidden invoice for PDF */}
              <div id="trip-invoice" style={{ display: 'none', padding: '20px', background: '#fff', width: '600px' }}>
                <h2 style={{ textAlign: 'center' }}>Trip Payment Invoice</h2>
                <p><strong>Trip ID:</strong> {selectedTrip.TripID}</p>
                <p><strong>Client:</strong> {selectedTrip.ClientName}</p>
                <p><strong>Driver:</strong> {selectedTrip.DriverName}</p>
                <p><strong>Vehicle:</strong> {selectedTrip.VehicleNumber} ({selectedTrip.VehicleType})</p>
                <p><strong>Pickup:</strong> {selectedTrip.PickupLocation}</p>
                <p><strong>Drop:</strong> {selectedTrip.DropLocation}</p>
                <p><strong>Start:</strong> {formatDate(selectedTrip.StartTime)} {formatTime(selectedTrip.StartTime)}</p>
                <p><strong>End:</strong> {formatDate(selectedTrip.EndTime)} {formatTime(selectedTrip.EndTime)}</p>
                <p><strong>Distance:</strong> {selectedTrip.TotalDistance} km</p>
                <p><strong>Cost:</strong> ₹{selectedTrip.TotalCost}</p>
                <p><strong>Status:</strong> {selectedTrip.PaymentStatus}</p>
                <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                <hr />
                <h4>Driver Rating & Feedback</h4>
                {ratingData.loading ? <p>Loading rating...</p> :
                  ratingData.error ? <p style={{ color: 'red' }}>{ratingData.error}</p> : (
                    <>
                      <p><strong>Rating:</strong> {renderStars(ratingData.rating)}</p>
                      <p><strong>Feedback:</strong> {ratingData.feedback || 'No feedback provided'}</p>
                    </>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TripHistory;
