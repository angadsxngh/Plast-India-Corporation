// Centralized API base URL configuration
export const API_BASE_URL = import.meta.env.VITE_BASE_URL || "https://plast-india-corporation.onrender.com";

// Helper function to get auth headers (for cross-origin cookie issues)
export const getAuthHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  
  // Get token from localStorage as fallback for cross-origin cookie issues
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function for authenticated fetch requests
export const authenticatedFetch = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Still try cookies first
  });
};

