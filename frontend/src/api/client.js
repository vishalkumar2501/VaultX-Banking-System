import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_STORAGE_KEY = 'aegisledger_auth_token'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function saveAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  )
}

export const healthApi = {
  check: () => apiClient.get('/health').then((r) => r.data)
}

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data)
}

export const accountApi = {
  createAccount: (currency = 'INR') => apiClient.post('/accounts', { currency }).then((r) => r.data),
  getAccounts: () => apiClient.get('/accounts').then((r) => r.data),
  getBalance: (accountId) => apiClient.get(`/accounts/balance/${accountId}`).then((r) => r.data),
  updateStatus: (accountId, status) =>
    apiClient.patch(`/accounts/${accountId}/status`, { status }).then((r) => r.data),
  lookup: (query) => apiClient.get('/accounts/lookup', { params: { query } }).then((r) => r.data)
}

export const transactionApi = {
  getHistory: (params = {}) => apiClient.get('/transactions', { params }).then((r) => r.data),
  getLedger: (params = {}) => apiClient.get('/transactions/ledger', { params }).then((r) => r.data),
  transfer: (payload) => apiClient.post('/transactions', payload).then((r) => r.data),
  mintInitialFunds: (payload) => apiClient.post('/transactions/system/initial-funds', payload).then((r) => r.data)
}
