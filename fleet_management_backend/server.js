require('dotenv').config(); // Add this line at the very top
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mysql = require('mysql');
const path = require('path');
const axios = require('axios')
const twilio = require('twilio');
const multer = require('multer');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


const app = express();
const port = 5000;

const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

const JWT_SECRET = "your_strong_secret_key";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(cookieParser());
app.use(session({
  secret: 'your_secret_key', // Use a secret key for encryption
  resave: false,
  saveUninitialized: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the MySQL database.");
});


//---------------------------------------Start of Admin Login--------------------------------------------------------
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE Email = ? AND Role = "Admin"', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = results[0];

    // Compare password
    if (password === user.Password) {
      req.session.admin = user; // Store admin data in session
      return res.json({ message: 'Login successful' });
    } else {
      return res.status(400).json({ message: 'Invalid password' });
    }
  });
});

// Logout route to destroy the session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

//-----------------------------End of Admin Login--------------------------------------------------------------------------

//---------------------------------------------Start of Forgot password----------------------------------------------------------------------

app.post('/api/resetpassword', (req, res) => {
  const { email, newPassword } = req.body;

  db.query('SELECT * FROM users WHERE Email = ?', [email], (err, results) => {
    if (err) {
      console.error('Error selecting user:', err);
      return res.status(500).json({ message: 'Server error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    db.query('UPDATE users SET Password = ? WHERE Email = ?', [newPassword, email], (err2) => {
      if (err2) {
        console.error('Error updating password:', err2);
        return res.status(500).json({ message: 'Password update failed.' });
      }

      res.json({ message: 'Password updated successfully.' });
    });
  });
});



//-------------------------------------End of Forgot Password---------------------------------------------------------------



//-------------------------------------Start of Admin Profile---------------------------------------------------------------

// GET endpoint to fetch admin profile
app.get('/admin/profile', (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ message: 'Not authenticated' });  // Check if admin is logged in
  }

  // Send back the admin profile stored in the session
  res.json(req.session.admin);
});

// PUT endpoint to update admin profile
app.put('/admin/profile', (req, res) => {
  const { Name, Email, Role } = req.body;

  if (!req.session.admin) {
    return res.status(401).json({ message: 'Not authenticated' });  // Check if admin is logged in
  }

  const adminID = req.session.admin.UserID;

  // Update the profile in the database
  db.query(
    'UPDATE users SET Name = ?, Email = ?, Role = ? WHERE UserID = ?',
    [Name, Email, Role, adminID],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Update session data with the new profile information
      req.session.admin.Name = Name;
      req.session.admin.Email = Email;
      req.session.admin.Role = Role;

      res.json({ message: 'Profile updated successfully' });
    }
  );
});

//-----------------------------------------------End of Admin Profile-------------------------------------------------------



//------------------------------start of Driver Backend ---------------------------------------------------------------------------

app.get('/api/managedriver/vendors', (req, res) => {
  const query = 'SELECT vendorID, VendorName FROM Vendors'; // Adjust the table name if necessary

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching vendors:', err);
      return res.status(500).json({ error: 'Error fetching vendors' });
    }
    res.json(results);
  });
});


// Add Driver API
app.post("/add-driver", (req, res) => {
  const { name, empid, email, password, licenseNumber, ongoingTraining, contactNumber, policeVerificationDoneDate, Status, vendorID } = req.body;
  console.log("Received vendorID:", vendorID);
  // Insert user data into Users table (this will create the driver in the Users table)
  const insertUserQuery = `
    INSERT INTO Users (Name, EmployeeID, Email, Password, Role) 
    VALUES (?, ?, ?, ?, 'Driver')
  `;
  db.query(insertUserQuery, [name, empid, email, password], (err, result) => {
    if (err) {
      console.error("Error inserting into Users:", err);
      return res.status(500).json({ error: 'Error adding driver to Users' });
    }

    const userID = result.insertId; // Get the generated UserID

    // Now, insert the driver's data into the Drivers table
    const insertDriverQuery = `
      INSERT INTO Drivers (UserID, LicenseNumber, OngoingTraining, ContactNumber, PoliceVerificationDoneDate, Status, VendorID)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertDriverQuery, [userID, licenseNumber, ongoingTraining, contactNumber, policeVerificationDoneDate, Status, vendorID], (err, result) => {
      if (err) {
        console.error("Error inserting into Drivers:", err);
        return res.status(500).json({ error: 'Error adding driver' });
      }
      console.log("Driver data added:", result);
      return res.status(200).json({ message: 'Driver added successfully' });
    });
  });
});

// Fetch all drivers with their names
app.get('/api/drivers', (req, res) => {
  const vendorId = req.query.vendorId;
  let query = `
  SELECT 
  Drivers.DriverID, 
  Users.Name AS DriverName, 
  Drivers.LicenseNumber, 
  Drivers.OngoingTraining, 
  Drivers.ContactNumber, 
  Drivers.PoliceVerificationDoneDate, 
  Drivers.Status,
  Drivers.VehicleID,
  Vehicles.VehicleNumber AS AssignedVehicleNumber,
  Vehicles.TypeOfVehicle AS AssignedVehicle
  FROM Drivers
  JOIN Users ON Drivers.UserID = Users.UserID 
  LEFT JOIN Vehicles ON Drivers.VehicleID = Vehicles.VehicleID

  `;

  if (vendorId) {
    query += ` WHERE Drivers.VendorID = ?`;
    db.query(query, [vendorId], (err, results) => {
      if (err) {
        console.error('Error fetching drivers:', err);
        res.status(500).json({ message: 'Error fetching drivers' });
      } else {
        res.json(results);
      }
    });
  } else {
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching drivers:', err);
        res.status(500).json({ message: 'Error fetching drivers' });
      } else {
        res.json(results);
      }
    });
  }
});


// 3. Update driver details
app.put('/api/drivers/:id', (req, res) => {
  const { LicenseNumber, OngoingTraining, ContactNumber, PoliceVerificationDoneDate } = req.body;
  const query = `UPDATE Drivers SET LicenseNumber = ?, OngoingTraining = ?, ContactNumber = ?, PoliceVerificationDoneDate = ? WHERE DriverID = ?`;

  db.query(query, [LicenseNumber, OngoingTraining, ContactNumber, PoliceVerificationDoneDate, req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error updating driver');
    } else {
      res.status(200).send('Driver updated successfully');
    }
  });
});

// 4. Delete a driver
app.delete('/api/drivers/:id', (req, res) => {
  const query = 'DELETE FROM Drivers WHERE DriverID = ?';
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error deleting driver');
    } else {
      res.status(200).send('Driver deleted successfully');
    }
  });
});

//----------------------------End of Driver Backend --------------------------------------------------------------------




//---------------------------------start of Assign Driver to Vehicle ----------------------------------------------------------

// Fetch all drivers
app.get("/drivers", (req, res) => {
  const query = "SELECT * FROM Users WHERE Role = 'Driver'";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching drivers' });
    }
    res.json(results);  // Return all drivers as a response
  });
});

// Fetch all vehicles
app.get("/vehicles", (req, res) => {
  const query = "SELECT * FROM Vehicles";  // Assuming a table named Vehicles
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }
    res.json(results);  // Return all vehicles as a response
  });
});

app.post("/assign-driver", (req, res) => {
  const { driverID, vehicleID } = req.body;

  // If you don't want to store the assignment, you can just send a response:
  if (driverID && vehicleID) {
    // For example, you can just log the assignment to console or process any logic
    console.log(`Driver ${driverID} has been assigned to Vehicle ${vehicleID}`);

    // Perform any other logic here (e.g., notifying the driver or vehicle owner)

    // Send success response
    return res.status(200).json({ message: `Driver ${driverID} successfully assigned to Vehicle ${vehicleID}` });
  } else {
    return res.status(400).json({ error: 'Driver and Vehicle must be selected' });
  }
});

//------------------------------End of Assign Driver to Vehicle -------------------------------------------------------------




//--------------------------------------start of Managing Clients ------------------------------------------------------------

// Routes for managing clients
app.get('/manage-clients', (req, res) => {
  db.query('SELECT * FROM Clients', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

app.post('/manage-clients', (req, res) => {
  const { ClientName, PrimaryContactName, PrimaryContactEmail, PrimaryContactPhone, BillingAddress } = req.body;
  db.query('INSERT INTO Clients (ClientName, PrimaryContactName, PrimaryContactEmail, PrimaryContactPhone, BillingAddress) VALUES (?, ?, ?, ?, ?)',
    [ClientName, PrimaryContactName, PrimaryContactEmail, PrimaryContactPhone, BillingAddress],
    (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.json({ ClientID: result.insertId, ...req.body });
    });
});

app.put('/manage-clients/:id', (req, res) => {
  const { ClientName, PrimaryContactName, PrimaryContactEmail, PrimaryContactPhone, BillingAddress } = req.body;
  db.query('UPDATE Clients SET ClientName = ?, PrimaryContactName = ?, PrimaryContactEmail = ?, PrimaryContactPhone = ?, BillingAddress = ? WHERE ClientID = ?',
    [ClientName, PrimaryContactName, PrimaryContactEmail, PrimaryContactPhone, BillingAddress, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.json({ ClientID: req.params.id, ...req.body });
    });
});

//--------------------------------------------------End of Managing Clients----------------------------------------------------




//--------------------------------------------------start of Contract ----------------------------------------------------------

// Fetch clients
app.get('/api/clients', (req, res) => {
  db.query('SELECT * FROM clients', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Fetch price lists
app.get('/api/pricelists', (req, res) => {
  const query = `SELECT DISTINCT VehicleType FROM pricelists`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});



// Convert date format to MySQL compatible format (YYYY-MM-DD HH:MM:SS)
function convertToMySQLDateFormat(dateString) {
  if (!dateString) {
    throw new Error("Invalid date string: " + dateString);
  }
  const date = new Date(dateString);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}



// Example: Backend endpoint to get multiple client names by ClientIDs
app.get('/clients', async (req, res) => {
  const { clientIds } = req.query;  // Expecting a query parameter 'clientIds' with a list of client IDs
  try {
    const clients = await Client.find({ ClientID: { $in: clientIds } });  // MongoDB query example
    res.json(clients);
  } catch (error) {
    res.status(500).send('Error fetching client names');
  }
});

// Example: Backend endpoint to get multiple Vehicle types by vehicleIDs
app.get('/vehicles', async (req, res) => {
  const { priceListID } = req.query;
  try {
    const vehicle = await priceLists.find({ ClientID: { $in: priceListID } });
    res.json(vehicle);
  } catch (error) {
    res.status(500).send('Error fetching client names');
  }
});



// GET: Fetch all contracts
app.get('/contracts', async (req, res) => {
  try {
    const sql = `
     SELECT 
  c.*, 
  p.VehicleType, 
  cl.ClientName
FROM 
  contracts c
LEFT JOIN 
  pricelists p ON c.PriceListID = p.PriceListID
LEFT JOIN 
  clients cl ON c.ClientID = cl.ClientId
ORDER BY 
      c.ContractID DESC;
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching contracts:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// POST: Create a new contract
app.post('/contracts', (req, res) => {
  const {
    ClientID,
    PriceListID,
    ContractStartDate,
    ContractEndDate,
    NegotiatedRatePerKm,
    NegotiatedRatePerHour,
    BataPerDay,
    PermitCharges,
    OtherTerms
  } = req.body;

  console.log("POST /contracts body:", req.body);

  if (!ContractStartDate || !ContractEndDate) {
    return res.status(400).json({ error: 'Contract start and end dates are required.' });
  }

  const formattedStartDate = convertToMySQLDateFormat(ContractStartDate);
  const formattedEndDate = convertToMySQLDateFormat(ContractEndDate);

  const sqlQuery = `
    INSERT INTO contracts 
    (ClientID, PriceListID, ContractStartDate, ContractEndDate, NegotiatedRatePerKm, NegotiatedRatePerHour, BataPerDay, PermitCharges, OtherTerms) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    ClientID,
    PriceListID,
    formattedStartDate,
    formattedEndDate,
    NegotiatedRatePerKm,
    NegotiatedRatePerHour,
    BataPerDay,
    PermitCharges,
    OtherTerms
  ];

  db.query(sqlQuery, values, (err, result) => {
    if (err) {
      console.error('Error inserting contract into MySQL:', err);
      return res.status(500).send('Error creating contract');
    }
    res.status(201).json({ message: 'Contract created successfully', contractId: result.insertId });
  });
});


//Edit
app.put('/contracts/:id', (req, res) => {
  const contractId = req.params.id;

  // 🔥 Correct extraction based on your frontend payload
  const {
    ContractStartDate,
    ContractEndDate,
    NegotiatedRatePerKm,
    NegotiatedRatePerHour,
    BataPerDay,
    PermitCharges,
    OtherTerms
  } = req.body;

  console.log("PUT /contracts/:id body:", req.body);

  if (!ContractStartDate || !ContractEndDate) {
    return res.status(400).json({ error: "Start and End dates are required." });
  }

  // 🔥 Now correctly use extracted variables
  const formattedStartDate = convertToMySQLDateFormat(ContractStartDate);
  const formattedEndDate = convertToMySQLDateFormat(ContractEndDate);

  const sql = `
    UPDATE contracts
    SET 
      ContractStartDate = ?,
      ContractEndDate = ?,
      NegotiatedRatePerKm = ?,
      NegotiatedRatePerHour = ?,
      BataPerDay = ?,
      PermitCharges = ?,
      OtherTerms = ?
    WHERE ContractID = ?
  `;

  const values = [
    formattedStartDate,
    formattedEndDate,
    NegotiatedRatePerKm,
    NegotiatedRatePerHour,
    BataPerDay,
    PermitCharges,
    OtherTerms,
    contractId
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating contract:", err);
      res.status(500).json({ error: "Failed to update contract", details: err.message });
    } else {
      res.json({ message: "Contract updated successfully" });
    }
  });
});


// PUT: Cancel a contract (soft delete using OtherTerms)
app.put('/contracts/cancel/:id', (req, res) => {
  const contractId = req.params.id;
  const sqlQuery = 'UPDATE contracts SET Status = "Cancelled" WHERE ContractID = ?';

  db.query(sqlQuery, [contractId], (err, result) => {
    if (err) {
      console.error('Error canceling contract in MySQL:', err);
      return res.status(500).send('Error canceling contract');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Contract not found');
    }
    res.json({ message: 'Contract cancelled successfully' });
  });
});

//---------------------------------------------------End of Contract ------------------------------------------------------------------





//--------------------------------------------------start of Admin Alerts-----------------------------------------------------------

// Get all alerts
app.get('/api/alerts', (req, res) => {
  db.query('SELECT * FROM Alerts ORDER BY AlertTime DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Mark alert as resolved by updating AlertDetails
app.put('/api/alerts/:id/resolve', (req, res) => {
  const alertId = req.params.id;
  db.query(
    'UPDATE Alerts SET AlertDetails = "Resolved" WHERE AlertID = ?',
    [alertId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Alert marked as resolved' });
    }
  );
});

//----------------------------------------------End of Admin Alerts ----------------------------------------------------------





//-----------------------------------------------start of Booking Details -------------------------------------------------------
app.get("/api/admin/vendors", (req, res) => {
  const query = "SELECT VendorID, VendorName FROM vendors";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching vendors:", err);
      return res.status(500).json({ error: "Failed to fetch vendors" });
    }
    res.json(results);
  });
});


app.get('/api/admin/trips', (req, res) => {
  const vendorId = req.query.vendorId; // ✅ FIX: get vendorId from query

  let query = `
    SELECT 
      tm.*,
      c.ClientName,
      t.StartTime,
      t.EndTime,
      t.TripType,
      t.VehicleType,
      t.PickupLocation,
      t.DropLocation,
      v.VehicleNumber,
      v.TypeOfVehicle,
      u.Name AS DriverName
    FROM 
      TripManagement tm
    JOIN 
      Clients c ON tm.ClientID = c.ClientID
    LEFT JOIN 
      Drivers d ON tm.DriverID = d.DriverID
    LEFT JOIN 
      Users u ON d.UserID = u.UserID
    LEFT JOIN 
      Vehicles v ON tm.VehicleID = v.VehicleID
    LEFT JOIN 
      Vendors vd ON tm.VendorID = vd.VendorID
    LEFT JOIN 
      Trips t ON tm.TripID = t.TripID
  `;

  const params = [];

  if (vendorId) {
    query += " WHERE tm.VendorID = ?";
    params.push(vendorId);
  }

  query += " ORDER BY tm.TripID DESC";

  db.query(query, params, (error, results) => {
    if (error) {
      console.error("Error fetching trips:", error); // ✅ log actual SQL error
      return res.status(500).json({ error: 'Database query failed', details: error });
    }
    res.json(results);
  });
});


// ✅ Update trip status
app.put("/api/admin/update-trip-status/:tripId", (req, res) => {
  const tripId = req.params.tripId;
  const { TripStatus } = req.body;

  if (!TripStatus) {
    return res.status(400).json({ error: "TripStatus is required" });
  }

  const sql = "UPDATE tripmanagement SET TripStatus = ? WHERE TripID = ?";
  db.query(sql, [TripStatus, tripId], (err, result) => {
    if (err) {
      console.error("Error updating trip status:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json({ success: true, tripId, updatedTo: TripStatus });
  });
});

// Get unassigned trips
// Get trip by ID
app.get('/api/trip/:tripId', (req, res) => {
  const tripId = req.params.tripId;
  const sql = 'SELECT * FROM trips WHERE TripID = ?';

  db.query(sql, [tripId], (err, data) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });

    if (data.length === 0) return res.status(404).json({ error: 'Trip not found' });

    res.json(data[0]); // send single trip object
  });
});


// Get available drivers
app.get('/api/available-drivers', (req, res) => {
  const query = `
    SELECT 
    d.DriverID,
    u.Name AS DriverName,
    v.VehicleNumber,
    v.TypeOfVehicle AS VehicleType
FROM 
    drivers d
JOIN 
    users u ON d.UserID = u.UserID
JOIN 
    vehicles v ON d.VehicleID = v.VehicleID
WHERE 
    d.Status = 'Available'
    AND d.VehicleID IS NOT NULL;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching available drivers and vehicles:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(results); // ✅ This will not cause circular structure errors
  });
});



// Get available vehicles
app.get('/api/available-vehicles', (req, res) => {
  const sql = `SELECT VehicleID, VehicleNumber FROM Vehicles`;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data);
  });
});

