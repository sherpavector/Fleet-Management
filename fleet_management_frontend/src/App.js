import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import MainDashboard from './mainDashboard';

import AdminLogin from './Admin_Component/AdminLogin';
import ForgotPassword from './Admin_Component/ForgotPassword';
import AdminDashboard from './Admin_Component/AdminDashboard';
import AdminProfile from './Admin_Component/AdminProfile';
import AddDriver from './Admin_Component/AddDriver';
import AssignDriverToVehicle from './Admin_Component/AssignDriverToVehicle';
import ManageClients from './Admin_Component/ManageClients';
import AdminTripPage from './Admin_Component/AdminTripPage';
import ContractManagement from './Admin_Component/ContractList';
import AdminAlertsPage from './Admin_Component/AdminAlertsPage';
import AssignTrip from './Admin_Component/AssignTrip';
import TripHistory from './Admin_Component/TripHistory';
import NotificationDetail from './Admin_Component/SendVendorMessage';
import ManageDriver from './Admin_Component/ManageDriver';
import DriverProfile from './Admin_Component/DriverProfile';
import VehicleManagement from './Admin_Component/ManageVehicle';
import PriceListManagement from './Admin_Component/PriceListManagement';
import ManageVendors from './Admin_Component/ManageVendors';
import LiveTrackingDashboard from './Admin_Component/LiveTrackingDashboard';


import Login from './Driver_Component/Login';
import Register from './Driver_Component/Register';
import DriverForgotPassword from './Driver_Component/ForgotPassword';
import DriverDashboard from './Driver_Component/DriverDashboard';
import DriverNavbar from './Driver_Component/components/Navbar';
import TripsPage from './Driver_Component/TripsPage';
import DriversProfile from './Driver_Component/DriverProfile';
import DriverEarnings from './Driver_Component/DriverEarnings';
import Alerts from './Driver_Component/Alerts';
import Support from './Driver_Component/Support';
import TripStatus from './Driver_Component/TripStatus';
import DriverPayout from './Driver_Component/DriverPayout';
import DriverDocuments from './Driver_Component/DriverDocuments';

import VendorLogin from './Vendor_Component/vendor_login';
import VendorDashboard from './Vendor_Component/vendor_dashboard';
import VendorManageDriver from './Vendor_Component/vendor_manage_drivers';
import VendorAddDriver from './Vendor_Component/add_driver';
import VendorDriverProfile from './Vendor_Component/DriverProfile';
import VendorAssignVehicle from './Vendor_Component/AssignDriverToVehicle';
import VendorClientBookings from './Vendor_Component/client-bookings';
import VendorTripHistory from './Vendor_Component/TripHistory';
import VendorAssignTrip from './Vendor_Component/AssignTrip';
import ScheduleService from './Vendor_Component/ScheduleService';
import ManageSubOffices from './Vendor_Component/ManageSubOffices';
import ManageVehicles from './Vendor_Component/ManageVehicles';
import VendorVehiclePriceList from './Vendor_Component/PriceListManagement';
import VendorPayoutRequests from './Vendor_Component/VendorPayoutRequests';
import VendorAlerts from './Vendor_Component/Alerts';
import AlertSender from './Vendor_Component/AlertSender';


import ClientLogin from './Client_Component/ClientLogin';
import ClientSignup from './Client_Component/ClientSignup';
import ClientForgotPassword from './Client_Component/ForgotPassword';
import ClientBookingHistory from './Client_Component/pages/BookingHistory';
import ClientDashboard from './Client_Component/pages/ClientDashboard';
import ClientBook from './Client_Component/pages/ConfirmBooking';
import ClientProfile from './Client_Component/pages/UserProfile';
import ClientTrackDriver from './Client_Component/pages/ClientTrackDriver';
import RatingForm from './Client_Component/pages/RatingForm';
import DummyPayment from './Client_Component/pages/payment';
import ClientBillingHistory from './Client_Component/pages/ClientBillingHistory';
import VendorDriverEarnings from './Vendor_Component/VendorDriverEarnings';


