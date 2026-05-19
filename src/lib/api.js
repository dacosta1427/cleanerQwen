const API_BASE = 'http://localhost:3001/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  // Owners
  getOwners: () => fetchAPI('/owners'),
  getOwner: (id) => fetchAPI(`/owners/${id}`),
  createOwner: (data) => fetchAPI('/owners', { method: 'POST', body: JSON.stringify(data) }),
  updateOwner: (id, data) => fetchAPI(`/owners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOwner: (id) => fetchAPI(`/owners/${id}`, { method: 'DELETE' }),
  
  // Cost Profiles
  getCostProfiles: () => fetchAPI('/cost-profiles'),
  createCostProfile: (data) => fetchAPI('/cost-profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateCostProfile: (id, data) => fetchAPI(`/cost-profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCostProfile: (id) => fetchAPI(`/cost-profiles/${id}`, { method: 'DELETE' }),
  
  // Cleaners
  getCleaners: () => fetchAPI('/cleaners'),
  createCleaner: (data) => fetchAPI('/cleaners', { method: 'POST', body: JSON.stringify(data) }),
  updateCleaner: (id, data) => fetchAPI(`/cleaners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Houses
  getHouses: () => fetchAPI('/houses'),
  getHouse: (id) => fetchAPI(`/houses/${id}`),
  createHouse: (data) => fetchAPI('/houses', { method: 'POST', body: JSON.stringify(data) }),
  updateHouse: (id, data) => fetchAPI(`/houses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHouse: (id) => fetchAPI(`/houses/${id}`, { method: 'DELETE' }),
  
  // Bookings
  getBookings: () => fetchAPI('/bookings'),
  getBookingsByHouse: (houseId) => fetchAPI(`/bookings/house/${houseId}`),
  createBooking: (data) => fetchAPI('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => fetchAPI(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id) => fetchAPI(`/bookings/${id}`, { method: 'DELETE' }),
  
  // Cleaning Jobs
  getCleaningJobs: () => fetchAPI('/cleaning-jobs'),
  getPendingCleaningJobs: () => fetchAPI('/cleaning-jobs/pending'),
  getCleaningJob: (id) => fetchAPI(`/cleaning-jobs/${id}`),
  createCleaningJob: (data) => fetchAPI('/cleaning-jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateCleaningJob: (id, data) => fetchAPI(`/cleaning-jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCleaningJobStatus: (id, status) => fetchAPI(`/cleaning-jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCleaningJob: (id) => fetchAPI(`/cleaning-jobs/${id}`, { method: 'DELETE' }),
  
  // Invoices
  getInvoices: () => fetchAPI('/invoices'),
  getInvoice: (id) => fetchAPI(`/invoices/${id}`),
  generateInvoice: (cleaningJobId) => fetchAPI(`/invoices/generate/${cleaningJobId}`, { method: 'POST' }),
  updateInvoice: (id, data) => fetchAPI(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => fetchAPI(`/invoices/${id}`, { method: 'DELETE' }),
  
  // Dashboard
  getDashboardStats: () => fetchAPI('/dashboard/stats'),
};
