import apiRequest from './api.js';

export async function createSuggestion(suggestionData) {
  return apiRequest('/suggestions', {
    method: 'POST',
    body: JSON.stringify(suggestionData),
  });
}

export async function getSuggestions() {
  return apiRequest('/suggestions', {
    method: 'GET',
  });
}

export async function voteForSuggestion(suggestionId) {
  return apiRequest(`/suggestions/${encodeURIComponent(suggestionId)}/vote`, {
    method: 'POST',
  });
}

export async function getAllSuggestions() {
  return apiRequest('/suggestions/admin', {
    method: 'GET',
  });
}

export async function updateSuggestionStatus(suggestionId, status, adminResponse = '') {
  return apiRequest(`/suggestions/admin/${encodeURIComponent(suggestionId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminResponse }),
  });
}