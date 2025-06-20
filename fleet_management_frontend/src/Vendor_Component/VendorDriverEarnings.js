import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './VendorDriverEarnings.module.css';
import VendorNavbar from './vendor_navbar';

const VendorDriverEarnings = () => {
  const [earnings, setEarnings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const earningsPerPage = 5;
  const vendorId = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;

  const fetchEarnings = () => {
    axios.get(`http://localhost:5000/api/vendor/driver-earnings?vendorId=${vendorId}`)
      .then(res => setEarnings(res.data))
      .catch(err => console.error('Error fetching driver earnings:', err));
  };

  useEffect(() => {
    if (vendorId) fetchEarnings();
  }, [vendorId]);

  const handlePay = (earningId) => {
    axios.post('http://localhost:5000/api/vendor/pay-driver', { earningId })
      .then(() => fetchEarnings())
      .catch(err => console.error('Error processing payment:', err));
  };

  // Pagination logic
  const indexOfLast = currentPage * earningsPerPage;
  const indexOfFirst = indexOfLast - earningsPerPage;
  const currentEarnings = earnings.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(earnings.length / earningsPerPage);

  return (
    <>
      <VendorNavbar />
      <div className={styles.container}>
        <h2 className={styles.header}>Driver Earnings</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Trip ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentEarnings.map((earning) => (
              <tr key={earning.EarningID}>
                <td>{earning.DriverName}</td>
                <td>{earning.TripID}</td>
                <td>₹ {earning.Amount}</td>
                <td style={{ color: earning.PaymentStatus === 'Paid' ? 'green' : 'red' }}>
                  {earning.PaymentStatus}
                </td>
                <td>{earning.PaymentDate ? new Date(earning.PaymentDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {earning.PaymentStatus === 'Pending' && (
                    <button onClick={() => handlePay(earning.EarningID)} className={styles.payButton}>
                      Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default VendorDriverEarnings;
