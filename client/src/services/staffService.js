import apiRequest from './api.js';

// Get complaints assigned to the logged-in staff member
export async function getMyStaffComplaints() {
  return apiRequest('/staff/complaints', {
    method: 'GET',
  });
}

// Get details of one assigned complaint
export async function getStaffComplaintById(id) {
  return apiRequest(
    `/staff/complaints/${encodeURIComponent(id)}`,
    {
      method: 'GET',
    }
  );
}

// Update complaint status
export async function updateStaffComplaintStatus(id, status, resolutionNote = '') {
  return apiRequest(
    `/staff/complaints/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        resolutionNote,
      }),
    }
  );
}
// Upload repair photos to the backend
export async function uploadStaffRepairPhotos(id, files) {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append('images', file);
  });

  return apiRequest(
    `/staff/complaints/${encodeURIComponent(id)}/repair-photos`,
    {
      method: 'POST',
      body: formData,
    }
  );
}