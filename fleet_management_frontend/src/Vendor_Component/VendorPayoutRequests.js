import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VendorNavbar from './vendor_navbar';
import styles from './VendorPayoutRequests.module.css';

const VendorPayoutRequests = () => {
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const vendorID = JSON.parse(localStorage.getItem('vendorData'))?.vendorData?.vendorID;

    useEffect(() => {
        fetchPayoutRequests();
    }, []);

    const fetchPayoutRequests = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/vendor/payout-requests?vendorID=${vendorID}`);
            setPayoutRequests(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching payout requests:', error);
            setLoading(false);
        }
    };

    const updateStatus = async (requestID, status) => {
        try {
            await axios.put(`http://localhost:5000/api/vendor/payout-requests/${requestID}`, { status });
            alert(`Request ${status.toLowerCase()} successfully And Paid to driver`);
            fetchPayoutRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    if (loading) return <p className={styles.loading}>Loading payout requests...</p>;

    return (
        <>
            <VendorNavbar />
            <div className={styles.container}>
                <h2 className={styles.title}>Driver Payout Requests</h2>
                {payoutRequests.length === 0 ? (
                    <p className={styles.noData}>No payout requests found.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headerRow}>
                                <th>Request ID</th>
                                <th>Driver ID</th>
                                <th>Contact</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payoutRequests.map((req) => (
                                <tr key={req.RequestID}>
                                    <td>{req.RequestID}</td>
                                    <td>{req.DriverID}</td>
                                    <td>{req.ContactNumber}</td>
                                    <td>₹{req.Amount.toFixed(2)}</td>
                                    <td>{new Date(req.RequestDate).toLocaleString()}</td>
                                    <td className={styles.status}>{req.Status}</td>
                                    <td>
                                        {req.Status === 'Pending' ? (
                                            <>
                                                <button className={styles.actionBtn} onClick={() => updateStatus(req.RequestID, 'Approved')}>
                                                    Approve
                                                </button>
                                                <button className={styles.actionBtn} onClick={() => updateStatus(req.RequestID, 'Rejected')}>
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span className={styles.noActions}>No actions</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default VendorPayoutRequests;
