import apiRequest from './api.js';

// Get all complaints
export async function getAllComplaints() {
  return apiRequest('/admin/complaints', {
    method: 'GET',
  });
}

// Get active staff
export async function getActiveStaff() {
  return apiRequest('/admin/staff', {
    method: 'GET',
  });
}

// Get pending staff registrations
export async function getPendingStaff() {
  return apiRequest('/admin/staff/pending', {
    method: 'GET',
  });
}

// Approve staff registration
export async function approveStaff(staffId) {
  return apiRequest(
    `/admin/staff/${encodeURIComponent(staffId)}/approve`,
    {
      method: 'PATCH',
    }
  );
}

// Reject staff registration
export async function rejectStaff(staffId) {
  return apiRequest(
    `/admin/staff/${encodeURIComponent(staffId)}/reject`,
    {
      method: 'PATCH',
    }
  );
}

// Assign complaint to staff
export async function assignComplaint(complaintId, staffId) {
  return apiRequest(
    `/admin/complaints/${encodeURIComponent(complaintId)}/assign`,
    {
      method: 'PATCH',
      body: JSON.stringify({ staffId }),
    }
  );
}