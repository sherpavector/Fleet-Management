import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/Login.module.css";
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/resetpassword", {
        email,
        newPassword,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form} style={{ width: "500px" }}>
        <h2 className={styles.heading}>Reset Password</h2>
        <input
          className={styles.input}
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className={styles.button} onClick={handleSubmit}>
          Reset Password
        </button>
        {message && <p className={styles.text}>{message}</p>}

        <div
          onClick={() => navigate(-1)}
          className={styles.backLink}
          style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "5px", marginTop: "20px" }}
        >
          <ArrowBackRoundedIcon />
          <span>Back</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
