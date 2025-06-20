import React, { useEffect, useState } from 'react';
import styles from '../styles/SendVendorMessage.module.css';
import Navbar from '../Admin_Component/Navbar';

const SendVendorMessage = () => {
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    vendorID: '',
    subject: '',
    message: ''
  });
  const [sentMessages, setSentMessages] = useState([]);

  useEffect(() => {
    // Fetch vendor list
    fetch('http://localhost:5000/api/admin/vendors')
      .then(res => res.json())
      .then(data => setVendors(data))
      .catch(err => console.error('Error fetching vendors:', err));

    // Fetch previously sent messages
    fetch('http://localhost:5000/api/admin/vendor-messages')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSentMessages(data.messages);
        } else {
          console.error('Failed to fetch messages');
        }
      })
      .catch(err => console.error('Error fetching sent messages:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:5000/api/send-message-to-vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Message sent!');
        const vendorName = vendors.find(v => v.VendorID === parseInt(formData.vendorID))?.VendorName || 'Unknown Vendor';
        const newMessage = {
          VendorName: vendorName,
          Subject: formData.subject,
          Message: formData.message,
          SentAt: new Date().toLocaleString()
        };
        setSentMessages(prev => [newMessage, ...prev]);
        setFormData({ vendorID: '', subject: '', message: '' });
      })
      .catch(err => {
        console.error('Error sending message:', err);
        alert('Failed to send message.');
      });
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h2 className={styles.heading}>Send Message to Vendor</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>Select Vendor:</label>
          <select
            className={styles.select}
            name="vendorID"
            value={formData.vendorID}
            onChange={handleChange}
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map(v => (
              <option key={v.VendorID} value={v.VendorID}>{v.VendorName}</option>
            ))}
          </select>

          <label className={styles.label}>Subject:</label>
          <input
            className={styles.input}
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
          />

          <label className={styles.label}>Message:</label>
          <textarea
            className={styles.textarea}
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>

          <button type="submit" className={styles.button}>Send Message</button>
        </form>

        {sentMessages.length > 0 && (
          <div className={styles.sentMessages}>
            <h3 className={styles.subheading}>Previously Sent Messages</h3>
            <ul className={styles.messageList}>
              {sentMessages.map((msg, index) => (
                <li key={index} className={styles.messageItem}>
                  <h4><strong>Vendor:</strong> {msg.VendorName}</h4>
                  <p><strong>Subject:</strong> {msg.Subject}</p>
                  <p><strong>Message:</strong> {msg.Message}</p>
                  <p><small><strong>Sent At:</strong> {new Date(msg.SentAt).toLocaleString()}</small></p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default SendVendorMessage;
