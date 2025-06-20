import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DriverDocuments.css';

const DriverDocuments = ({ driverData }) => {
  const driverId = driverData?.driverData?.driverID;

  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    DocumentType: 'License',
    DocumentNumber: '',
    IssueDate: '',
    ExpiryDate: '',
    file: null
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (driverId) {
      axios
        .get(`http://localhost:5000/api/driver/${driverId}/documents`)
        .then((res) => setDocuments(res.data.documents || []))
        .catch((err) => console.error('Failed to fetch documents', err));
    }
  }, [driverId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: name === 'file' ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    const uploadData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      uploadData.append(key, value);
    });

    try {
      const res = await axios.post(
        `http://localhost:5000/api/driver/${driverId}/upload-document`,
        uploadData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setErrorMsg('');
        setFormData({
          DocumentType: 'License',
          DocumentNumber: '',
          IssueDate: '',
          ExpiryDate: '',
          file: null
        });

        const refresh = await axios.get(`http://localhost:5000/api/driver/${driverId}/documents`);
        setDocuments(refresh.data.documents || []);
      }
    } catch (err) {
      setErrorMsg('Upload failed');
      setSuccessMsg('');
      console.error(err);
    }
  };

  return (
    <div className="documents-container">
      <h2>Your Documents</h2>
      {successMsg && <p className="success">{successMsg}</p>}
      {errorMsg && <p className="error">{errorMsg}</p>}

      {documents.length > 0 ? (
        <table className="documents-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Number</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.DocumentID}>
                <td>{doc.DocumentType}</td>
                <td>{doc.DocumentNumber}</td>
                <td>{new Date(doc.IssueDate).toLocaleDateString()}</td>
                <td>{new Date(doc.ExpiryDate).toLocaleDateString()}</td>
                <td>
                  <a
                    href={`http://localhost:5000/uploads/${doc.DocumentFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No documents found.</p>
      )}

      <h3>Upload New Document</h3>
      <form onSubmit={handleSubmit} className="upload-form">
        <div>
          <label>Document Type:</label>
          <select name="DocumentType" value={formData.DocumentType} onChange={handleChange}>
            <option value="License">License</option>
            <option value="PoliceVerification">Police Verification</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label>Document Number:</label>
          <input
            type="text"
            name="DocumentNumber"
            value={formData.DocumentNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Issue Date:</label>
          <input
            type="date"
            name="IssueDate"
            value={formData.IssueDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Expiry Date:</label>
          <input
            type="date"
            name="ExpiryDate"
            value={formData.ExpiryDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Upload File:</label>
          <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} />
        </div>
        <button type="submit">Upload Document</button>
      </form>
    </div>
  );
};

export default DriverDocuments;
