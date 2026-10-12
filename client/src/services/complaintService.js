// Complaint API functions placeholder.
import apiRequest from './api.js';

// Student: Submit a complaint
export async function createComplaint(complaintData) {
  return apiRequest('/complaints', {
    method: 'POST',
    body:
      complaintData instanceof FormData
        ? complaintData
        : JSON.stringify(complaintData),
  });
}

// Student: Get my complaints
export async function getMyComplaints() {
  return apiRequest('/complaints/my', {
    method: 'GET',
  });
}

// Student: Get one complaint
export async function getComplaintById(id) {
  return apiRequest(`/complaints/${id}`, {
    method: 'GET',
  });
}

// Student: Confirm repair
export async function confirmComplaint(id) {
  return apiRequest(`/complaints/${id}/confirm`, {
    method: 'PATCH',
  });
}

// Student: Report repair not fixed
export async function reportComplaintNotFixed(id) {
  return apiRequest(`/complaints/${id}/not-fixed`, {
    method: 'PATCH',
  });
}