// Assign trip to driver and vehicle
app.post('/api/assign-trip', (req, res) => {
  const { tripId, driverId } = req.body;

  if (!tripId || !driverId) {
    return res.status(400).json({ error: 'Missing tripId or driverId' });
  }

  // First, update the trip
  const updateTripSql = `
    UPDATE tripmanagement
    SET DriverID = ?, TripStatus = 'Assigned'
    WHERE TripID = ?
  `;

  db.query(updateTripSql, [driverId, tripId], (err1, result1) => {
    if (err1) {
      console.error('Error assigning driver to trip:', err1);
      return res.status(500).json({ error: 'Failed to assign driver to trip' });
    }

    // Then, update driver status
    const updateDriverSql = `
      UPDATE drivers
      SET Status = 'Assigned'
      WHERE DriverID = ?
    `;

    db.query(updateDriverSql, [driverId], (err2, result2) => {
      if (err2) {
        console.error('Error updating driver status:', err2);
        return res.status(500).json({ error: 'Driver status update failed' });
      }

      res.json({ success: true, message: 'Trip assigned successfully' });
    });
  });
});



//-------------------------------------------End of Booking Details ---------------------------------------------------------





//---------------------------------------------start of Past Trips ----------------------------------------------------------------

app.get('/api/admin/trip-history', (req, res) => {
  const vendorId = req.query.vendorId;

  let query = `
    SELECT 
      tm.TripID,
      ANY_VALUE(tm.TotalDistance) AS TotalDistance,
      ANY_VALUE(tm.TotalCost) AS TotalCost,
      ANY_VALUE(tm.TripDate) AS TripDate,
      ANY_VALUE(tm.TripStatus) AS TripStatus,
      ANY_VALUE(c.ClientName) AS ClientName,
      ANY_VALUE(so.SubOfficeName) AS SubOfficeName,
      ANY_VALUE(u.Name) AS DriverName,
      ANY_VALUE(v.VehicleNumber) AS VehicleNumber,
      ANY_VALUE(t.PickupLocation) AS PickupLocation,
      ANY_VALUE(t.DropLocation) AS DropLocation,
      ANY_VALUE(t.TripType) AS TripType,
      ANY_VALUE(t.VehicleType) AS VehicleType,
      ANY_VALUE(t.StartTime) AS StartTime,
      ANY_VALUE(t.EndTime) AS EndTime,
      COALESCE(MAX(p.PaymentStatus), 'Not Paid') AS PaymentStatus
    FROM TripManagement tm
    JOIN Trips t ON t.TripID = tm.TripID
    JOIN Clients c ON c.ClientID = tm.ClientID
    LEFT JOIN ClientSubOffices so ON so.SubOfficeID = tm.SubOfficeID
    LEFT JOIN Drivers d ON d.DriverID = tm.DriverID
    LEFT JOIN Users u ON u.UserID = d.UserID
    JOIN Vehicles v ON v.VehicleID = d.VehicleID
    LEFT JOIN payments p ON p.TripID = tm.TripID
    WHERE tm.TripStatus = 'Completed'
  `;

  const params = [];

  if (vendorId) {
    query += " AND tm.VendorID = ?";
    params.push(vendorId);
  }

  query += " GROUP BY tm.TripID ORDER BY tm.TripID DESC";

  db.query(query, params, (error, results) => {
    if (error) {
      console.error("Error fetching trip history:", error);
      return res.status(500).json({ error: 'Database query failed', details: error });
    }

    res.json(results);
  });
});



//-------------------------------------------End of past Trips -----------------------------------------------------------






//-------------------------------------------Start of Notfication----------------------------------------------------------------

app.post('/api/send-message-to-vendor', (req, res) => {
  const { vendorID, subject, message } = req.body;

  if (!vendorID || !message) {
    return res.status(400).json({ error: 'Vendor ID and message are required' });
  }

  const query = 'INSERT INTO VendorMessages (VendorID, Subject, Message) VALUES (?, ?, ?)';
  db.query(query, [vendorID, subject, message], (err, result) => {
    if (err) {
      console.error('Error sending message:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  });
});

app.get('/api/admin/vendor-messages', (req, res) => {
  const query = `
    SELECT vm.*, v.VendorName
    FROM VendorMessages vm
    JOIN Vendors v ON vm.VendorID = v.VendorID
    ORDER BY vm.SentAt DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching vendor messages:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
    res.json({ success: true, messages: result });
  });
});



//-------------------------------------------End of Notification -----------------------------------------------------------



//-------------------------------------------Start of Sub-Office -----------------------------------------------------------


// 1. List sub‑offices (with client name)
app.get('/api/vendor/suboffices', (req, res) => {
  const vendorID = req.query.vendorid;
  console.log("Received VendorID for sub-offices:", vendorID);

  if (!vendorID) {
    return res.status(400).json({ error: 'VendorID is required' });
  }

  const sql = `
    SELECT so.SubOfficeID, so.SubOfficeName, so.Address,
           so.ContactPersonName, so.ContactPersonEmail, so.ContactPersonPhone,
           so.ClientID, c.ClientName
      FROM ClientSubOffices so
      JOIN Clients c ON c.ClientID = so.ClientID
     WHERE c.VendorID = ?
     ORDER BY so.SubOfficeID
  `;

  db.query(sql, [vendorID], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// 2. Create
app.post('/api/vendor/suboffices', (req, res) => {
  const { ClientID, SubOfficeName, Address, ContactPersonName, ContactPersonEmail, ContactPersonPhone } = req.body;
  const sql = `
    INSERT INTO ClientSubOffices
      (ClientID, SubOfficeName, Address, ContactPersonName, ContactPersonEmail, ContactPersonPhone)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [ClientID, SubOfficeName, Address, ContactPersonName, ContactPersonEmail, ContactPersonPhone], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ SubOfficeID: result.insertId });
  });
});

