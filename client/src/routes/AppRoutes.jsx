import { Routes, Route, Navigate } from 'react-router-dom'

import App from '../App'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

import StudentDashboard from '../pages/student/StudentDashboard'
import SubmitComplaintPage from '../pages/student/SubmitComplaintPage'
import MyComplaintsPage from '../pages/student/MyComplaintsPage'
import ComplaintDetailsPage from '../pages/student/ComplaintDetailsPage'
import NotificationsPage from '../pages/student/NotificationsPage'
import SuggestionsPage from '../pages/student/SuggestionsPage'
import ProfilePage from '../pages/student/ProfilePage'
import AdminDashboard from '../pages/admin/AdminDashboard'

import ManageComplaintsPage from '../pages/admin/ManageComplaintsPage'
import StaffDashboard from '../pages/staff/StaffDashboard'
import StaffComplaintDetails from '../pages/staff/StaffComplaintDetailsPage'
import StaffManagementPage from '../pages/admin/StaffManagementPage'
import ManageSuggestionsPage from '../pages/admin/ManageSuggestionsPage'


function AppRoutes() {
  return (
    <Routes>
      {/* Homepage */}
      <Route path="/" element={<App />} />

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student Dashboard */}
      <Route
        path="/dashboard"
        element={<StudentDashboard />}
      />

      <Route
        path="/student/dashboard"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Student Complaints */}
      <Route
        path="/student/complaints"
        element={<MyComplaintsPage />}
      />

      <Route
        path="/student/complaints/new"
        element={<SubmitComplaintPage />}
      />

      {/* Complaint Details */}
      <Route
        path="/student/complaints/:id"
        element={<ComplaintDetailsPage />}
      />

      {/* Student Notifications */}
      <Route
        path="/student/notifications"
        element={<NotificationsPage />}
      />

      {/* Student Suggestions */}
      <Route
        path="/student/suggestions"
        element={<SuggestionsPage />}
      />

      {/* Student Profile */}
      <Route
        path="/student/profile"
        element={<ProfilePage />}
      />
{/* Admin Dashboard */}
<Route
  path="/admin"
  element={<Navigate to="/admin/dashboard" replace />}
/>

<Route
  path="/admin/dashboard"
  element={<AdminDashboard />}
/>

<Route
  path="/admin/complaints"
  element={<ManageComplaintsPage />}
/>

<Route
  path="/admin/staff"
  element={<StaffManagementPage />}
/>

<Route
  path="/staff/dashboard"
  element={<StaffDashboard />}
/>

<Route
  path="/staff/complaints/:id"
  element={<StaffComplaintDetails />}
/>
<Route
  path="/admin/suggestions"
  element={<ManageSuggestionsPage />}
/>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default AppRoutes