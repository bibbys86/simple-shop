import logger from '../utils/logger'

class ApiService {
  constructor() {
    this.baseUrl = '/api'
  }

  async fetchWithTrace(endpoint, options = {}) {
    const startTime = performance.now()
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const duration = performance.now() - startTime

      logger.info('API request completed', {
        endpoint,
        method: options.method || 'GET',
        duration: `${duration.toFixed(2)}ms`,
        status: response.status
      })

      return data
    } catch (error) {
      const duration = performance.now() - startTime
      logger.error('API request failed', error, {
        endpoint,
        method: options.method || 'GET',
        duration: `${duration.toFixed(2)}ms`
      })
      throw error
    }
  }

  // Products API
  async getProducts() {
    return this.fetchWithTrace('/products')
  }

  async getProductById(id) {
    return this.fetchWithTrace(`/products/${id}`)
  }

  // Cart API
  async createCart() {
    return this.fetchWithTrace('/cart', { method: 'POST' })
  }

  async getCart(sessionId) {
    return this.fetchWithTrace(`/cart/${sessionId}`)
  }

  async addToCart(sessionId, productId, quantity) {
    return this.fetchWithTrace(`/cart/${sessionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    })
  }

  async updateCartItem(sessionId, productId, quantity) {
    return this.fetchWithTrace(`/cart/${sessionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    })
  }

  async removeCartItem(sessionId, productId) {
    return this.fetchWithTrace(`/cart/${sessionId}/items/${productId}`, {
      method: 'DELETE'
    })
  }

  // Order API
  async createOrder(sessionId, shippingInfo, paymentMethod) {
    return this.fetchWithTrace('/checkout', {
      method: 'POST',
      body: JSON.stringify({ sessionId, shippingAddress: shippingInfo, paymentMethod })
    })
  }

  async getOrder(orderId) {
    return this.fetchWithTrace(`/orders/${orderId}`)
  }
}

export const apiService = new ApiService() 