// 3. Update
app.put('/api/vendor/suboffices/:id', (req, res) => {
  const { id } = req.params;
  const { ClientID, SubOfficeName, Address, ContactPersonName, ContactPersonEmail, ContactPersonPhone } = req.body;
  const sql = `
    UPDATE ClientSubOffices
       SET ClientID=?, SubOfficeName=?, Address=?, ContactPersonName=?, ContactPersonEmail=?, ContactPersonPhone=?
     WHERE SubOfficeID=?
  `;
  db.query(sql, [ClientID, SubOfficeName, Address, ContactPersonName, ContactPersonEmail, ContactPersonPhone, id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 4. Delete
app.delete('/api/vendor/suboffices/:id', (req, res) => {
  db.query('DELETE FROM ClientSubOffices WHERE SubOfficeID=?', [req.params.id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// 5. Get all clients (filtered by VendorID if present)
app.get('/api/vendor/clients', (req, res) => {
  const vendorID = req.query.vendorid;
  console.log("Received vendorID:", vendorID);

  if (!vendorID) {
    return res.status(400).json({ error: 'VendorID is required' });
  }

  const sql = 'SELECT * FROM Clients WHERE VendorID = ?';
  db.query(sql, [vendorID], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});




//-------------------------------------------End of Sub-Office -----------------------------------------------------------


//-------------------------------------------Start of Admin Dashboard---------------------------------------------------------------

app.get('/api/admin/admin-dashboard', (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
  }

  const query = `
    SELECT 
  (SELECT COUNT(*) FROM Drivers) AS driverCount,
  (SELECT COUNT(*) FROM Vehicles) AS vehicleCount,
  (SELECT COUNT(*) FROM Vendors) AS vendorCount,
  (SELECT COUNT(*) FROM TripManagement WHERE TripStatus IN ('Requested', 'Assigned', 'InProgress')) AS bookingCount,
  (SELECT COUNT(*) FROM TripManagement WHERE TripStatus = 'Requested') AS pendingBookings,
  (SELECT COUNT(*) FROM TripManagement WHERE TripStatus = 'Completed') AS paidBookings;

  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch stats', error: err });
    }

    const stats = {
      driverCount: results[0].driverCount,
      vehicleCount: results[0].vehicleCount,
      vendorCount: results[0].vendorCount,
      bookingCount: results[0].bookingCount,
      pendingBookings: results[0].pendingBookings,
      paidBookings: results[0].paidBookings,
      vehicleStatusSummary: {
        moving: results[0].movingVehicles,
        idle: results[0].idleVehicles,
        stopped: results[0].stoppedVehicles,
        inactive: results[0].inactiveVehicles,
      },
    };

    res.json(stats);
  });
});


//--------------------------------------------------End of Admin Dashboard-------------------------------------------------------------------------


//-------------------------------------------------------Start of Driver Managing--------------------------------------------

// Route to get the list of drivers
app.get('/api/admin/drivers', (req, res) => {
  const query = `
  SELECT d.DriverID, u.Name, u.EmployeeID, d.LicenseNumber, d.ContactNumber, 
    d.OngoingTraining, d.PoliceVerificationDoneDate, d.Status, 
   COUNT(t.TripID) AS TotalTrips
  FROM Drivers d
  LEFT JOIN Users u ON d.UserID = u.UserID
  LEFT JOIN TripManagement t ON d.DriverID = t.DriverID
  GROUP BY d.DriverID;
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching drivers:', err);
      return res.status(500).json({ error: 'Error fetching drivers' });
    }
    res.json(results);
  });
});

// Route to deactivate a driver
app.post('/api/deactivate-driver/:id', (req, res) => {
  const driverId = req.params.id;

  const query = 'UPDATE Drivers SET Status = "Unavailable" WHERE DriverID = ?';
  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error('Error deactivating driver:', err);
      return res.status(500).json({ error: 'Error deactivating driver' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver deactivated successfully' });
  });
});


// Route to activate a driver
app.post('/api/activate-driver/:id', (req, res) => {
  const driverId = req.params.id;

  const query = 'UPDATE Drivers SET Status = "Available" WHERE DriverID = ?';
  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error('Error activating driver:', err);
      return res.status(500).json({ error: 'Error activating driver' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver activated successfully' });
  });
});


//Assign Vehicle
app.post('/api/assign-vehicle', (req, res) => {
  const { driverId, vehicleId } = req.body;

  // First query to update the driver's vehicle ID in the Drivers table
  db.query('UPDATE Drivers SET VehicleID = ? WHERE DriverID = ?', [vehicleId, driverId], (err, results) => {
    if (err) {
      console.error('Error updating driver:', err);
      return res.status(500).json({ error: 'Error updating driver' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if there's an existing entry in the VehicleUtilization table
    db.query(
      'SELECT * FROM VehicleUtilization WHERE DriverID = ?',
      [driverId],
      (err, utilResults) => {
        if (err) {
          console.error('Error checking VehicleUtilization:', err);
          return res.status(500).json({ error: 'Error checking VehicleUtilization' });
        }

        if (utilResults.length > 0) {
          // If there's already an entry, update the existing one
          db.query(
            'UPDATE VehicleUtilization SET VehicleID = ?, VehicleStatus = ?, ShiftDate = NOW() WHERE DriverID = ?',
            [vehicleId, 'Assigned', driverId],
            (err, updateResults) => {
              if (err) {
                console.error('Error updating VehicleUtilization:', err);
                return res.status(500).json({ error: 'Error updating VehicleUtilization' });
              }

              res.status(200).json({ message: 'Vehicle assigned successfully' });
            }
          );
        } else {
          // If no entry exists, insert a new one
          db.query(
            'INSERT INTO VehicleUtilization (DriverID, VehicleID, VehicleStatus, ShiftDate) VALUES (?, ?, ?, NOW())',
            [driverId, vehicleId, 'Assigned'],
            (err, insertResults) => {
              if (err) {
                console.error('Error inserting into VehicleUtilization:', err);
                return res.status(500).json({ error: 'Error assigning vehicle' });
              }

              res.status(200).json({ message: 'Vehicle assigned successfully' });
            }
          );
        }
      }
    );
  });
});

// Unassign a vehicle from a driver
app.put('/api/:driverId/unassign-vehicle', (req, res) => {
  const driverId = req.params.driverId;

  // Step 1: Check if the driver exists and has a vehicle assigned
  db.query('SELECT VehicleID FROM Drivers WHERE DriverID = ?', [driverId], (err, driverResults) => {
    if (err) {
      console.error('Error checking driver:', err);
      return res.status(500).json({ error: 'Error checking driver' });
    }

    if (driverResults.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const vehicleId = driverResults[0].VehicleID;

    if (!vehicleId) {
      return res.status(400).json({ error: 'No vehicle assigned to this driver' });
    }

    // Step 2: Remove vehicle assignment from driver
    db.query('UPDATE Drivers SET VehicleID = NULL WHERE DriverID = ?', [driverId], (err, updateResults) => {
      if (err) {
        console.error('Error unassigning vehicle from driver:', err);
        return res.status(500).json({ error: 'Error unassigning vehicle from driver' });
      }

      // Step 3: Update VehicleUtilization
      db.query(
        'UPDATE VehicleUtilization SET VehicleStatus = ?, ShiftDate = NOW() WHERE DriverID = ?',
        ['Available', driverId],
        (err, utilUpdateResults) => {
          if (err) {
            console.error('Error updating VehicleUtilization:', err);
            return res.status(500).json({ error: 'Error updating VehicleUtilization' });
          }

          res.status(200).json({ message: 'Vehicle unassigned successfully' });
        }
      );
    });
  });
});


// Fetch all vehicles
// Endpoint to fetch all vehicles except those with 'Assigned' status
app.get('/api/vehicles/available', async (req, res) => {
  const query = `
    SELECT 
      v.VehicleID, 
      v.VehicleNumber, 
      v.TypeOfVehicle,
      ve.VendorName
    FROM 
      Vehicles v
    LEFT JOIN 
      VehicleUtilization vu ON v.VehicleID = vu.VehicleID
    LEFT JOIN 
      Vendors ve ON v.VendorID = ve.VendorID
    WHERE 
      vu.VehicleStatus != 'Assigned' OR vu.VehicleStatus IS NULL
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching vehicles:', err);
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }

    res.status(200).json(results);
  });
});



// Endpoint to fetch driver profile
app.get('/api/drivers/:driverId', (req, res) => {
  const { driverId } = req.params;

  // Query to fetch the driver's basic details
  const driverQuery = `
     SELECT 
  d.DriverID, 
  u.Name, 
  u.EmployeeID, 
  u.Email, 
  d.LicenseNumber, 
  d.ContactNumber, 
  d.PoliceVerificationDoneDate, 
  d.CreatedAt, 
  dp.VehicleType, 
  dp.RatePerKm, 
  dp.RatePerHour, 
  dp.MinimumKm, 
  dp.BaseRate, 
  dp.BataPerDay,
  (
    SELECT COUNT(*) 
    FROM TripManagement t 
    WHERE t.DriverID = d.DriverID AND t.TripStatus = 'Completed'
  ) AS TotalTrips
FROM Drivers d
LEFT JOIN Users u ON d.UserID = u.UserID
LEFT JOIN DriverPaymentRates dp ON d.DriverID = dp.DriverID
WHERE d.DriverID = ?
  `;

  db.query(driverQuery, [driverId], (err, driverResults) => {
    if (err) {
      console.error('Error fetching driver:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    if (driverResults.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driver = driverResults[0];

    // Fetch Documents
    const docsQuery = `
          SELECT DocumentID, DocumentType, DocumentNumber, IssueDate, ExpiryDate, DocumentFile
          FROM DriverDocuments
          WHERE DriverID = ?
      `;

    db.query(docsQuery, [driverId], (err, docsResults) => {
      if (err) {
        console.error('Error fetching driver documents:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }

      // Prepare Documents with full URL
      const documents = docsResults.map(doc => ({
        id: doc.DocumentID,
        name: doc.DocumentType,
        number: doc.DocumentNumber,
        issueDate: doc.IssueDate,
        expiryDate: doc.ExpiryDate,
        url: `http://localhost:5000/uploads/${doc.DocumentFile}`, // Full URL
      }));

      // Extract License document if available
      const licenseDoc = documents.find(doc => doc.name === 'License');
      driver.IssueDate = licenseDoc ? licenseDoc.issueDate : null;
      driver.ExpiryDate = licenseDoc ? licenseDoc.expiryDate : null;

      // Now fetch assigned vehicles
      const vehiclesQuery = `
        SELECT v.VehicleID, v.VehicleNumber, v.TypeOfVehicle, vu.VehicleStatus
        FROM Vehicles v
        JOIN VehicleUtilization vu ON v.VehicleID = vu.VehicleID
        WHERE vu.DriverID = ?
      `;

      db.query(vehiclesQuery, [driverId], (err, vehiclesResults) => {
        if (err) {
          console.error('Error fetching assigned vehicles:', err);
          return res.status(500).json({ error: 'Database query failed' });
        }

        //Fetch Payment Rates
        const paymentQuery = `
        SELECT dp.VehicleType, dp.RatePerKm, dp.RatePerHour, dp.MinimumKm, dp.BaseRate, dp.BataPerDay
        FROM DriverPaymentRates dp
        JOIN  Drivers d ON dp.driverID = d.DriverID
        WHERE d.DriverID = ?`;

        db.query(paymentQuery, [driverId], (err, paymentResults) => {
          if (err) {
            console.error('Error fetching Payment Details:', err);
            return res.status(500).json({ error: 'Database query failed' });
          }


          // Now fetch trips
          const tripsQuery = `
        SELECT 
          tm.TripID, 
          c.ClientName, 
          t.PickupLocation, 
          t.DropLocation, 
          tm.TripStatus
        FROM 
          TripManagement tm
        JOIN 
          Clients c ON tm.ClientID = c.ClientID
        JOIN 
          Trips t ON tm.TripID = t.TripID
        WHERE 
          tm.DriverID = ? AND tm.TripStatus = 'Completed'
      `;

          db.query(tripsQuery, [driverId], (err, tripsResults) => {
            if (err) {
              console.error('Error fetching trips:', err);
              return res.status(500).json({ error: 'Database query failed' });
            }

            // Final Response
            res.json({
              ...driver,
              Documents: documents,
              AssignedVehicles: vehiclesResults,
              PaymentDetails: paymentResults,
              Trips: tripsResults,
            });
          });
        });
      });
    });
  });
});

// GET /api/drivers/:driverId/vehicle-type
app.get('/api/drivers/:driverId/vehicle-type', (req, res) => {
  const { driverId } = req.params;

  const query = `
    SELECT v.TypeOfVehicle 
    FROM vehicles v
    JOIN vehicleutilization vu ON vu.VehicleID = v.VehicleID
    WHERE vu.DriverID = ? AND vu.VehicleStatus = 'Assigned'
    LIMIT 1
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No assigned vehicle found for this driver' });
    }
    res.json({ vehicleType: results[0].TypeOfVehicle });
  });
});

app.post('/api/driver-payment-rates', (req, res) => {
  const {
    VehicleType,
    RatePerKm,
    RatePerHour,
    MinimumKm,
    BaseRate,
    BataPerDay,
    DriverID
  } = req.body;

  const sql = `
    INSERT INTO DriverPaymentRates 
    (VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, BataPerDay,DriverID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, BataPerDay, DriverID], (err, result) => {
    if (err) {
      console.error('Error inserting driver payment rate:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(201).json({ message: 'Payment rate added successfully' });
  });
});

app.get('/api/driver-payment-rates/:driverId', (req, res) => {
  const { driverId } = req.params;

  const sql = `
    SELECT * FROM DriverPaymentRates 
    WHERE DriverID = ?
    LIMIT 1
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching payment rate:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(200).json({}); // return empty object if no data
    }
    return res.status(200).json(results[0]);
  });
});

app.put('/api/driver-payment-rates', (req, res) => {
  const {
    VehicleType,
    RatePerKm,
    RatePerHour,
    MinimumKm,
    BaseRate,
    BataPerDay,
    DriverID
  } = req.body;

  const sql = `
    UPDATE DriverPaymentRates 
    SET VehicleType = ?, RatePerKm = ?, RatePerHour = ?, MinimumKm = ?, BaseRate = ?, BataPerDay = ?
    WHERE DriverID = ?
  `;

  db.query(sql, [VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, BataPerDay, DriverID], (err, result) => {
    if (err) {
      console.error('Error updating driver payment rate:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No matching driver payment rate found' });
    }
    return res.status(200).json({ message: 'Payment rate updated successfully' });
  });
});





//------------------------------------------------------------End of Driver Managing--------------------------------------------------------

//-----------------------------------------------------------Start of Vehicle Managing----------------------------------------------------------------

// Fetch all vehicles
app.get('/api/manage-vehicles', (req, res) => {
  const query = `
    SELECT * FROM Vehicles
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }
    res.status(200).json(results);
  });
});

// GET /api/vendors
app.get('/api/vehicles/vendors', async (req, res) => {
  const query = `
  SELECT VendorID, VendorName FROM Vendors
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }
    res.status(200).json(results);
  });
});



// Add new vehicle
app.post('/api/manage-vehicles', (req, res) => {
  const { typeOfVehicle, vehicleMake, vehicleModel, vehicleNumber, vendorID, fitnessCertificateExpiry, rcExpiryDate, taxExpiryDate, insuranceExpiryDate } = req.body;

  if (!typeOfVehicle || !vehicleNumber) {
    return res.status(400).json({ error: 'Vehicle type and vehicle number are required' });
  }

  const query = `
    INSERT INTO Vehicles (TypeOfVehicle, VehicleMake, VehicleModel, VehicleNumber, VendorID, FitnessCertificateExpiry, RCExpiryDate, TaxExpiryDate, InsuranceExpiryDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [typeOfVehicle, vehicleMake, vehicleModel, vehicleNumber, vendorID, fitnessCertificateExpiry, rcExpiryDate, taxExpiryDate, insuranceExpiryDate], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error adding new vehicle' });
    }
    res.status(201).json({ message: 'Vehicle added successfully', vehicleID: result.insertId });
  });
});

// Update vehicle details
app.put('/api/manage-vehicles/:vehicleID', (req, res) => {
  const { vehicleID } = req.params;
  const { typeOfVehicle, vehicleMake, vehicleModel, vehicleNumber, vendorID, fitnessCertificateExpiry, rcExpiryDate, taxExpiryDate, insuranceExpiryDate } = req.body;

  const query = `
    UPDATE Vehicles
    SET TypeOfVehicle = ?, VehicleMake = ?, VehicleModel = ?, VehicleNumber=?, VendorID=?, FitnessCertificateExpiry = ?, RCExpiryDate = ?, TaxExpiryDate = ?, InsuranceExpiryDate = ?
    WHERE VehicleID = ?
  `;

  db.query(query, [typeOfVehicle, vehicleMake, vehicleModel, vehicleNumber, vendorID, fitnessCertificateExpiry, rcExpiryDate, taxExpiryDate, insuranceExpiryDate, vehicleID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error updating vehicle details' });
    }
    res.status(200).json({ message: 'Vehicle details updated successfully' });
  });
});

// Delete a vehicle
app.delete('/api/manage-vehicles/:vehicleID', (req, res) => {
  const { vehicleID } = req.params;

  const query = `
    DELETE FROM Vehicles WHERE VehicleID = ?
  `;

  db.query(query, [vehicleID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error deleting vehicle' });
    }
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  });
});



// Get all price lists with vendor names
app.get('/api/manage-pricelists', (req, res) => {
  const query = `
    SELECT p.*, v.VendorName 
    FROM pricelists p
    LEFT JOIN vendors v ON p.VendorID = v.VendorID
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});


// Get unique vehicle types
app.get('/api/manage-vehicle-types', (req, res) => {
  db.query('SELECT DISTINCT TypeOfVehicle FROM vehicles', (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// Add price list
app.post('/api/manage-pricelists', (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO pricelists 
    (VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, WaitingChargePerHour, NightCharge, VendorID) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [
    data.vehicleType,
    data.ratePerKm,
    data.ratePerHour,
    data.minimumKm,
    data.baseRate,
    data.waitingChargePerHour,
    data.nightCharge,
    data.vendorId  // make sure this is sent from frontend
  ], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Price list added successfully' });
  });
});


// Update price list
app.put('/api/manage-pricelists/:id', (req, res) => {
  const data = req.body;
  db.query(`
    UPDATE pricelists SET 
    VehicleType=?, RatePerKm=?, RatePerHour=?, MinimumKm=?, BaseRate=?, WaitingChargePerHour=?, NightCharge=?, VendorID=? 
    WHERE PriceListID=?`,
    [
      data.vehicleType,
      data.ratePerKm,
      data.ratePerHour,
      data.minimumKm,
      data.baseRate,
      data.waitingChargePerHour,
      data.nightCharge,
      data.vendorId,
      req.params.id
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Price list updated successfully' });
    });
});


// Delete price list
app.delete('/api/manage-pricelists/:id', (req, res) => {
  db.query('DELETE FROM pricelists WHERE PriceListID = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Price list deleted successfully' });
  });
});

// Get all vendors
app.get('/api/pricelist/vendors', (req, res) => {
  const query = 'SELECT VendorID, VendorName FROM vendors';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching vendors:', err);
      return res.status(500).send({ error: 'Failed to fetch vendors' });
    }
    res.json(result);
  });
});



//-------------------------------------------End of Vehicle Manage-------------------------------------------------------

//-------------------------------------------Start of Vendor Manage-------------------------------------------------------

// Add new vendor
app.post('/api/admin/managevendors', (req, res) => {
  const {
    VendorName, VendorNumber, ContactPersonName, ContactPersonEmail, ContactPersonPhone,
    Name, Email, Password
  } = req.body;

  const insertUser = `
    INSERT INTO users (Name, Email, Password, Role) VALUES (?, ?, ?, 'Vendor')
  `;
  db.query(insertUser, [Name, Email, Password], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const newUserID = result.insertId;
    const insertVendor = `
      INSERT INTO vendors (VendorName, VendorNumber, ContactPersonName, ContactPersonEmail, ContactPersonPhone, UserID)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      insertVendor,
      [VendorName, VendorNumber, ContactPersonName, ContactPersonEmail, ContactPersonPhone, newUserID],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Vendor added successfully' });
      }
    );
  });
});

