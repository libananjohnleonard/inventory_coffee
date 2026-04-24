const LOCAL_API_URL = 'http://localhost:4001'
const isLocalBrowser =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)

const API_BASE_URL = (
  isLocalBrowser ? LOCAL_API_URL : import.meta.env.VITE_API_URL || LOCAL_API_URL
).replace(/\/$/, '')

const jsonHeaders = {
  'Content-Type': 'application/json',
}

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: jsonHeaders,
      ...options,
    })
  } catch {
    throw new Error('Cannot connect to the local API server. Launch BrixCafee backend and try again.')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || 'Request failed')
  }

  return response.json()
}

export const inventoryApi = {
  login: (payload) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getProfile: () => request('/api/profile'),
  updateProfile: (payload) =>
    request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateEmail: (payload) =>
    request('/api/profile/email', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updatePassword: (payload) =>
    request('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getProducts: () => request('/api/products'),
  createProduct: (payload) =>
    request('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (id, payload) =>
    request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) =>
    request(`/api/products/${id}`, {
      method: 'DELETE',
    }),
}
