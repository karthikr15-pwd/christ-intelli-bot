const config = {
  // Use VITE_API_URL environment variable if available (e.g. on Vercel), otherwise fallback to localhost for development
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
};

export default config;