// Get all vendors
app.get('/api/admin/managevendors', (req, res) => {
  const query = `
    SELECT v.*, u.Name as UserName, u.Email, u.Password
    FROM vendors v
    JOIN users u ON v.UserID = u.UserID
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Update vendor (only vendor fields)
app.put('/api/admin/managevendors/:id', (req, res) => {
  const vendorID = req.params.id;
  const { VendorName, VendorNumber, ContactPersonName, ContactPersonEmail, ContactPersonPhone } = req.body;

  const query = `
    UPDATE vendors SET VendorName=?, VendorNumber=?, ContactPersonName=?, ContactPersonEmail=?, ContactPersonPhone=? 
    WHERE VendorID=?
  `;
  db.query(query, [VendorName, VendorNumber, ContactPersonName, ContactPersonEmail, ContactPersonPhone, vendorID], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vendor updated successfully' });
  });
});

// Delete vendor AND associated user
app.delete('/api/admin/managevendors/:id', (req, res) => {
  const vendorID = req.params.id;

  // First get the UserID
  db.query('SELECT UserID FROM vendors WHERE VendorID = ?', [vendorID], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const userID = results[0].UserID;

    // Delete from vendors table
    db.query('DELETE FROM vendors WHERE VendorID = ?', [vendorID], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Delete from users table
      db.query('DELETE FROM users WHERE UserID = ?', [userID], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ message: 'Vendor and associated user deleted successfully' });
      });
    });
  });
});




//-------------------------------------------End of Vendor Manage-------------------------------------------------------

//------------------------------------------Start of live tracking-------------------------------------------------------
app.get('/api/admin/assigned-drivers', (req, res) => {
  const query = `
    SELECT 
      d.DriverID, u.Name AS DriverName, 
      v.VehicleID, v.VehicleNumber 
    FROM Drivers d
    JOIN Users u ON d.UserID = u.UserID
    JOIN Vehicles v ON d.VehicleID = v.VehicleID
    WHERE d.Status = 'Assigned';
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching assigned drivers:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/admin/livetracking/:vehicleId', (req, res) => {
  const { vehicleId } = req.params;

  const query = `
    SELECT lt.CurrentLocation, lt.Latitude, lt.Longitude, lt.TrackingTime
    FROM LiveTracking lt
    JOIN TripManagement tm ON lt.TripID = tm.TripID
    WHERE tm.VehicleID = ?
    ORDER BY lt.TrackingTime DESC
    LIMIT 1;
  `;

  db.query(query, [vehicleId], (err, results) => {
    if (err) {
      console.error('Error fetching live location:', err);
      return res.status(500).json({ message: 'Error fetching tracking info' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No tracking data available' });
    }
    res.json(results[0]);
  });
});



//-----------------------------------------------------End of live tracking-----------------------------------------------------

//-----------------------------------------------------Start of client-----------------------------------------------------

app.get('/api/dashboard/:clientId', async (req, res) => {
  try {
    const clientId = req.params.clientId;

    const activeTripsResult = await db.query(
      "SELECT COUNT(*) as count FROM tripmanagement WHERE ClientID = ? AND TripStatus IN ('Requested', 'Assigned', 'InProgress')",
      [clientId]
    );
    const completedTripsResult = await db.query(
      "SELECT COUNT(*) as count FROM tripmanagement WHERE ClientID = ? AND TripStatus = 'Completed'",
      [clientId]
    );
    const totalVehiclesResult = await db.query(
      "SELECT COUNT(DISTINCT VehicleID) as count FROM tripmanagement WHERE ClientID = ?",
      [clientId]
    );

    res.json({
      activeTrips: activeTripsResult[0].count,
      completedTrips: completedTripsResult[0].count,
      totalVehiclesUsed: totalVehiclesResult[0].count
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



//-----------------------------------------------------
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DRIVER LOGIN
app.post('/api/driver/login', (req, res) => {
  const { email, password } = req.body;

  // Validate input fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Query the user credentials
  const loginQuery = `
    SELECT u.UserID, u.Email, u.Password, u.Role, d.DriverID, d.LicenseNumber, d.ContactNumber, d.Status
    FROM users u
    JOIN drivers d ON u.UserID = d.UserID
    WHERE u.Email = ?
  `;

  db.query(loginQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error: ' + err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare the password (in plain text)
    if (password !== user.Password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Successful login, return the driver data
    res.json({
      success: true,
      driverData: {
        driverID: user.DriverID,
        name: user.Name,
        email: user.Email,
        licenseNumber: user.LicenseNumber,
        contactNumber: user.ContactNumber,
        status: user.Status,
      },
    });
  });
});


// DRIVER REGISTER
app.post('/api/driver/register', (req, res) => {
  const { name, email, password, licenseNumber, contactNumber } = req.body;

  // Validate input fields
  if (!name || !email || !password || !licenseNumber || !contactNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if the email already exists
  const checkEmailQuery = 'SELECT * FROM users WHERE Email = ?';
  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error: ' + err.message });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Insert user information into the users table (without password hashing)
    const userQuery = `
      INSERT INTO users (Name, Email, Password, Role)
      VALUES (?, ?, ?, 'Driver')
    `;

    db.query(userQuery, [name, email, password], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error inserting user data: ' + err.message });
      }

      const userID = result.insertId; // Get the newly inserted UserID

      // Insert driver-specific data into the drivers table
      const driverQuery = `
        INSERT INTO drivers (UserID, LicenseNumber, ContactNumber, Status)
        VALUES (?, ?, ?, 'Available')
      `;

      db.query(driverQuery, [userID, licenseNumber, contactNumber], (err2, result2) => {
        if (err2) {
          return res.status(500).json({ error: 'Error inserting driver data: ' + err2.message });
        }

        // Return success response
        res.json({
          success: true,
          message: 'Registration successful!',
        });
      });
    });
  });
});


// DRIVER FORGOT PASSWORD
app.post('/api/driver/forgot-password', (req, res) => {
  const { email, newPassword } = req.body;
  db.query('SELECT * FROM user_credentials WHERE Email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Query error' });
    if (results.length === 0) return res.status(404).json({ message: 'Email not found' });

    db.query('UPDATE user_credentials SET Password = ? WHERE Email = ?', [newPassword, email], (err2) => {
      if (err2) return res.status(500).json({ error: 'Password update failed' });
      res.json({ success: true, message: 'Password updated' });
    });
  });
});

app.get('/api/driver/:driverId/profile', (req, res) => {
  const driverId = req.params.driverId;
  console.log('Fetching profile for driver:', driverId);

  const sql = `
    SELECT u.Name, u.Email, d.ContactNumber, d.LicenseNumber
    FROM drivers d
    JOIN users u ON d.UserID = u.UserID
    WHERE d.DriverID = ?
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('Profile results:', results);

    if (results.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ profile: results[0] });
  });
});


app.get('/api/driver/:driverId/earnings', (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT COALESCE(SUM(Amount), 0) AS totalEarnings
    FROM driver_earnings
    WHERE DriverID = ? AND PaymentStatus = 'Paid'
      AND PaymentDate = CURDATE()
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ totalEarnings: results[0].totalEarnings });
  });
});

app.get('/api/driver/:driverId/trips', (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT td.PickupLocation, td.DropLocation
    FROM tripmanagement tm
    JOIN trips td ON tm.TripID = td.TripID
    WHERE tm.DriverID = ? AND tm.TripStatus IN ('Assigned')
    ORDER BY tm.TripDate ASC
    LIMIT 5
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ trips: results });
  });
});

app.get('/api/driver/:driverId/vehicle', (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT v.VehicleID, v.VehicleNumber, v.VehicleMake, v.VehicleModel, v.TypeOfVehicle
    FROM drivers d
    JOIN vehicles v ON d.VehicleID = v.VehicleID
    WHERE d.DriverID = ?
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Database error fetching vehicle:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No vehicle assigned to this driver.' });
    }

    res.json({ vehicle: results[0] });
  });
});

app.get('/api/driver/:driverId/weekly-overview', (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT 
      DATE(PaymentDate) AS date, 
      SUM(Amount) AS total
    FROM driver_earnings
    WHERE DriverID = ? 
      AND PaymentStatus = 'Paid'
      AND YEARWEEK(PaymentDate, 1) = YEARWEEK(CURDATE(), 1)
    GROUP BY DATE(PaymentDate)
    ORDER BY DATE(PaymentDate)
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching weekly overview:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ overview: results });
  });
});

app.get('/api/driver/:driverId/view-trips', (req, res) => {
  const driverId = req.params.driverId;  // This should correctly retrieve the driverId from the URL

  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID is required' });  // Handle case if driverId is missing in URL
  }

  // Query to fetch trips assigned to the driver
  const sql = `
   SELECT 
  tm.TripID, 
  tm.TripDate AS Date, 
  t.PickupLocation, 
  t.DropLocation, 
  t.TripType, 
  c.ClientName, 
  tm.TripStatus AS Status
FROM tripmanagement tm
JOIN trips t ON tm.TripID = t.TripID
JOIN clients c ON tm.ClientID = c.ClientID
WHERE tm.TripStatus IN ('Assigned', 'InProgress') AND tm.DriverID = ?
ORDER BY tm.TripDate DESC
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching trips:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return the trips data
    res.json({ trips: results });
  });
});


// Haversine formula utilities
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// OpenCage API call
async function getCoordinates(address) {
  const apiKey = '8b99b6eb9caa4699968550cce9456cf9'; // Replace with real key
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await axios.get(url);
  const location = response.data.results[0]?.geometry;
  return location ? { lat: location.lat, lon: location.lng } : null;
}

// PUT: Update Trip Status
// PUT: Update Trip Status and process trip if Completed
app.put('/api/trips/:tripId/status', async (req, res) => {
  const tripId = req.params.tripId;
  const { status } = req.body;

  if (!['InProgress', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    // Update trip status
    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE tripmanagement SET TripStatus = ? WHERE TripID = ?`,
        [status, tripId],
        (err, result) => (err ? reject(err) : resolve())
      );
    });

    // Fetch pickup and drop locations
    const tripInfo = await new Promise((resolve, reject) => {
      db.query(
        `SELECT PickupLocation, DropLocation FROM trips WHERE TripID = ?`,
        [tripId],
        (err, results) => {
          if (err) return reject(err);
          if (results.length === 0) return reject(new Error('Trip not found'));
          resolve(results[0]);
        }
      );
    });

    const pickupCoords = await getCoordinates(tripInfo.PickupLocation);
    const dropCoords = await getCoordinates(tripInfo.DropLocation);

    if (!pickupCoords || !dropCoords) {
      return res.status(400).json({ error: 'Unable to fetch coordinates' });
    }

    const distance = getDistanceFromLatLonInKm(
      pickupCoords.lat,
      pickupCoords.lon,
      dropCoords.lat,
      dropCoords.lon
    ).toFixed(2); // Total distance in kilometers

    // If trip is not completed, return here
    if (status !== 'Completed') {
      return res.json({ success: true, message: `Trip marked as ${status}` });
    }

    // Get driver for earnings calculation
    const { DriverID } = await new Promise((resolve, reject) => {
      db.query(
        `SELECT DriverID FROM tripmanagement WHERE TripID = ?`,
        [tripId],
        (err, result) => {
          if (err || result.length === 0) return reject(err || new Error('Trip not found'));
          resolve(result[0]);
        }
      );
    });

    // Fetch driver payment rates
    const { BaseRate, RatePerKM } = await new Promise((resolve, reject) => {
      db.query(
        `SELECT BaseRate, RatePerKM FROM driverpaymentrates WHERE DriverID = ?`,
        [DriverID],
        (err, results) => {
          if (err || results.length === 0) return reject(err || new Error('Driver rates not found'));
          resolve(results[0]);
        }
      );
    });

    const baseRate = parseFloat(BaseRate || 0);
    const ratePerKm = parseFloat(RatePerKM || 0);
    const totalCost = baseRate + ratePerKm * parseFloat(distance);

    if (isNaN(totalCost)) {
      return res.status(400).json({ error: 'Invalid cost calculation' });
    }

    // Insert earnings directly without needing TotalDistance in tripmanagement
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO driver_earnings (DriverID, TripID, Amount) VALUES (?, ?, ?)`,
        [DriverID, tripId, totalCost.toFixed(2)],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Update trip end time
    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE trips SET EndTime = CURDATE() WHERE TripID = ?`,
        [tripId],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Mark driver as available
    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE drivers SET Status = 'Available' WHERE DriverID = ?`,
        [DriverID],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Final success response
    res.json({
      success: true,
      message: 'Trip completed, earnings updated, driver marked available',
      driverId: DriverID,
      distance: `${distance} km`,
      earnings: totalCost.toFixed(2),
    });
  } catch (err) {
    console.error('Error in trip update:', err.message);
    res.status(500).json({ error: 'Failed to update trip status or related data' });
  }
});


// GET /api/drivers/:driverId/vehicle
app.get('/api/drivers/:driverId/vehicle', (req, res) => {
  const driverId = req.params.driverId;
  const query = `SELECT VehicleID FROM drivers WHERE DriverID = ?`;

  db.query(query, [driverId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found for driver' });
    }
    res.json({ vehicleId: result[0].VehicleID });
  });
});

app.get('/api/driver/:driverId/active-trip', (req, res) => {
  const driverId = req.params.driverId;
  const query = `SELECT * FROM TripManagement WHERE DriverID = ? AND TripStatus = 'InProgress' LIMIT 1`;

  db.query(query, [driverId], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    if (results.length > 0) {
      res.json({ activeTrip: results[0] });
    } else {
      res.json({ activeTrip: null });
    }
  });
});


// Update or Insert location
app.post('/api/livetracking/update', (req, res) => {
  const { vehicleId, latitude, longitude } = req.body;

  if (!vehicleId || !latitude || !longitude) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  // Check if entry exists for this vehicle
  const checkQuery = 'SELECT * FROM LiveTracking WHERE VehicleID = ?';
  db.query(checkQuery, [vehicleId], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });

    if (results.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE LiveTracking 
        SET Latitude = ?, Longitude = ?, Timestamp = NOW() 
        WHERE VehicleID = ?
      `;
      db.query(updateQuery, [latitude, longitude, vehicleId], (err2) => {
        if (err2) return res.status(500).json({ message: 'Update failed', error: err2 });
        res.json({ message: 'Location updated' });
      });
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO LiveTracking (VehicleID, Latitude, Longitude)
        VALUES (?, ?, ?)
      `;
      db.query(insertQuery, [vehicleId, latitude, longitude], (err3) => {
        if (err3) return res.status(500).json({ message: 'Insert failed', error: err3 });
        res.json({ message: 'Location inserted' });
      });
    }
  });
});

// Get latest location for a vehicle
app.get('/api/livetracking/vehicle/:vehicleId', (req, res) => {
  const vehicleId = req.params.vehicleId;

  const query = `
    SELECT Latitude, Longitude, Timestamp 
    FROM LiveTracking 
    WHERE VehicleID = ?
  `;
  db.query(query, [vehicleId], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    if (results.length === 0) {
      return res.status(404).json({ message: 'No tracking data found' });
    }
    res.json(results[0]);
  });
});




app.get('/api/driver/:driverId/all-trips', (req, res) => {
  const driverId = req.params.driverId;

  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID is required' });
  }

  const sql = `
    SELECT 
      tm.TripID,
      tm.TripDate AS Date,
      t.PickupLocation,
      t.DropLocation,
      t.TripType,
      t.StartTime,
      t.EndTime,
      c.ClientName,
      tm.TripStatus AS Status,
      de.Amount AS Earning,
      de.PaymentStatus
    FROM tripmanagement tm
    JOIN trips t ON tm.TripID = t.TripID
    JOIN clients c ON tm.ClientID = c.ClientID
    LEFT JOIN driver_earnings de ON tm.TripID = de.TripID AND de.DriverID = tm.DriverID
    WHERE tm.TripStatus = 'Completed' AND tm.DriverID = ?
    ORDER BY tm.TripDate DESC
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching driver trips:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.json({ trips: results });
  });
});


// Route 1: Fetch payout history for a driver
app.get('/api/driver/:driverId/payout-history', (req, res) => {
  const driverId = req.params.driverId;

  const sql = `
    SELECT RequestID, Amount, Status, RequestDate
    FROM payout_requests
    WHERE DriverID = ?
    ORDER BY RequestDate DESC
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching payout history:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ payoutHistory: results });
  });
});

