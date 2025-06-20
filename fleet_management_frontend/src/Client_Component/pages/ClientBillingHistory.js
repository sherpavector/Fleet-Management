import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './ClientBillingHistory.css';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';

const ClientBillingHistory = () => {
    const [paidTrips, setPaidTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    useEffect(() => {
        const clientId = localStorage.getItem('clientId');
        if (!clientId) {
            setError('Client not logged in');
            setLoading(false);
            return;
        }

        axios
            .get(`http://localhost:5000/api/client/${clientId}/paid-trips`)
            .then((res) => {
                setPaidTrips(res.data.paidTrips || []);
                setLoading(false);
            })
            .catch((err) => {
                setError('Failed to fetch paid trips');
                setLoading(false);
            });
    }, []);

    const handleDownload = (element, tripId) => {
        html2canvas(element).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Trip_${tripId}_Invoice.pdf`);
        });
    };

    if (loading) return <div>Loading your payment history...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <>
            <Navbar />
            <div className="billing-history-container">
                <h2>Your Paid Trips</h2>
                {paidTrips.length === 0 ? (
                    <p>No paid trips found.</p>
                ) : (
                    <table className="billing-history-table">
                        <thead>
                            <tr>
                                <th>Trip ID</th>
                                <th>Pickup Location</th>
                                <th>Drop Location</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Vehicle Type</th>
                                <th>Total Paid (₹)</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidTrips.map((trip) => (
                                <tr key={trip.TripID}>
                                    <td>{trip.TripID}</td>
                                    <td>{trip.PickupLocation}</td>
                                    <td>{trip.DropLocation}</td>
                                    <td>{new Date(trip.StartTime).toLocaleDateString()}</td>
                                    <td>{new Date(trip.EndTime).toLocaleDateString()}</td>
                                    <td>{trip.VehicleType}</td>
                                    <td>₹{trip.TotalCost}</td>
                                    <td>{trip.PaymentStatus}</td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                setSelectedTrip(trip);
                                                setShowPopup(true);
                                            }}
                                        >
                                            Generate Bill
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showPopup && selectedTrip && (
                <BillPopup
                    trip={selectedTrip}
                    onClose={() => setShowPopup(false)}
                    onDownload={handleDownload}
                />
            )}
        </>
    );
};

const BillPopup = ({ trip, onClose, onDownload }) => {
    const billRef = useRef();

    return createPortal(
        <div className="popup-overlay">
            <div className="popup-content" >
                <div className='printBill' ref={billRef}>
                    <h2 style={{ textAlign: 'center' }}>Trip Payment Invoice</h2>
                    <p><strong>Trip ID:</strong> {trip.TripID}</p>
                    <p><strong>Pickup Location:</strong> {trip.PickupLocation}</p>
                    <p><strong>Drop Location:</strong> {trip.DropLocation}</p>
                    <p><strong>Start Date:</strong> {new Date(trip.StartTime).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(trip.EndTime).toLocaleDateString()}</p>
                    <p><strong>Vehicle Type:</strong> {trip.VehicleType}</p>
                    <p><strong>Total Distance:</strong> {trip.TotalDistance} km</p>
                    <p><strong>Total Paid:</strong> ₹{trip.TotalCost}</p>
                    <p><strong>Payment Status:</strong> {trip.PaymentStatus}</p>
                    <p><strong>Date Generated:</strong> {new Date().toLocaleString()}</p>
                </div>
                <div className="popup-buttons">
                    <button onClick={() => onDownload(billRef.current, trip.TripID)}>
                        Download Bill
                    </button>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ClientBillingHistory;
