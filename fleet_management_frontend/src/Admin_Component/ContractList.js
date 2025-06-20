import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/ContractList.module.css'; // Import the CSS module
import Navbar from './Navbar';

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);

  const [formData, setFormData] = useState({
    ContractStartDate: '',
    ContractEndDate: '',
    NegotiatedRatePerKm: '',
    NegotiatedRatePerHour: '',
    BataPerDay: '',
    PermitCharges: '',
    OtherTerms: '',
  });
  const [clients, setClients] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [newContract, setNewContract] = useState({
    ClientID: '',
    PriceListID: '',
    ContractStartDate: '',
    ContractEndDate: '',
    NegotiatedRatePerKm: '',
    NegotiatedRatePerHour: '',
    BataPerDay: '',
    PermitCharges: '',
    OtherTerms: '',
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleEdit = (contract) => {
    setIsEditing(contract.ContractID);
    setFormData({
      ContractStartDate: contract.ContractStartDate,
      ContractEndDate: contract.ContractEndDate,
      NegotiatedRatePerKm: contract.NegotiatedRatePerKm,
      NegotiatedRatePerHour: contract.NegotiatedRatePerHour,
      BataPerDay: contract.BataPerDay,
      PermitCharges: contract.PermitCharges,
      OtherTerms: contract.OtherTerms,
    });
  };

  const handleCancel = async (contractId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this contract?');
    if (!confirmCancel) return;

    try {
      await axios.put(`http://localhost:5000/contracts/cancel/${contractId}`);
      fetchContracts();
    } catch (error) {
      console.error('Error canceling contract:', error);
    }
  };


  const handleViewDetails = (contract) => {
    setSelectedContract(contract);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/contracts/${isEditing}`, formData);
      setIsEditing(null);
      fetchContracts();
    } catch (error) {
      console.error('Error updating contract:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fetch client and price list data
  useEffect(() => {
    fetch("http://localhost:5000/api/clients") // Change URL if needed
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error("Error fetching clients:", err));

    fetch("http://localhost:5000/api/pricelists") // Change URL if needed
      .then((res) => res.json())
      .then((data) => setPriceLists(data))
      .catch((err) => console.error("Error fetching price lists:", err));
  }, []);

  const handleNewContractChange = (e) => {
    const { name, value } = e.target;
    setNewContract((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddContract = async (e) => {
    e.preventDefault();
    try {
      // Before sending, ensure the dates are properly formatted
      const formattedData = {
        ...newContract,
        ContractStartDate: formatDateForInput(newContract.ContractStartDate),
        ContractEndDate: formatDateForInput(newContract.ContractEndDate),
      };

      await axios.post('http://localhost:5000/contracts', formattedData);
      setNewContract({
        ClientID: '',
        PriceListID: '',
        ContractStartDate: '',
        ContractEndDate: '',
        NegotiatedRatePerKm: '',
        NegotiatedRatePerHour: '',
        BataPerDay: '',
        PermitCharges: '',
        OtherTerms: '',
      });
      fetchContracts();
    } catch (error) {
      console.error('Error adding contract:', error);
    }
  };


  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <Navbar />
      <div className={styles.mainContainer}>
        {/* Add New Contract Form */}
        <div className={styles.addContract}>
          <h2 className={styles.cardtitle}>Add New Contract</h2>
          <form onSubmit={handleAddContract} className={styles.form}>
            <div className={styles.row}>
              <label>Select Client</label>
              <select
                className={styles.inputbox}
                name="ClientID"
                value={newContract.ClientID}
                onChange={handleNewContractChange}
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.ClientID} value={client.ClientID}>
                    {client.ClientName} {/* or any other name field */}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <label>Select Vehicle Type </label>
              <select
                className={styles.inputbox}
                name="PriceListID"
                value={newContract.PriceListID}
                onChange={handleNewContractChange}
              >
                <option value="">Select Vehicle Type</option>
                {priceLists.map((priceList) => (
                  <option key={priceList.PriceListID} value={priceList.PriceListID}>
                    {priceList.VehicleType} {/* or something descriptive */}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <label>Contract Start Date</label>
              <input className={styles.inputbox} type="date" name="ContractStartDate" value={newContract.ContractStartDate} onChange={handleNewContractChange} />
            </div>
            <div className={styles.row}>
              <label>Contract End Date</label>
              <input className={styles.inputbox} type="date" name="ContractEndDate" value={newContract.ContractEndDate} onChange={handleNewContractChange} />
            </div>

            <div className={styles.row}>
              <label>Negotiated Rate PerKm</label>
              <input className={styles.inputbox} type="number" name="NegotiatedRatePerKm" placeholder="Rate/Km" value={newContract.NegotiatedRatePerKm} onChange={handleNewContractChange} />
            </div>

            <div className={styles.row}>
              <label>Negotiated Rate Per Hour</label>
              <input className={styles.inputbox} type="number" name="NegotiatedRatePerHour" placeholder="Rate/Hour" value={newContract.NegotiatedRatePerHour} onChange={handleNewContractChange} />
            </div>

            <div className={styles.row}>
              <label>Bata Per Day</label>
              <input className={styles.inputbox} type="number" name="BataPerDay" placeholder="Bata/Day" value={newContract.BataPerDay} onChange={handleNewContractChange} />
            </div>

            <div className={styles.row}>
              <label>Permit Charges</label>
              <input className={styles.inputbox} type="number" name="PermitCharges" placeholder="Permit Charges" value={newContract.PermitCharges} onChange={handleNewContractChange} />
            </div>

            <div className={styles.row}>
              <label>OtherTerms</label>
              <textarea className={styles.inputbox} name="OtherTerms" placeholder="Other Terms" value={newContract.OtherTerms} onChange={handleNewContractChange} />
              <button className={styles.addBtn} type="submit">Add Contract</button>
            </div>
          </form>
        </div>

        {/* Edit Contract Form */}
        {isEditing && (
          <div className={styles.editContract}>
            <h2 className={styles.cardtitle}>Edit Contract</h2>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Contract start Date</label>
                <input className={styles.inputbox} type="date" name="ContractStartDate" value={formatDateForInput(formData.ContractStartDate)} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Contract End Date</label>
                <input className={styles.inputbox} type="date" name="ContractEndDate" value={formatDateForInput(formData.ContractEndDate)} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Negotiated Rate Per Km</label>
                <input className={styles.inputbox} type="number" name="NegotiatedRatePerKm" value={formData.NegotiatedRatePerKm} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Negotiated Rate Per Hour</label>
                <input className={styles.inputbox} type="number" name="NegotiatedRatePerHour" value={formData.NegotiatedRatePerHour} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Bata Per Day</label>
                <input className={styles.inputbox} type="number" name="BataPerDay" value={formData.BataPerDay} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Permit Charges</label>
                <input className={styles.inputbox} type="number" name="PermitCharges" value={formData.PermitCharges} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Other Terms</label>
                <textarea className={styles.inputbox} name="OtherTerms" value={formData.OtherTerms} onChange={handleInputChange} />
                <button className={styles.saveBtn} type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        )}

        {/* View Contract Details */}
        {selectedContract && (
          <div className={styles.cardContainer}>
            <h2 className={styles.cardHeader}>Contract Details</h2>
            <div className={styles.cardContent}>

              {/* Special message if Cancelled */}
              {selectedContract.Status === 'Cancelled' && (
                <div className={styles.cancelledText}>
                  <span style={{ color: 'red', fontSize: '18px', fontWeight: 'bold' }}>
                    {selectedContract.Status}
                  </span>
                </div>
              )}

              <div className={styles.rows}>
                <div className={styles.column}>
                  <strong>Client:</strong> {selectedContract.ClientName}
                </div>
                <div className={styles.column}>
                  <strong>VehicleType:</strong> {selectedContract.VehicleType}
                </div>
              </div>

              <div className={styles.rows}>
                <div className={styles.column}>
                  <strong>Start Date:</strong> {new Date(selectedContract.ContractStartDate).toLocaleDateString()}
                </div>
                <div className={styles.column}>
                  <strong>End Date:</strong> {new Date(selectedContract.ContractEndDate).toLocaleDateString()}
                </div>
              </div>

              <div className={styles.rows}>
                <div className={styles.column}>
                  <strong>Rate/Km:</strong> ₹{selectedContract.NegotiatedRatePerKm}
                </div>
                <div className={styles.column}>
                  <strong>Rate/Hour:</strong> ₹{selectedContract.NegotiatedRatePerHour}
                </div>
              </div>

              <div className={styles.rows}>
                <div className={styles.column}>
                  <strong>Bata/Day:</strong> ₹{selectedContract.BataPerDay}
                </div>
                <div className={styles.column}>
                  <strong>Permit Charges:</strong> ₹{selectedContract.PermitCharges}
                </div>
              </div>


              <div className={styles.rows}>
                <div className={styles.column}>
                  <strong>Other Terms:</strong> {selectedContract.OtherTerms}
                </div>
                <div className={styles.column}>
                  <strong>Status:</strong> {selectedContract.Status}
                </div>
              </div>

            </div>
          </div>
        )}


        <div className={styles.container}>
          <h1 className={styles.cardtitle}>Contract List</h1>
          <table className={styles.contractTable}>
            <thead>
              <tr>
                <th>Client Id - Client Name</th>
                <th>Contract Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.ContractID}>
                  <td>{contract.ClientID} - {contract.ClientName}</td>
                  <td>{contract.Status === 'Cancelled' ? 'Cancelled' : 'Active'}</td>
                  <td>
                    <button className={styles.viewBtn} onClick={() => handleViewDetails(contract)}>View Details</button>
                    <button className={styles.editbtn} onClick={() => handleEdit(contract)}>Edit</button>
                    {/* Show Cancel button only if not already cancelled */}
                    {contract.Status !== 'Cancelled' && (
                      <button className={styles.deleteBtn} onClick={() => handleCancel(contract.ContractID)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ContractList;