// Route 2: Submit a new payout request
app.post('/api/driver/:driverId/payout-request', (req, res) => {
  const driverId = req.params.driverId;
  const { amount } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  const sql = `
    INSERT INTO payout_requests (DriverID, Amount, Status)
    VALUES (?, ?, 'Pending')
  `;

  db.query(sql, [driverId, amount], (err, result) => {
    if (err) {
      console.error('Error inserting payout request:', err);
      return res.status(500).json({ message: 'Could not submit payout request' });
    }

    res.json({ success: true, message: 'Payout request submitted successfully' });
  });
});

app.get('/api/driver/:driverId/pending-earnings', (req, res) => {
  const driverId = req.params.driverId;
  const query = `
    SELECT IFNULL(SUM(Amount), 0) AS totalPending 
    FROM driver_earnings 
    WHERE DriverID = ? AND PaymentStatus = 'Pending'
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching pending earnings:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ success: true, totalPending: results[0].totalPending });
  });
});



// GET Driver Earnings
app.get('/api/driver/:driverId/view-earnings', (req, res) => {
  const { driverId } = req.params;

  const query = `
    SELECT 
      de.TripID, de.Amount, de.PaymentStatus, de.PaymentDate,
      t.StartTime, t.EndTime
    FROM driver_earnings de
    JOIN trips t ON de.TripID = t.TripID
    WHERE de.DriverID = ? AND de.PaymentStatus='Paid'
    ORDER BY de.PaymentDate DESC
    `;

  db.query(query, [driverId], (err, rows) => {
    if (err) {
      console.error('Error fetching earnings:', err);
      return res.status(500).json({ error: 'Server error while fetching earnings' });
    }

    const total = rows.reduce((sum, row) => sum + parseFloat(row.Amount || 0), 0);
    const totalEarnings = total.toFixed(2);

    res.json({
      success: true,
      totalEarnings,
      earnings: rows
    });
  });
});

//============================
// GET: alerts for a driver
//============================

app.get('/api/driver/:driverId/alerts', (req, res) => {
  const { driverId } = req.params;

  const query = `
    SELECT * 
    FROM alerts 
    WHERE DriverID = ?
    ORDER BY AlertTime DESC
  `;

  db.query(query, [driverId], (err, rows) => {
    if (err) {
      console.error('Error fetching alerts:', err);
      return res.status(500).json({ success: false, error: 'Server error while fetching alerts' });
    }

    res.json({
      success: true,
      alerts: rows
    });
  });
});

// POST /api/alerts/driver/send
app.post('/api/alerts/driver/send', (req, res) => {
  const { driverID, alertType, alertDetails, tripID = null, senderType } = req.body;

  if (!driverID || !alertType || !alertDetails) {
    return res.status(400).json({ success: false, message: 'Missing required data' });
  }

  // Verify driver exists and optionally get vendorID if needed
  const queryDriver = 'SELECT driverID FROM drivers WHERE driverID = ?';
  db.query(queryDriver, [driverID], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Insert alert
    const insertAlert = `
      INSERT INTO alerts ( TripID, AlertType, AlertDetails, driverID, senderType)
      VALUES (?, ?, ?, ?, 'Driver')
    `;

    db.query(insertAlert, [tripID, alertType, alertDetails, driverID, senderType], (err2) => {
      if (err2) {
        console.error('Insert alert error:', err2);
        return res.status(500).json({ success: false, message: 'Failed to insert alert' });
      }
      res.json({ success: true, message: 'Alert sent successfully' });
    });
  });
});




// GET DRIVER PROFILE
app.get('/api/driver/:driverId/view-profile', (req, res) => {
  const driverId = req.params.driverId;
  const query = `
    SELECT d.DriverID, u.Name, u.EmployeeID, d.LicenseNumber, d.ContactNumber,
           d.OngoingTraining, d.PoliceVerificationDoneDate, d.Status AS DriverStatus,
           d.CreatedAt, d.UpdatedAt, u.Email
    FROM drivers d
    JOIN users u ON d.UserID = u.UserID
    WHERE d.DriverID = ?`;

  db.query(query, [driverId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Profile query failed' });
    if (rows.length === 0) return res.status(404).json({ message: 'Driver not found' });
    res.json({ success: true, profile: rows[0] });
  });
});

// UPDATE DRIVER PROFILE
// GET: Driver Profile (Enhanced)
// ===========================
app.get('/:driverId/profile', async (req, res) => {
  const { driverId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         d.DriverID,
         u.Name,
         u.EmployeeID,
         d.LicenseNumber,
         d.ContactNumber,
         d.OngoingTraining,
         d.PoliceVerificationDoneDate,
         d.Status AS DriverStatus,
         d.CreatedAt,
         d.UpdatedAt,
         uc.Email
       FROM drivers d
       JOIN users u ON d.UserID = u.UserID
       JOIN user_credentials uc ON uc.UserID = u.UserID
       WHERE d.DriverID = ?`,
      [driverId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      success: true,
      profile: rows[0]
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

// ===========================
// PUT: Update Driver Profile (Enhanced)
// ===========================
app.put('/api/driver/:driverId/profile', (req, res) => {
  const { driverId } = req.params;
  const {
    licenseNumber,
    contactNumber,
    ongoingTraining,
    driverStatus
  } = req.body;

  if (!licenseNumber && !contactNumber && ongoingTraining === undefined && driverStatus === undefined) {
    return res.status(400).json({ message: 'No fields provided for update' });
  }

  // Build dynamic query
  const fields = [];
  const values = [];

  if (licenseNumber) {
    fields.push('LicenseNumber = ?');
    values.push(licenseNumber);
  }

  if (contactNumber) {
    fields.push('ContactNumber = ?');
    values.push(contactNumber);
  }

  if (ongoingTraining !== undefined) {
    fields.push('OngoingTraining = ?');
    values.push(ongoingTraining);
  }

  if (driverStatus !== undefined) {
    fields.push('Status = ?');
    values.push(driverStatus);
  }

  fields.push('UpdatedAt = NOW()');

  const query = `UPDATE drivers SET ${fields.join(', ')} WHERE DriverID = ?`;
  values.push(driverId);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ error: 'Server error while updating profile' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      success: true,
      message: 'Driver profile updated successfully'
    });
  });
});
// ==============================================
// GET: All Documents for a Driver
// ==============================================
// Get all driver documents
app.get('/api/driver/:driverId/documents', (req, res) => {
  const { driverId } = req.params;

  const query = `
    SELECT DocumentID, DocumentType, DocumentNumber, IssueDate, ExpiryDate, DocumentFile, CreatedAt 
    FROM driverdocuments 
    WHERE DriverID = ? 
    ORDER BY CreatedAt DESC
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching documents:', err);
      return res.status(500).json({ success: false, error: 'Server error while fetching documents' });
    }
    res.json({ success: true, documents: results });
  });
});


// Upload a document
app.post('/api/driver/:driverId/upload-document', upload.single('file'), (req, res) => {
  const { driverId } = req.params;
  const { DocumentType, DocumentNumber, IssueDate, ExpiryDate } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'File is required' });
  }

  const query = `
    INSERT INTO driverdocuments 
    (DriverID, DocumentType, DocumentNumber, IssueDate, ExpiryDate, DocumentFile) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [driverId, DocumentType, DocumentNumber, IssueDate, ExpiryDate, file.filename];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ success: false, error: 'Failed to upload document' });
    }
    res.status(201).json({ success: true, message: 'Document uploaded successfully' });
  });
});

// ===========================
// POST: Support Request  

app.post('/api/driver/:driverId/support', (req, res) => {
  const { driverId } = req.params;
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  const query = `
    INSERT INTO support_requests (DriverID, Subject, Message) 
    VALUES (?, ?, ?)
  `;

  db.query(query, [driverId, subject, message], (err, result) => {
    if (err) {
      console.error('Support request error:', err);
      return res.status(500).json({ error: 'Server error while submitting support request' });
    }

    res.status(201).json({ success: true, message: 'Support request submitted successfully' });
  });
});


// ===========================
// GET: Support History
// ===========================
app.get('/api/driver/:driverId/support-history', (req, res) => {
  const { driverId } = req.params;

  const query = `
    SELECT RequestID, Subject, Message, CreatedAt 
    FROM support_requests 
    WHERE DriverID = ? 
    ORDER BY CreatedAt DESC
  `;

  db.query(query, [driverId], (err, rows) => {
    if (err) {
      console.error('Support history error:', err);
      return res.status(500).json({ success: false, error: 'Server error while fetching support history' });
    }

    res.json({ success: true, supportRequests: rows });
  });
});

app.get('/api/driver/:driverId/ratings', (req, res) => {
  const driverId = req.params.driverId;

  const query = `
    SELECT *
    FROM TripRatings
    WHERE DriverID = ?
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching driver ratings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});




//--------------------------------------Vendor ---------------------------------------------------------
app.post('/api/vendor/login', (req, res) => {
  const { email, password } = req.body;

  // Validate input fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Query the user and vendor information
  const loginQuery = `
    SELECT u.UserID, u.Email, u.Password, u.Role, v.VendorID, v.VendorName, v.ContactPersonPhone
    FROM users u
    JOIN vendors v ON u.UserID = v.UserID
    WHERE u.Email = ?
  `;

  db.query(loginQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error: ' + err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare the password (plain-text)
    if (password !== user.Password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Successful login, return vendor data
    res.json({
      success: true,
      vendorData: {
        vendorID: user.VendorID,
        userID: user.UserID,
        email: user.Email,
        companyName: user.VendorName,
        ContactPersonPhone: user.ContactPersonPhone,
        status: user.Status,
      },
    });
  });
});


// Get all drivers under a specific vendor
app.get('/api/vendor/drivers/:vendorId', (req, res) => {
  const vendorId = req.params.vendorId;

  const query = `
    SELECT d.DriverID, u.Name, d.ContactNumber, d.LicenseNumber, d.Status, u.Email,v.VehicleNumber AS AssignedVehicleNumber, 
           v.TypeOfVehicle AS AssignedVehicle
    FROM drivers d
    JOIN users u ON d.UserID = u.UserID
    LEFT JOIN vehicles v ON d.VehicleID = v.VehicleID
    WHERE d.VendorID = ?
  `;

  db.query(query, [vendorId], (err, results) => {
    if (err) {
      console.error('SQL Error:', err); // 👈 Add this
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    res.json({ drivers: results }); // ✅ match frontend expectation
  });
});


app.post('/api/vendor/drivers/add', (req, res) => {
  const { name, empid, email, password, licenseNumber, ongoingTraining, contactNumber, policeVerificationDoneDate, Status, vendorID } = req.body;

  if (!vendorID) {
    return res.status(400).json({ error: 'VendorID is required' });
  }
  // Insert user data into Users table (this will create the driver in the Users table)
  const insertUserQuery = `
    INSERT INTO Users (Name, EmployeeID, Email, Password, Role) 
    VALUES (?, ?, ?, ?, 'Driver')
  `;
  db.query(insertUserQuery, [name, empid, email, password], (err, result) => {
    if (err) {
      console.error("Error inserting into Users:", err);
      return res.status(500).json({ error: 'Error adding driver to Users' });
    }

    const userID = result.insertId; // Get the generated UserID

    // Now, insert the driver's data into the Drivers table
    const insertDriverQuery = `
      INSERT INTO Drivers (UserID, LicenseNumber, OngoingTraining, ContactNumber, PoliceVerificationDoneDate, Status, VendorID)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertDriverQuery, [userID, licenseNumber, ongoingTraining, contactNumber, policeVerificationDoneDate, Status, vendorID], (err, result) => {
      if (err) {
        console.error("Error inserting into Drivers:", err);
        return res.status(500).json({ error: 'Error adding driver' });
      }
      console.log("Driver data added:", result);
      return res.status(200).json({ message: 'Driver added successfully' });
    });
  });
});


