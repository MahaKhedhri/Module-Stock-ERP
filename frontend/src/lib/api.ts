const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let response: Response;

  try {
    response = await fetch(url, config);
  } catch (error: any) {
    // Handle network errors (backend not running, CORS issues, etc.)
    console.error('Network error:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError(0, `Cannot connect to backend server at ${API_BASE_URL}. Please make sure the backend is running.`);
    }
    throw new ApiError(0, `Network error: ${error.message || 'Failed to connect to server'}`);
  }

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const error = await response.json();
      errorMessage = error.error?.message || error.message || 'Request failed';
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || 'Request failed';
    }
    throw new ApiError(response.status, errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(response.status, 'Invalid response from server');
  }
}

// Categories API
export const categoriesApi = {
  getAll: () => request<any[]>('/categories'),
  getById: (id: string) => request<any>(`/categories/${id}`),
  create: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => request<any[]>('/suppliers'),
  getById: (id: string) => request<any>(`/suppliers/${id}`),
  create: (data: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),
};

// Products API
export const productsApi = {
  getAll: () => request<any[]>('/products'),
  getById: (id: string) => request<any>(`/products/${id}`),
  create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  adjustStock: (id: string, quantity: number, note?: string) =>
    request<any>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity, note }),
    }),
};

// Purchase Orders API
export const purchaseOrdersApi = {
  getAll: () => request<any[]>('/purchase-orders'),
  getById: (id: string) => request<any>(`/purchase-orders/${id}`),
  create: (data: any) => request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/purchase-orders/${id}`, { method: 'DELETE' }),
  receive: (id: string) => request<any>(`/purchase-orders/${id}/receive`, { method: 'POST' }),
};

// Stock Movements API
export const stockMovementsApi = {
  getAll: () => request<any[]>('/stock-movements'),
  getById: (id: string) => request<any>(`/stock-movements/${id}`),
  create: (data: any) => request<any>('/stock-movements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/stock-movements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/stock-movements/${id}`, { method: 'DELETE' }),
};

// Alerts API
export const alertsApi = {
  getLowStock: () => request<any[]>('/alerts/low-stock'),
};

// Reports API
export const reportsApi = {
  getDashboardStats: () => request<any>('/reports/dashboard-stats'),
  getStockValuation: () => request<any[]>('/reports/stock-valuation'),
};

export { ApiError };

