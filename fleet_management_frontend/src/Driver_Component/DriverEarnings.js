import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DriverEarnings.css';

function DriverEarnings({ driverData }) {
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const earningsPerPage = 5;

  const driverId = driverData?.driverData?.driverID;

  useEffect(() => {
    if (driverId) {
      axios
        .get(`http://localhost:5000/api/driver/${driverId}/view-earnings`)
        .then((response) => {
          if (response.data.success) {
            setEarnings(response.data.earnings);
            setTotalEarnings(response.data.totalEarnings);
            setCurrentPage(1); // reset page when data changes
          } else {
            setError('Failed to fetch earnings data');
          }
        })
        .catch((err) => {
          console.error('Error fetching earnings:', err);
          setError('Error fetching earnings data');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Driver ID is missing');
      setLoading(false);
    }
  }, [driverId]);

  // Pagination logic
  const indexOfLastEarning = currentPage * earningsPerPage;
  const indexOfFirstEarning = indexOfLastEarning - earningsPerPage;
  const currentEarnings = earnings.slice(indexOfFirstEarning, indexOfLastEarning);
  const totalPages = Math.ceil(earnings.length / earningsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  return (
    <div className="driver-earnings">
      <h2>Earnings</h2>

      {loading && <p>Loading your earnings data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p>
        <strong>Total Earnings:</strong> ₹{totalEarnings}
      </p>

      {earnings.length === 0 && !loading && !error ? (
        <p>No earnings data available</p>
      ) : (
        <>
          <table style={{ margin: 'auto' }} border="1" cellPadding="8" cellSpacing="0">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {currentEarnings.map((earning, index) => (
                <tr key={`${earning.TripID}-${earning.EarningID || index}`}>
                  <td>{earning.TripID}</td>
                  <td>₹{earning.Amount}</td>
                  <td>{earning.PaymentStatus}</td>
                  <td>{earning.PaymentDate ? new Date(earning.PaymentDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="pagination-controls" style={{ marginTop: '15px', textAlign: 'center' }}>
            <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ marginRight: '10px' }}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ marginLeft: '10px' }}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DriverEarnings;