// Update driver status (e.g., deactivate/activate)
app.patch('/api/vendor/drivers/:driverId/status', (req, res) => {
  const driverId = req.params.driverId;
  const { status, vendorID } = req.body;

  const query = `
    UPDATE drivers
    SET Status = ?
    WHERE DriverID = ? AND VendorID = ?
  `;

  db.query(query, [status, driverId, vendorID], (err, result) => {
    if (err) return res.status(500).json({ error: 'Status update error: ' + err.message });

    res.json({ success: true, message: `Driver ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
  });
});


// Update driver details
app.put('/api/vendor/drivers/:driverId', (req, res) => {
  const driverId = req.params.driverId;
  const { name, licenseNumber, ongoingTraining, contactNumber, vendorID } = req.body;

  if (!vendorID) {
    return res.status(400).json({ error: 'VendorID is required' });
  }

  // First, fetch the UserID linked to the DriverID
  const getUserIdQuery = `SELECT UserID FROM Drivers WHERE DriverID = ? AND VendorID = ?`;
  db.query(getUserIdQuery, [driverId, vendorID], (err, results) => {
    if (err) {
      console.error("Error fetching UserID:", err);
      return res.status(500).json({ error: 'Failed to retrieve driver' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const userId = results[0].UserID;

    // Update Users table
    const updateUserQuery = `
      UPDATE Users 
      SET Name = ?
      WHERE UserID = ?
    `;
    db.query(updateUserQuery, [name, userId], (err) => {
      if (err) {
        console.error("Error updating Users table:", err);
        return res.status(500).json({ error: 'Failed to update user info' });
      }

      // Update Drivers table
      const updateDriverQuery = `
        UPDATE Drivers 
        SET LicenseNumber = ?, OngoingTraining = ?, ContactNumber = ?
        WHERE DriverID = ? AND VendorID = ?
      `;
      db.query(updateDriverQuery, [licenseNumber, ongoingTraining, contactNumber, driverId, vendorID], (err) => {
        if (err) {
          console.error("Error updating Drivers table:", err);
          return res.status(500).json({ error: 'Failed to update driver info' });
        }

        return res.status(200).json({ message: 'Driver updated successfully' });
      });
    });
  });
});


app.get('/api/vendor/:vendorId/available-vehicles', (req, res) => {
  const vendorId = req.params.vendorId;

  const query = `
    SELECT 
      v.VehicleID, 
      v.VehicleNumber, 
      v.TypeOfVehicle 
    FROM 
      Vehicles v
    LEFT JOIN 
      VehicleUtilization vu ON v.VehicleID = vu.VehicleID
    WHERE 
      v.VendorID = ? AND 
      (vu.VehicleStatus IS NULL OR vu.VehicleStatus != 'Assigned')
  `;

  db.query(query, [vendorId], (err, results) => {
    if (err) {
      console.error('Error fetching vendor vehicles:', err);
      return res.status(500).json({ error: 'Failed to get vendor vehicles' });
    }
    res.json(results);
  });
});


// Assign a vehicle to a driver
app.put('/api/vendor/drivers/:driverId/assign-vehicle', (req, res) => {
  const driverId = req.params.driverId;
  const { vehicleId } = req.body;

  if (!vehicleId) {
    return res.status(400).json({ error: 'VehicleID is required' });
  }

  db.query('UPDATE Drivers SET VehicleID = ? WHERE DriverID = ?', [vehicleId, driverId], (err, results) => {
    if (err) {
      console.error('Error updating driver:', err);
      return res.status(500).json({ error: 'Error updating driver' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if there's an existing entry in the VehicleUtilization table
    db.query(
      'SELECT * FROM VehicleUtilization WHERE DriverID = ?',
      [driverId],
      (err, utilResults) => {
        if (err) {
          console.error('Error checking VehicleUtilization:', err);
          return res.status(500).json({ error: 'Error checking VehicleUtilization' });
        }

        if (utilResults.length > 0) {
          // If there's already an entry, update the existing one
          db.query(
            'UPDATE VehicleUtilization SET VehicleID = ?, VehicleStatus = ?, ShiftDate = NOW() WHERE DriverID = ?',
            [vehicleId, 'Assigned', driverId],
            (err, updateResults) => {
              if (err) {
                console.error('Error updating VehicleUtilization:', err);
                return res.status(500).json({ error: 'Error updating VehicleUtilization' });
              }

              res.status(200).json({ message: 'Vehicle assigned successfully' });
            }
          );
        } else {
          // If no entry exists, insert a new one
          db.query(
            'INSERT INTO VehicleUtilization (DriverID, VehicleID, VehicleStatus, ShiftDate) VALUES (?, ?, ?, NOW())',
            [driverId, vehicleId, 'Assigned'],
            (err, insertResults) => {
              if (err) {
                console.error('Error inserting into VehicleUtilization:', err);
                return res.status(500).json({ error: 'Error assigning vehicle' });
              }

              res.status(200).json({ message: 'Vehicle assigned successfully' });
            }
          );
        }
      }
    );
  });
});

// Unassign a vehicle from a driver
app.put('/api/vendor/drivers/:driverId/unassign-vehicle', (req, res) => {
  const driverId = req.params.driverId;

  // Step 1: Check if the driver exists and has a vehicle assigned
  db.query('SELECT VehicleID FROM Drivers WHERE DriverID = ?', [driverId], (err, driverResults) => {
    if (err) {
      console.error('Error checking driver:', err);
      return res.status(500).json({ error: 'Error checking driver' });
    }

    if (driverResults.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const vehicleId = driverResults[0].VehicleID;

    if (!vehicleId) {
      return res.status(400).json({ error: 'No vehicle assigned to this driver' });
    }

    // Step 2: Remove vehicle assignment from driver
    db.query('UPDATE Drivers SET VehicleID = NULL WHERE DriverID = ?', [driverId], (err, updateResults) => {
      if (err) {
        console.error('Error unassigning vehicle from driver:', err);
        return res.status(500).json({ error: 'Error unassigning vehicle from driver' });
      }

      // Step 3: Update VehicleUtilization
      db.query(
        'UPDATE VehicleUtilization SET VehicleStatus = ?, ShiftDate = NOW() WHERE DriverID = ?',
        ['Available', driverId],
        (err, utilUpdateResults) => {
          if (err) {
            console.error('Error updating VehicleUtilization:', err);
            return res.status(500).json({ error: 'Error updating VehicleUtilization' });
          }

          res.status(200).json({ message: 'Vehicle unassigned successfully' });
        }
      );
    });
  });
});


// GET /api/drivers/:driverId/vehicle-type
app.get('/api/vendor/drivers/:driverId/vehicle-type', (req, res) => {
  const { driverId } = req.params;

  const query = `
    SELECT v.TypeOfVehicle 
    FROM vehicles v
    JOIN vehicleutilization vu ON vu.VehicleID = v.VehicleID
    WHERE vu.DriverID = ? AND vu.VehicleStatus = 'Assigned'
    LIMIT 1
  `;

  db.query(query, [driverId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No assigned vehicle found for this driver' });
    }
    res.json({ vehicleType: results[0].TypeOfVehicle });
  });
});

app.post('/api/vendor/driver-payment-rates', (req, res) => {
  const {
    VehicleType,
    RatePerKm,
    RatePerHour,
    MinimumKm,
    BaseRate,
    BataPerDay,
    DriverID
  } = req.body;

  const sql = `
    INSERT INTO DriverPaymentRates 
    (VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, BataPerDay,DriverID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, BataPerDay, DriverID], (err, result) => {
    if (err) {
      console.error('Error inserting driver payment rate:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(201).json({ message: 'Payment rate added successfully' });
  });
});

app.get('/api/vendor/driver-payment-rates/:driverId', (req, res) => {
  const { driverId } = req.params;

  const sql = `
    SELECT * FROM DriverPaymentRates 
    WHERE DriverID = ?
    LIMIT 1
  `;

  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.error('Error fetching payment rate:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(200).json({}); // return empty object if no data
    }
    return res.status(200).json(results[0]);
  });
});

app.put('/api/vendor/driver-payment-rates', (req, res) => {
  const {
    VehicleType,
    RatePerKm,
    RatePerHour,
    MinimumKm,
    BaseRate,
    BataPerDay,
    DriverID
  } = req.body;

  const sql = `
    UPDATE DriverPaymentRates 
    SET VehicleType = ?, RatePerKm = ?, RatePerHour = ?, MinimumKm = ?, BaseRate = ?, BataPerDay = ?
    WHERE DriverID = ?
  `;

  db.query(sql, [VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, BataPerDay, DriverID], (err, result) => {
    if (err) {
      console.error('Error updating driver payment rate:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No matching driver payment rate found' });
    }
    return res.status(200).json({ message: 'Payment rate updated successfully' });
  });
});

app.get('/api/vendor/:vendorId/trips', (req, res) => {
  const vendorId = req.params.vendorId;

  const query = `
    SELECT 
      tm.*,
      c.ClientName,
      t.StartTime,
      t.EndTime,
      t.TripType,
      t.VehicleType,
      t.PickupLocation,
      t.DropLocation
    FROM 
      TripManagement tm
    JOIN 
      Clients c ON tm.ClientID = c.ClientID
    LEFT JOIN 
      Trips t ON tm.TripID = t.TripID
    WHERE 
      tm.VendorID = ?
    ORDER BY 
      t.StartTime ASC;
  `;

  db.query(query, [vendorId], (err, results) => {
    if (err) {
      console.error("Error fetching vendor trips:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Get available drivers
// Get available drivers for a specific vendor
app.get('/api/vendor/available-drivers/:vendorId', (req, res) => {
  const vendorId = req.params.vendorId;

  const query = `
    SELECT 
      d.DriverID,
      u.Name AS DriverName,
      v.VehicleNumber,
      v.TypeOfVehicle AS VehicleType
    FROM 
      drivers d
    JOIN 
      users u ON d.UserID = u.UserID
    JOIN 
      vehicles v ON d.VehicleID = v.VehicleID
    WHERE 
      d.Status = 'Available'
      AND d.VehicleID IS NOT NULL
      AND d.VendorID = ?
  `;

  db.query(query, [vendorId], (err, results) => {
    if (err) {
      console.error('Error fetching available drivers and vehicles:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(results);
  });
});


// Assign trip to driver and vehicle
app.post('/api/vendor/assign-trip', (req, res) => {
  const { tripId, driverId } = req.body;

  if (!tripId || !driverId) {
    return res.status(400).json({ error: 'Missing tripId or driverId' });
  }

  // First, get the VehicleID associated with this driver
  const getVehicleSql = `
    SELECT VehicleID FROM drivers WHERE DriverID = ?
  `;

  db.query(getVehicleSql, [driverId], (err, result) => {
    if (err) {
      console.error('Error fetching vehicle for driver:', err);
      return res.status(500).json({ error: 'Server error fetching vehicle' });
    }

    if (result.length === 0 || !result[0].VehicleID) {
      return res.status(400).json({ error: 'Driver does not have a vehicle assigned' });
    }

    const vehicleId = result[0].VehicleID;

    // Now, update the tripmanagement with DriverID and VehicleID
    const updateTripSql = `
      UPDATE tripmanagement
      SET DriverID = ?, VehicleID = ?, TripStatus = 'Assigned'
      WHERE TripID = ?
    `;

    db.query(updateTripSql, [driverId, vehicleId, tripId], (err1, result1) => {
      if (err1) {
        console.error('Error assigning driver and vehicle to trip:', err1);
        return res.status(500).json({ error: 'Failed to assign trip' });
      }

      // Update driver status
      const updateDriverSql = `
        UPDATE drivers
        SET Status = 'Assigned'
        WHERE DriverID = ?
      `;

      db.query(updateDriverSql, [driverId], (err2, result2) => {
        if (err2) {
          console.error('Error updating driver status:', err2);
          return res.status(500).json({ error: 'Driver status update failed' });
        }

        res.json({ success: true, message: 'Trip and vehicle assigned successfully' });
      });
    });
  });
});


//-------------------------------------------Start of Service schedule -----------------------------------------------------------

// GET /api/vehicles
app.get('/api/vehicles', (req, res) => {
  const { vendorid } = req.query;

  if (!vendorid) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  const sql = 'SELECT VehicleID, VehicleNumber FROM Vehicles WHERE VendorID = ?';
  db.query(sql, [vendorid], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});



// Get all service schedules
app.get('/api/service-schedule', (req, res) => {
  const query = `
   SELECT s.*, v.VehicleNumber
      FROM vehicleserviceschedule s
      JOIN vehicles v ON s.VehicleID = v.VehicleID
      ORDER BY s.ServiceDate DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching schedules:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Add new schedule
app.post('/api/vehicle-service/schedule', (req, res) => {
  const { VehicleID, ServiceDate, Description } = req.body;
  const query = `
    INSERT INTO vehicleserviceschedule (VehicleID, ServiceDate, Description)
    VALUES (?, ?, ?)
  `;
  db.query(query, [VehicleID, ServiceDate, Description], (err, result) => {
    if (err) {
      console.error('Error adding schedule:', err);
      return res.status(500).json({ error: 'Failed to add schedule' });
    }
    res.json({ message: 'Service scheduled successfully', ScheduleID: result.insertId });
  });
});

// Update a schedule
app.put('/api/vehicle-service/schedule/:id', (req, res) => {
  const { id } = req.params;
  const { VehicleID, ServiceDate, Description } = req.body;
  const query = `
    UPDATE vehicleserviceschedule
    SET VehicleID = ?, ServiceDate = ?, Description = ?
    WHERE ServiceID = ?
  `;
  db.query(query, [VehicleID, ServiceDate, Description, id], (err, result) => {
    if (err) {
      console.error('Error updating schedule:', err);
      return res.status(500).json({ error: 'Failed to update schedule' });
    }
    res.json({ message: 'Service updated successfully' });
  });
});

// Delete a schedule
app.delete('/api/vehicle-service/schedule/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM vehicleserviceschedule WHERE ServiceID = ?`;
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting schedule:', err);
      return res.status(500).json({ error: 'Failed to delete schedule' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  });
});

//-------------------------------End of Service schedule------------------------------------------

// Fetch all vehicles
app.get('/api/vendor/manage-vehicles', (req, res) => {
  const vendorID = req.query.vendorID;

  if (!vendorID) {
    return res.status(400).json({ error: 'Missing vendorID' });
  }

  const query = `SELECT * FROM Vehicles WHERE VendorID = ?`;

  db.query(query, [vendorID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }
    res.status(200).json(results);
  });
});


// GET /api/vendors
app.get('/api/vendor/vehicles/vendors', async (req, res) => {
  const query = `
  SELECT VendorID, VendorName FROM Vendors
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }
    res.status(200).json(results);
  });
});



// Add new vehicle
app.post('/api/vendor/manage-vehicles', (req, res) => {
  const {
    typeOfVehicle,
    vehicleMake,
    vehicleModel,
    vehicleNumber,
    vendorID,
    fitnessCertificateExpiry,
    rcExpiryDate,
    taxExpiryDate,
    insuranceExpiryDate
  } = req.body;

  // Basic validation
  if (!typeOfVehicle || !vehicleNumber) {
    return res.status(400).json({ error: 'Vehicle type and vehicle number are required' });
  }

  // Ensure vendorID is provided and is a valid number
  const vendorIdParsed = parseInt(vendorID, 10);
  if (isNaN(vendorIdParsed)) {
    return res.status(400).json({ error: 'Invalid vendorID' });
  }

  const query = `
    INSERT INTO Vehicles (
      TypeOfVehicle, VehicleMake, VehicleModel, VehicleNumber,
      VendorID, FitnessCertificateExpiry, RCExpiryDate, TaxExpiryDate, InsuranceExpiryDate
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      typeOfVehicle,
      vehicleMake || null,  // Optional fields should default to null if not provided
      vehicleModel || null,
      vehicleNumber,
      vendorIdParsed,
      fitnessCertificateExpiry || null,
      rcExpiryDate || null,
      taxExpiryDate || null,
      insuranceExpiryDate || null
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting vehicle:', err);
        return res.status(500).json({ error: 'Error adding new vehicle' });
      }
      res.status(201).json({ message: 'Vehicle added successfully', vehicleID: result.insertId });
    }
  );
});


// Update vehicle details
app.put('/api/vendor/manage-vehicles/:vehicleID', (req, res) => {
  const { vehicleID } = req.params;
  const { typeOfVehicle, vehicleMake, vehicleModel, vehicleNumber, fitnessCertificateExpiry, rcExpiryDate, taxExpiryDate, insuranceExpiryDate } = req.body;

  const query = `
    UPDATE Vehicles
    SET TypeOfVehicle = ?, VehicleMake = ?, VehicleModel = ?, VehicleNumber=?, FitnessCertificateExpiry = ?, RCExpiryDate = ?, TaxExpiryDate = ?, InsuranceExpiryDate = ?
    WHERE VehicleID = ?
  `;

  db.query(query, [typeOfVehicle, vehicleMake, vehicleModel, vehicleNumber, fitnessCertificateExpiry, rcExpiryDate, taxExpiryDate, insuranceExpiryDate, vehicleID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error updating vehicle details' });
    }
    res.status(200).json({ message: 'Vehicle details updated successfully' });
  });
});

// Delete a vehicle
app.delete('/api/vendor/manage-vehicles/:vehicleID', (req, res) => {
  const { vehicleID } = req.params;

  const query = `
    DELETE FROM Vehicles WHERE VehicleID = ?
  `;

  db.query(query, [vehicleID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error deleting vehicle' });
    }
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  });
});



// Get price lists for a specific vendor
app.get('/api/vendor/manage-pricelists/:vendorId', (req, res) => {
  const vendorID = req.params.vendorId;
  db.query('SELECT * FROM pricelists WHERE VendorID = ?', [vendorID], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// Get unique vehicle types
// GET vehicle types added by a specific vendor
app.get('/api/vendor/manage-vehicle-types/:vendorID', (req, res) => {
  const vendorID = req.params.vendorID;
  const query = `
    SELECT DISTINCT TypeOfVehicle 
    FROM Vehicles 
    WHERE VendorID = ?
  `;
  db.query(query, [vendorID], (err, results) => {
    if (err) {
      console.error("Error fetching vehicle types:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
});


// Add a new price list
app.post('/api/vendor/manage-pricelists', (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO pricelists 
    (VehicleType, RatePerKm, RatePerHour, MinimumKm, BaseRate, WaitingChargePerHour, NightCharge, VendorID) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [
    data.vehicleType,
    data.ratePerKm,
    data.ratePerHour,
    data.minimumKm,
    data.baseRate,
    data.waitingChargePerHour,
    data.nightCharge,
    data.vendorID
  ], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Price list added successfully' });
  });
});

// Update a price list
app.put('/api/vendor/manage-pricelists/:id', (req, res) => {
  const data = req.body;
  db.query(`
    UPDATE pricelists SET 
    VehicleType=?, RatePerKm=?, RatePerHour=?, MinimumKm=?, BaseRate=?, WaitingChargePerHour=?, NightCharge=? 
    WHERE PriceListID=?`,
    [
      data.vehicleType,
      data.ratePerKm,
      data.ratePerHour,
      data.minimumKm,
      data.baseRate,
      data.waitingChargePerHour,
      data.nightCharge,
      req.params.id
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Price list updated successfully' });
    });
});

// Delete a price list
app.delete('/api/vendor/manage-pricelists/:id', (req, res) => {
  db.query('DELETE FROM pricelists WHERE PriceListID = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Price list deleted successfully' });
  });
});

// GET: Fetch payout requests for a vendor
app.get('/api/vendor/payout-requests', (req, res) => {
  const { vendorID } = req.query;
  const query = `
        SELECT pr.RequestID, pr.DriverID, d.ContactNumber, pr.Amount, pr.RequestDate, pr.Status
        FROM payout_requests pr
        JOIN drivers d ON pr.DriverID = d.DriverID
        WHERE d.VendorID = ?
        ORDER BY pr.RequestDate DESC
    `;

  db.query(query, [vendorID], (err, results) => {
    if (err) {
      console.error('Error fetching payout requests:', err);
      return res.status(500).json({ message: 'Error fetching payout requests' });
    }
    res.json(results);
  });
});

// PUT: Update payout request status
app.put('/api/vendor/payout-requests/:requestID', (req, res) => {
  const { requestID } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  // Step 1: Update the payout request status
  const updateRequestQuery = `UPDATE payout_requests SET Status = ?, RequestDate = NOW() WHERE RequestID = ?`;
  db.query(updateRequestQuery, [status, requestID], (err) => {
    if (err) {
      console.error('Error updating payout request:', err);
      return res.status(500).json({ message: 'Failed to update payout request' });
    }

    if (status !== 'Approved') {
      return res.json({ message: `Payout request ${status.toLowerCase()} successfully. And Paid to driver` });
    }

    // Step 2: Get DriverID and Amount
    const getRequestDetails = `SELECT DriverID, Amount FROM payout_requests WHERE RequestID = ?`;
    db.query(getRequestDetails, [requestID], (err, rows) => {
      if (err || rows.length === 0) {
        console.error('Error fetching payout details:', err);
        return res.status(500).json({ message: 'Failed to fetch payout details' });
      }

      const { DriverID, Amount } = rows[0];
      let remaining = parseFloat(Amount);

      // Step 3: Fetch unpaid earnings
      const getEarningsQuery = `
        SELECT EarningID, Amount
        FROM driver_earnings
        WHERE DriverID = ? AND PaymentStatus = 'Pending'
        ORDER BY CreatedAt ASC
      `;
      db.query(getEarningsQuery, [DriverID], (err, earnings) => {
        if (err) {
          console.error('Error fetching earnings:', err);
          return res.status(500).json({ message: 'Failed to fetch earnings' });
        }

        const queries = [];
        const paidOutEarnings = [];

        for (const earning of earnings) {
          const earningID = earning.EarningID;
          let earningAmount = parseFloat(earning.Amount);

          if (remaining <= 0) break;

          if (remaining >= earningAmount) {
            // Full payment
            queries.push({
              query: `UPDATE driver_earnings SET PaymentStatus = 'Paid', PaymentDate = CURDATE() WHERE EarningID = ?`,
              params: [earningID]
            });
            remaining -= earningAmount;
            paidOutEarnings.push({ earningID, paidAmount: earningAmount });
          } else {
            // Partial payment - split the earning
            queries.push({
              query: `UPDATE driver_earnings SET Amount = Amount - ?, UpdatedAt = CURRENT_TIMESTAMP WHERE EarningID = ?`,
              params: [remaining, earningID]
            });
            queries.push({
              query: `
                INSERT INTO driver_earnings (DriverID, TripID, Amount, PaymentStatus, PaymentDate, CreatedAt)
                SELECT DriverID, TripID, ?, 'Paid', CURDATE(), CURRENT_TIMESTAMP
                FROM driver_earnings
                WHERE EarningID = ?
              `,
              params: [remaining, earningID]
            });
            paidOutEarnings.push({ earningID, paidAmount: remaining });
            remaining = 0;
          }
        }

        if (queries.length === 0) {
          return res.json({ message: 'No earnings matched the requested amount.' });
        }

        // Step 4: Execute all updates
        let executed = 0;
        for (const q of queries) {
          db.query(q.query, q.params, (err) => {
            executed++;
            if (err) {
              console.error('Error executing payment update:', err);
            }

            if (executed === queries.length) {
              res.json({
                message: `Payout of ₹${Amount - remaining} approved successfully.`,
                paidEarnings: paidOutEarnings
              });
            }
          });
        }
      });
    });
  });
});


app.get('/api/vendor/alerts', (req, res) => {
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res.status(400).json({ success: false, message: 'VendorID is required' });
  }

  const supportQuery = `
    SELECT sr.RequestID AS ID, sr.Subject, sr.Message, sr.CreatedAt AS AlertTime, 'Driver' AS SenderType, u.Name AS SenderName
    FROM support_requests sr
    LEFT JOIN Drivers d ON sr.DriverID = d.DriverID
    LEFT JOIN Users u ON d.UserID = u.UserID
    WHERE d.VendorID = ?
  `;

  const vendorMsgQuery = `
    SELECT vm.MessageID AS ID, vm.Subject, vm.Message, vm.SentAt AS AlertTime, 'Admin' AS SenderType, 'Admin' AS SenderName
    FROM vendormessages vm
    WHERE vm.VendorID = ?
  `;

  db.query(supportQuery, [vendorId], (err, supportResults) => {
    if (err) {
      console.error('Error fetching support requests:', err);
      return res.status(500).json({ success: false, message: 'Error fetching support requests' });
    }

    db.query(vendorMsgQuery, [vendorId], (err2, vendorMsgs) => {
      if (err2) {
        console.error('Error fetching vendor messages:', err2);
        return res.status(500).json({ success: false, message: 'Error fetching vendor messages' });
      }

      // Combine both alerts into one array and sort by time descending
      const combinedAlerts = [...supportResults, ...vendorMsgs].sort((a, b) => new Date(b.AlertTime) - new Date(a.AlertTime));

      res.json({ success: true, alerts: combinedAlerts });
    });
  });
});



// GET /api/vendor/summary/:vendorId
app.get('/api/vendor/summary/:vendorID', (req, res) => {
  const vendorId = req.params.vendorID;

  const summary = {};

  const driverQuery = `
        SELECT 
            COUNT(*) AS totalDrivers,
            SUM(CASE WHEN Status = 'Available' THEN 1 ELSE 0 END) AS activeDrivers,
            SUM(CASE WHEN Status != 'Available' THEN 1 ELSE 0 END) AS inactiveDrivers
        FROM drivers
        WHERE VendorID = ?
    `;

  const vehicleQuery = `
        SELECT 
            COUNT(*) AS totalVehicles,
            SUM(CASE WHEN VehicleID IN (SELECT DISTINCT VehicleID FROM drivers WHERE VehicleID IS NOT NULL) THEN 1 ELSE 0 END) AS assignedVehicles,
            SUM(CASE WHEN VehicleID NOT IN (SELECT DISTINCT VehicleID FROM drivers WHERE VehicleID IS NOT NULL) OR VehicleID IS NULL THEN 1 ELSE 0 END) AS unassignedVehicles
        FROM vehicles
        WHERE VendorID = ?
    `;

  const tripQuery = `
        SELECT
            SUM(CASE WHEN TripStatus = 'Requested' THEN 1 ELSE 0 END) AS requestedTrips,
            SUM(CASE WHEN TripStatus = 'InProgress' THEN 1 ELSE 0 END) AS ongoingTrips,
            SUM(CASE WHEN TripStatus = 'Completed' THEN 1 ELSE 0 END) AS completedTrips
        FROM tripmanagement
        WHERE VendorID = ?
    `;

  db.query(driverQuery, [vendorId], (err, driverResult) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch driver summary' });

    Object.assign(summary, driverResult[0]);

    db.query(vehicleQuery, [vendorId], (err, vehicleResult) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch vehicle summary' });

      Object.assign(summary, vehicleResult[0]);

      db.query(tripQuery, [vendorId], (err, tripResult) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch trip summary' });

        Object.assign(summary, tripResult[0]);

        return res.json(summary);
      });
    });
  });
});



//----------------trips---------------------------------------------------------------------------------------

app.get('/api/vendor/trip-history', (req, res) => {
  const vendorId = req.query.vendorId;
  if (!vendorId) return res.status(400).json({ error: 'Missing vendorId parameter' });

  const query = `
    SELECT 
  tm.TripID,
  ANY_VALUE(tm.TotalDistance) AS TotalDistance,
  ANY_VALUE(tm.TotalCost) AS TotalCost,
  ANY_VALUE(tm.TripDate) AS TripDate,
  ANY_VALUE(tm.TripStatus) AS TripStatus,
  ANY_VALUE(c.ClientName) AS ClientName,
  ANY_VALUE(so.SubOfficeName) AS SubOfficeName,
  ANY_VALUE(u.Name) AS DriverName,
  ANY_VALUE(v.VehicleNumber) AS VehicleNumber,
  ANY_VALUE(t.PickupLocation) AS PickupLocation,
  ANY_VALUE(t.DropLocation) AS DropLocation,
  ANY_VALUE(t.TripType) AS TripType,
  ANY_VALUE(t.VehicleType) AS VehicleType,
  ANY_VALUE(t.StartTime) AS StartTime,
  ANY_VALUE(t.EndTime) AS EndTime,
  COALESCE(MAX(p.PaymentStatus), 'Not Paid') AS PaymentStatus
FROM TripManagement tm
JOIN Trips t ON t.TripID = tm.TripID
JOIN Clients c ON c.ClientID = tm.ClientID
LEFT JOIN ClientSubOffices so ON so.SubOfficeID = tm.SubOfficeID
LEFT JOIN Drivers d ON d.DriverID = tm.DriverID
LEFT JOIN Users u ON u.UserID = d.UserID
JOIN Vehicles v ON v.VehicleID = d.VehicleID
LEFT JOIN payments p ON p.TripID = tm.TripID
WHERE tm.TripStatus = 'Completed' AND tm.VendorID = ?
GROUP BY tm.TripID
ORDER BY tm.TripID DESC

  `;

  db.query(query, [vendorId], (err, rows) => {
    if (err) {
      console.error('Error fetching trip history:', err);
      return res.status(500).json({ error: 'Error fetching trip history' });
    }
    res.json(rows);
  });
});

app.get('/api/trip/:tripId/driver/:driverId/rating', (req, res) => {
  const { tripId, driverId } = req.params;

  const query = `
    SELECT *
    FROM tripratings
    WHERE TripID = ?
  `;

  db.query(query, [tripId, driverId], (err, results) => {
    if (err) {
      console.error('Error fetching rating:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      // No rating found for this trip/driver
      return res.json({ success: true, rating: null, feedback: null });
    }

    const { Rating, Feedback } = results[0];
    res.json({ success: true, rating: Rating, feedback: Feedback });
  });
});


app.get('/api/vendor/driver-earnings', (req, res) => {
  const vendorId = req.query.vendorId;
  if (!vendorId) return res.status(400).json({ error: 'Missing vendorId parameter' });

  const query = `
    SELECT 
      de.EarningID,
      de.TripID,
      de.Amount,
      de.PaymentStatus,
      de.PaymentDate,
      u.Name AS DriverName
    FROM driver_earnings de
    JOIN drivers d ON d.DriverID = de.DriverID
    JOIN users u ON u.UserID = d.UserID
    WHERE d.VendorID = ?
    ORDER BY 
  de.PaymentStatus = 'Pending' DESC,  -- Paid (FALSE=0) first, Pending (TRUE=1) next
  de.PaymentDate DESC,
  de.CreatedAt DESC
  `;

  db.query(query, [vendorId], (err, rows) => {
    if (err) {
      console.error('Error fetching driver earnings:', err);
      return res.status(500).json({ error: 'Error fetching driver earnings' });
    }
    res.json(rows);
  });
});

app.post('/api/vendor/pay-driver', (req, res) => {
  const { earningId } = req.body;
  if (!earningId) return res.status(400).json({ error: 'Missing earningId' });

  const query = `
    UPDATE driver_earnings
    SET PaymentStatus = 'Paid', PaymentDate = CURDATE()
    WHERE EarningID = ?
  `;

  db.query(query, [earningId], (err, result) => {
    if (err) {
      console.error('Error updating payment status:', err);
      return res.status(500).json({ error: 'Failed to update payment status' });
    }
    res.json({ success: true });
  });
});


// Send alert to a driver from a vendor
app.post('/api/vendor/alerts/send', (req, res) => {
  const { vendorID, driverID, alertType, alertDetails } = req.body;

  if (!vendorID || !driverID || !alertType || !alertDetails) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Step 1: Validate driver belongs to vendor
  db.query(
    'SELECT * FROM drivers WHERE DriverID = ? AND VendorID = ?',
    [driverID, vendorID],
    (err, result) => {
      if (err) {
        console.error('Step 1 Error:', err);
        return res.status(500).json({ message: 'Database error during driver validation' });
      }
      if (result.length === 0) {
        return res.status(403).json({ message: 'Unauthorized: Driver not linked to vendor' });
      }

      // Step 2: Get latest active trip for the driver
      const getTripQuery = `
        SELECT TripID FROM tripmanagement 
        WHERE DriverID = ? AND TripStatus IN ('Assigned', 'InProgress') 
        ORDER BY TripID DESC LIMIT 1
      `;
      db.query(getTripQuery, [driverID], (err2, tripResult) => {
        if (err2) {
          console.error('Step 2 Error:', err2);
          return res.status(500).json({ message: 'Trip lookup error' });
        }

        const tripID = tripResult.length > 0 ? tripResult[0].TripID : null;

        // Step 3: Insert the alert
        const insertQuery = `
          INSERT INTO alerts (TripID, AlertType, AlertDetails, DriverID, SenderType, VendorID)
          VALUES (?, ?, ?, ?, 'Vendor', ?)
        `;
        db.query(insertQuery, [tripID, alertType, alertDetails, driverID, vendorID], (err3) => {
          if (err3) {
            console.error('Step 3 Error:', err3);
            return res.status(500).json({ message: 'Failed to insert alert' });
          }
          res.json({ message: 'Alert sent successfully', tripID });
        });
      });
    }
  );
});


// Get drivers for a specific vendor
app.get('/api/drivers/vendors/:vendorID/drivers', (req, res) => {
  const vendorID = req.params.vendorID;

  const query = `
    SELECT d.DriverID, u.Name AS DriverName 
    FROM drivers d 
    JOIN users u ON d.UserID = u.UserID 
    WHERE d.VendorID = ?
  `;

  db.query(query, [vendorID], (err, result) => {
    if (err) {
      console.error('Error fetching drivers:', err);
      return res.status(500).json({ message: 'Error fetching drivers' });
    }
    res.json(result);
  });
});


// Get active trip for a driver
app.get('/api/trips/active/:driverID', (req, res) => {
  const driverID = req.params.driverID;

  const query = `
    SELECT TripID FROM tripmanagement 
    WHERE DriverID = ? AND TripStatus IN ('Assigned', 'InProgress') 
    ORDER BY TripID DESC LIMIT 1
  `;
  db.query(query, [driverID], (err, result) => {
    if (err) {
      console.error('Error fetching active trip:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ tripID: result[0]?.TripID || null });
  });
});


app.get('/api/vendor/:vendorID/driver-alerts', (req, res) => {
  const { vendorID } = req.params;

  const query = `
    SELECT a.*, u.Name AS DriverName
    FROM alerts a
    JOIN drivers d ON a.DriverID = d.DriverID
    JOIN users u ON d.UserID = u.UserID
    WHERE d.VendorID = ?
    ORDER BY a.AlertTime DESC
  `;

  db.query(query, [vendorID], (err, results) => {
    if (err) {
      console.error('Error fetching driver alerts for vendor:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, alerts: results });
  });
});




//---------------------------------------- Customer ----------------------------------------------------------------------

// Route: POST /api/client/signup
app.post("/api/client/signup", (req, res) => {
  const {
    ClientName,
    PrimaryContactName,
    PrimaryContactEmail,
    PrimaryContactPhone,
    BillingAddress,
    Password,
  } = req.body;

  // Insert into users first
  const userQuery = `INSERT INTO users (Name, Email, Password, Role, CreatedAt, UpdatedAt)
                     VALUES (?, ?, ?, 'Client', NOW(), NOW())`;

  db.query(userQuery, [PrimaryContactName, PrimaryContactEmail, Password], (err, userResult) => {
    if (err) return res.status(500).json({ error: "Failed to create user", err });

    const userID = userResult.insertId;

    // Now insert into clients table
    const clientQuery = `INSERT INTO clients (ClientName, PrimaryContactName, PrimaryContactEmail,
                          PrimaryContactPhone, BillingAddress, CreatedAt, UpdatedAt)
                          VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;

    db.query(
      clientQuery,
      [ClientName, PrimaryContactName, PrimaryContactEmail, PrimaryContactPhone, BillingAddress],
      (err2, clientResult) => {
        if (err2) return res.status(500).json({ error: "Failed to create client", err2 });

        res.status(201).json({ message: "Client registered successfully", userID, clientID: clientResult.insertId });
      }
    );
  });
});

// Route: POST /api/client/login
app.post("/api/client/login", (req, res) => {
  const { email, password } = req.body;

  const query = `
  SELECT c.ClientID, c.ClientName, u.Email
  FROM users u
  JOIN clients c ON c.PrimaryContactEmail = u.Email
  WHERE u.Email = ? AND u.Password = ? AND u.Role = 'Client'
`;
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: results[0], // You can choose what to return
    });
  });
});

app.get("/api/client/dashboard", (req, res) => {
  const clientId = req.query.clientId;

  if (!clientId) {
    return res.status(400).json({ message: "Client ID is required" });
  }

  const getClientQuery = "SELECT ClientName FROM clients WHERE ClientID = ?";
  const getTripsQuery = "SELECT * FROM trips WHERE ClientID = ? ORDER BY TripDate DESC";

  db.query(getClientQuery, [clientId], (err, clientResult) => {
    if (err) return res.status(500).json({ message: "Error fetching client info", error: err });

    const clientName = clientResult[0]?.ClientName || "Client";

    db.query(getTripsQuery, [clientId], (err, tripsResult) => {
      if (err) return res.status(500).json({ message: "Error fetching trips", error: err });

      return res.json({ clientName, trips: tripsResult });
    });
  });
});


//--------------calculate cost---------------------------------------------------

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getCoordinates(address) {
  const apiKey = '8b99b6eb9caa4699968550cce9456cf9'; // Replace with your real key
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await axios.get(url);
  const location = response.data.results[0]?.geometry;
  return location ? { lat: location.lat, lon: location.lng } : null;
}

// POST /api/bookings/calculate
app.post('/api/bookings/calculate', async (req, res) => {
  const { pickup, drop, vehicleType } = req.body;

  try {
    const pickupCoords = await getCoordinates(pickup);
    const dropCoords = await getCoordinates(drop);

    if (!pickupCoords || !dropCoords) {
      return res.status(400).json({ error: 'Invalid location(s) provided' });
    }

    const distance = getDistanceFromLatLonInKm(
      pickupCoords.lat,
      pickupCoords.lon,
      dropCoords.lat,
      dropCoords.lon
    );

    const query = `
      SELECT p.*, v.VendorName 
      FROM pricelists p
      JOIN vendors v ON p.VendorID = v.VendorID
      WHERE p.VehicleType = ?
    `;

    db.query(query, [vehicleType], (err, results) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'No vendors found for this vehicle type' });
      }

      const vendorOptions = results.map(row => ({
        vendorID: row.VendorID,
        vendorName: row.VendorName,
        vehicleType: row.VehicleType,
        distance: distance.toFixed(2),
        totalCost: (row.BaseRate + (row.RatePerKm * distance)).toFixed(2),
      }));

      res.json({ vendorOptions });
    });
  } catch (error) {
    console.error('Error calculating distance and cost:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Route to fetch all available vehicles (no clientId filter)
app.get('/api/bookings/available-vehicles', (req, res) => {
  console.log('API request received for available vehicles');

  const query = 'SELECT PriceListID, VehicleType, RatePerKm, RatePerHour, MinimumKm FROM pricelists';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query failed:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (!results || results.length === 0) {
      console.warn('No vehicles found in the price list');
      return res.status(200).json([]);  // return empty array instead of 404
    }

    console.log('Fetched vehicle list:', results);
    return res.status(200).json(results);
  });
});


app.post('/api/client/bookings/confirm', (req, res) => {
  const {
    pickup,
    drop,
    vehicle,
    startDate,
    vendorId,
    bookingDetails,
    clientId,
    tripType,
    distance,
    totalCost
  } = req.body;

  const tripDate = new Date(startDate).toISOString().split('T')[0];

  const insertTripManagement = `
    INSERT INTO tripmanagement (ClientID, VendorID, TripDate, TripStatus, TotalDistance, TotalCost)
    VALUES (?, ?, ?, 'Requested', ?, ?)
  `;

  db.query(insertTripManagement, [clientId, vendorId, tripDate, distance, totalCost], (err, result) => {
    if (err) {
      console.error('Insert tripmanagement error:', err);
      return res.status(500).json({ error: 'Failed to insert into tripmanagement' });
    }

    const tripID = result.insertId;

    const insertTrips = `
      INSERT INTO trips (TripID, PickupLocation, DropLocation, BookingDetails, StartTime, TripType, VehicleType)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertTrips,
      [tripID, pickup, drop, bookingDetails, startDate, tripType, vehicle],
      (err2) => {
        if (err2) {
          console.error('Insert trips error:', err2);
          return res.status(500).json({ error: 'Failed to insert into trips' });
        }
        const updateClientVendor = `UPDATE clients SET VendorID = ? WHERE ClientID = ?`;
        db.query(updateClientVendor, [vendorId, clientId], (err3) => {
          if (err3) {
            console.error('Update clients table error:', err3);
            return res.status(500).json({ error: 'Failed to update client with vendor ID' });
          }

          res.json({ success: true });
        });
      }
    );
  });
});

app.put('/api/client/cancel-trip/:tripDetailId', (req, res) => {
  const tripDetailId = req.params.tripDetailId;

  const getTripIdSql = `SELECT TripID FROM trips WHERE TripDetailID = ?`;

  db.query(getTripIdSql, [tripDetailId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const tripId = results[0].TripID;

    const cancelTripSql = `UPDATE tripmanagement SET TripStatus = 'Cancelled' WHERE TripID = ?`;

    db.query(cancelTripSql, [tripId], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({ success: true, message: 'Trip cancelled successfully' });
    });
  });
});



app.get('/api/client/my-trips/:clientId', (req, res) => {
  const clientId = req.params.clientId;

  const query = `
    SELECT 
      tm.*,
      t.TripDetailID,
      t.PickupLocation,
      t.DropLocation,
      t.BookingDetails,
      t.StartTime,
      t.EndTime,
      t.TripType,
      t.VehicleType,
      r.Rating,
      p.PaymentStatus
    FROM tripmanagement tm
    JOIN trips t ON tm.TripID = t.TripID
    LEFT JOIN tripratings r ON r.TripID = tm.TripID AND r.ClientID = ?
    LEFT JOIN payments p ON p.TripID = tm.TripID
    WHERE tm.ClientID = ?
    ORDER BY tm.CreatedAt DESC
  `;

  db.query(query, [clientId, clientId], (err, results) => {
    if (err) {
      console.error('Error fetching client trips:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});


// GET client profile by clientId
app.get('/api/client/profile/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  const sql = `SELECT * FROM Clients WHERE ClientID = ?`;

  db.query(sql, [clientId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Client not found' });

    res.json(results[0]);
  });
});

// PUT update client profile
app.put('/api/client/profile/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  const {
    ClientName, PrimaryContactName, PrimaryContactEmail,
    PrimaryContactPhone, BillingAddress, GovernmentIDProof,
    PAN, LicenseNumber
  } = req.body;

  // Step 1: Get the old email before updating
  const getOldEmailSql = 'SELECT PrimaryContactEmail FROM Clients WHERE ClientID = ?';

  db.query(getOldEmailSql, [clientId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Client not found' });

    const oldEmail = results[0].PrimaryContactEmail;

    // Step 2: Update clients table
    const updateClientSql = `
      UPDATE Clients SET
        ClientName = ?,
        PrimaryContactName = ?,
        PrimaryContactEmail = ?,
        PrimaryContactPhone = ?,
        BillingAddress = ?,
        GovernmentIDProof = ?,
        PAN = ?,
        LicenseNumber = ?
      WHERE ClientID = ?
    `;

    db.query(updateClientSql, [
      ClientName, PrimaryContactName, PrimaryContactEmail,
      PrimaryContactPhone, BillingAddress, GovernmentIDProof,
      PAN, LicenseNumber, clientId
    ], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Step 3: Update users table based on old email and role
      const updateUserSql = `
        UPDATE Users SET Email = ?
        WHERE Email = ? AND Role = 'Client'
      `;

      db.query(updateUserSql, [PrimaryContactEmail, oldEmail], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });

        res.json({ success: true, message: 'Profile updated in both tables successfully' });
      });
    });
  });
});

// trackDriverRoute
// Track Driver By Specific TripID
app.get('/api/client/track-driver-by-trip/:tripId', (req, res) => {
  const tripId = req.params.tripId;

  const sql = `
    SELECT 
      tm.TripID, 
      d.DriverID, u.Name AS DriverName, d.ContactNumber,
      v.VehicleID, v.VehicleNumber, v.TypeOfVehicle,
      lt.Latitude, lt.Longitude,
      t.PickupLocation, t.DropLocation
    FROM tripmanagement tm
    LEFT JOIN drivers d ON tm.DriverID = d.DriverID
    LEFT JOIN users u ON d.UserID = u.UserID
    LEFT JOIN vehicles v ON tm.VehicleID = v.VehicleID
    LEFT JOIN trips t ON tm.TripID = t.TripID
    LEFT JOIN livetracking lt ON v.VehicleID = lt.VehicleID
    WHERE tm.TripID = ?
    ORDER BY lt.Timestamp DESC
    LIMIT 1
  `;

  db.query(sql, [tripId], (err, results) => {
    if (err) {
      console.error('Track Driver By Trip Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No tracking info found for this trip' });
    }

    res.json(results[0]);
  });
});

// POST /api/client/rate-trip
app.post('/api/client/rate-trip', (req, res) => {
  const { TripID, ClientID, Rating, Feedback } = req.body;

  const driverQuery = `SELECT DriverID FROM TripManagement WHERE TripID = ?`;
  db.query(driverQuery, [TripID], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching DriverID' });
    if (result.length === 0) return res.status(404).json({ error: 'Trip not found' });

    const DriverID = result[0].DriverID;
    const insertQuery = `
      INSERT INTO TripRatings (TripID, DriverID, ClientID, Rating, Feedback)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [TripID, DriverID, ClientID, Rating, Feedback || null], (err) => {
      if (err) {
        console.error("Error inserting rating:", err);
        return res.status(500).json({ error: 'Failed to submit rating' });
      }
      res.json({ message: 'Rating submitted successfully' });
    });
  });
});

app.get('/api/trip-cost/:tripId', (req, res) => {
  const { tripId } = req.params;
  const sql = 'SELECT TotalCost FROM tripmanagement WHERE TripID = ?';

  db.query(sql, [tripId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch cost' });
    if (results.length === 0) return res.status(404).json({ error: 'Trip not found' });

    res.json(results[0]);
  });
});


// POST /api/payments/dummy
app.post('/api/payments/dummy', (req, res) => {
  const { tripId, clientId, method } = req.body;

  const getCostQuery = 'SELECT TotalCost FROM tripmanagement WHERE TripID = ?';
  db.query(getCostQuery, [tripId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: 'Trip not found or DB error' });
    }

    const amount = results[0].TotalCost;

    const insertPayment = `
      INSERT INTO payments (TripID, ClientID, Amount, PaymentMethod, PaymentStatus)
      VALUES (?, ?, ?, ?, 'Paid')
    `;
    db.query(insertPayment, [tripId, clientId, amount, method], (err2, result) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to record payment' });
      }

      res.json({ success: true, amount });
    });
  });
});

app.get('/api/client/:clientId/paid-trips', (req, res) => {
  const clientId = req.params.clientId;

  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' });
  }

  const query = `
    SELECT 
      t.TripID, 
      t.PickupLocation,
      t.DropLocation,
      t.StartTime, 
      t.EndTime, 
      t.VehicleType, 
      tm.*, 
      p.PaymentStatus
    FROM tripmanagement tm
    JOIN trips t ON tm.TripID = t.TripID
    JOIN payments p ON tm.TripID = p.TripID
    WHERE tm.ClientID = ? AND p.PaymentStatus = 'Paid'
    ORDER BY t.StartTime DESC
  `;

  db.query(query, [clientId], (err, results) => {
    if (err) {
      console.error('Error fetching paid trips:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ paidTrips: results });
  });
});





// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
