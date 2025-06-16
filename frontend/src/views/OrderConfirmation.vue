<template>
  <div class="order-confirmation">
    <div v-if="loading" class="loading">
      Loading order details...
    </div>
    
    <div v-else-if="error" class="error">
      <h2>Error</h2>
      <p>{{ error }}</p>
      <router-link to="/" class="btn">Return to Home</router-link>
    </div>
    
    <div v-else class="confirmation-content">
      <div class="success-message">
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been received.</p>
      </div>

      <div class="order-details">
        <h2>Order Details</h2>
        <div class="detail-row">
          <span>Order Number:</span>
          <span>{{ order.id }}</span>
        </div>
        <div class="detail-row">
          <span>Order Status:</span>
          <span class="status">{{ order.status }}</span>
        </div>
        <div class="detail-row">
          <span>Payment Status:</span>
          <span class="status">{{ order.paymentStatus }}</span>
        </div>
        <div class="detail-row">
          <span>Total Amount:</span>
          <span>${{ order.totalAmount }}</span>
        </div>
      </div>

      <div class="shipping-info">
        <h2>Shipping Information</h2>
        <div class="address-details">
          <p>{{ order.shippingAddress.name }}</p>
          <p>{{ order.shippingAddress.address }}</p>
          <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.zip }}</p>
        </div>
      </div>

      <div class="order-items">
        <h2>Order Items</h2>
        <div class="items-list">
          <div v-for="item in order.OrderItems" :key="item.id" class="order-item">
            <img :src="item.Product.image" :alt="item.Product.name" class="item-image">
            <div class="item-details">
              <h3>{{ item.Product.name }}</h3>
              <p class="quantity">Quantity: {{ item.quantity }}</p>
              <p class="price">${{ item.price }} each</p>
            </div>
            <div class="item-total">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <router-link to="/products" class="btn">Continue Shopping</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '../services/api'
import logger from '../utils/logger'

export default {
  name: 'OrderConfirmation',
  data() {
    return {
      order: null,
      loading: true,
      error: null
    }
  },
  methods: {
    async loadOrder() {
      try {
        const orderId = this.$route.params.orderId;
        this.order = await apiService.getOrder(orderId);
        logger.info('Order loaded', { orderId });
      } catch (error) {
        logger.error('Error loading order', error);
        this.error = 'Failed to load order details. Please try again later.';
      } finally {
        this.loading = false;
      }
    }
  },
  created() {
    this.loadOrder();
  }
}
</script>

<style scoped>
.order-confirmation {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.confirmation-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.success-message {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.success-message h1 {
  color: #4CAF50;
  margin-bottom: 10px;
}

.order-details, .shipping-info, .order-items {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.status {
  text-transform: capitalize;
  font-weight: 500;
}

.address-details p {
  margin: 5px 0;
}

.order-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details h3 {
  margin: 0 0 5px 0;
}

.quantity {
  color: #666;
  margin: 5px 0;
}

.price {
  color: #666;
}

.item-total {
  font-weight: bold;
  font-size: 1.1em;
}

.actions {
  text-align: center;
  margin-top: 30px;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .order-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .item-image {
    margin: 0 auto;
  }

  .item-total {
    text-align: center;
  }
}
</style> 