function App() {
  const [driverData, setDriverData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('driverData');
    if (stored) {
      setDriverData(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (data) => {
    // Ensure only driverData object is stored
    localStorage.setItem('driverData', JSON.stringify(data));
    setDriverData(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('driverData');
    setDriverData(null);
  };

  // Driver layout with navbar
  const DriverLayout = ({ children }) => (
    <div>
      <DriverNavbar onLogout={handleLogout} />
      <div>{children}</div>
    </div>
  );

  return (
    <Routes>
      <Route path='/' element={<MainDashboard />} />

      {/* Admin Routes */}
      <Route path='/admin-login' element={<AdminLogin />} />
      <Route path='/forgotpassword' element={<ForgotPassword />} />
      <Route path='/admin-dashboard' element={<AdminDashboard />} />
      <Route path='/admin-profile' element={<AdminProfile />} />
      <Route path='/add-driver' element={<AddDriver />} />
      <Route path='/assign-vehicle/:driverId' element={<AssignDriverToVehicle />} />
      <Route path='/manage-clients' element={<ManageClients />} />
      <Route path='/trip-page' element={<AdminTripPage />} />
      <Route path='/contract-list' element={<ContractManagement />} />
      <Route path='/admin-alerts' element={<AdminAlertsPage />} />
      <Route path='/assignTrip-driver/:tripId' element={<AssignTrip />} />
      <Route path='/trip-history' element={<TripHistory />} />
      <Route path='/allnotification/:driverId' element={<NotificationDetail />} />
      <Route path='/manage-driver' element={<ManageDriver />} />
      <Route path='/driver-profile/:driverId' element={<DriverProfile />} />
      <Route path='/manage-vehicle' element={<VehicleManagement />} />
      <Route path='/price-list' element={<PriceListManagement />} />
      <Route path='/manage-vendor' element={<ManageVendors />} />
      <Route path='/live-tracking/:tripId' element={<LiveTrackingDashboard />} />

      {/* Driver Auth Routes */}
      <Route
        path="/driver-login"
        element={!driverData ? <Login onLogin={handleLogin} /> : <Navigate to="/driver-dashboard" />}
      />
      <Route
        path="/register"
        element={!driverData ? <Register /> : <Navigate to="/driver-dashboard" />}
      />
      <Route path="/forgot-password" element={<DriverForgotPassword />} />

      {/* Protected Driver Routes */}
      <Route
        path="/driver-dashboard"
        element={
          driverData ? (
            <DriverLayout>
              <DriverDashboard driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/trips"
        element={
          driverData ? (
            <DriverLayout>
              <TripsPage driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/profile"
        element={
          driverData ? (
            <DriverLayout>
              <DriversProfile driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/earnings"
        element={
          driverData ? (
            <DriverLayout>
              <DriverEarnings driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/alerts"
        element={
          driverData ? (
            <DriverLayout>
              <Alerts driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/support"
        element={
          driverData ? (
            <DriverLayout>
              <Support driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/tripstatus"
        element={
          driverData ? (
            <DriverLayout>
              <TripStatus driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/driverpayout"
        element={
          driverData ? (
            <DriverLayout>
              <DriverPayout driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />
      <Route
        path="/documents"
        element={
          driverData ? (
            <DriverLayout>
              <DriverDocuments driverData={driverData} />
            </DriverLayout>
          ) : (
            <Navigate to="/driver-login" />
          )
        }
      />


      <Route path='/vendor-login' element={<VendorLogin />} />
      <Route path='/vendor-dashboard' element={<VendorDashboard />} />
      <Route path='/vendor-manage-driver' element={<VendorManageDriver />} />
      <Route path='/vendor-add-driver' element={<VendorAddDriver />} />
      <Route path='/vendor-driver-profile/:driverId' element={<VendorDriverProfile />} />
      <Route path='/vendor-assign-vehicle/:driverId' element={<VendorAssignVehicle />} />
      <Route path='/vendor-client-bookings' element={<VendorClientBookings />} />
      <Route path='/view-trips' element={<VendorTripHistory />} />
      <Route path='/vendor-assignTrip-driver/:tripId' element={<VendorAssignTrip />} />
      <Route path='/service-schedule' element={<ScheduleService />} />
      <Route path='/sub-office' element={<ManageSubOffices />} />
      <Route path='/vendor-manage-vehicle' element={<ManageVehicles />} />
      <Route path='/vendor-price-list' element={<VendorVehiclePriceList />} />
      <Route path='/vendor-payout-request' element={<VendorPayoutRequests />} />
      <Route path='/vendor-alerts' element={<VendorAlerts />} />
      <Route path='/vendor-send-message' element={<AlertSender />} />
      <Route path='/vendor-driver-earnings' element={<VendorDriverEarnings/>} />


      <Route path='/client-login' element={<ClientLogin />} />
      <Route path='/client-signup' element={<ClientSignup />} />
      <Route path='/client-forgotpassword' element={<ClientForgotPassword />} />
      <Route path='/client-booking-history' element={<ClientBookingHistory />} />
      <Route path='/client-dashboard' element={<ClientDashboard />} />
      <Route path='/confirm-booking' element={<ClientBook />} />
      <Route path='/user-profile' element={<ClientProfile />} />
      <Route path="/client-tracker/:tripId" element={<ClientTrackDriver />} />
      <Route path='/rating-form' element={<RatingForm />} />
      <Route path='/client-payment' element={<DummyPayment/>} />
      <Route path='/client-billings' element={<ClientBillingHistory/>} />

    </Routes>
  );
}

export default App;
