<template>
  <div class="cart-container">
    <h1>Shopping Cart</h1>
    
    <div v-if="loading" class="loading">
      Loading cart...
    </div>
    
    <div v-else-if="!cart || !cart.CartItems || cart.CartItems.length === 0" class="empty-cart">
      <p>Your cart is empty</p>
      <router-link to="/products" class="btn">Continue Shopping</router-link>
    </div>
    
    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in cart.CartItems" :key="item.id" class="cart-item">
          <img v-if="item.Product && item.Product.image" :src="item.Product.image" :alt="item.Product.name" class="item-image">
          <div class="item-details">
            <h3>{{ item.Product ? item.Product.name : 'Unknown Product' }}</h3>
            <p class="price">${{ item.Product ? item.Product.price : '0.00' }}</p>
            <div class="quantity-controls">
              <button @click="updateQuantity(item.Product ? item.Product.id : null, item.quantity - 1)" :disabled="item.quantity <= 1">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="updateQuantity(item.Product ? item.Product.id : null, item.quantity + 1)">+</button>
            </div>
          </div>
          <button @click="removeItem(item.Product ? item.Product.id : null)" class="remove-btn">Remove</button>
        </div>
      </div>

      <div class="cart-summary">
        <h2>Order Summary</h2>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${{ subtotal }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>${{ shipping }}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>${{ total }}</span>
        </div>

        <form @submit.prevent="checkout" class="checkout-form">
          <h3>Shipping Information</h3>
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" v-model="shippingInfo.name" required>
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <input type="text" id="address" v-model="shippingInfo.address" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="city">City</label>
              <input type="text" id="city" v-model="shippingInfo.city" required>
            </div>
            <div class="form-group">
              <label for="state">State</label>
              <input type="text" id="state" v-model="shippingInfo.state" required>
            </div>
            <div class="form-group">
              <label for="zip">ZIP Code</label>
              <input type="text" id="zip" v-model="shippingInfo.zip" required>
            </div>
          </div>

          <h3>Payment Method</h3>
          <div class="form-group">
            <select v-model="paymentMethod" required>
              <option value="">Select Payment Method</option>
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <button type="submit" class="checkout-btn" :disabled="checkingOut">
            {{ checkingOut ? 'Processing...' : 'Proceed to Checkout' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '../services/api'
import logger from '../utils/logger'

export default {
  name: 'Cart',
  data() {
    return {
      cart: null,
      loading: true,
      checkingOut: false,
      shippingInfo: {
        name: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      },
      paymentMethod: '',
      shipping: 5.99 // Fixed shipping cost
    }
  },
  computed: {
    subtotal() {
      if (!this.cart || !this.cart.CartItems) return 0;
      return this.cart.CartItems.reduce((total, item) => {
        return total + (item.Product ? item.Product.price * item.quantity : 0);
      }, 0);
    },
    total() {
      return this.subtotal + this.shipping;
    }
  },
  methods: {
    async loadCart() {
      try {
        const sessionId = localStorage.getItem('cartSessionId');
        if (!sessionId) {
          this.error = 'No cart session found';
          return;
        }

        logger.info('Loading cart', { sessionId });
        const data = await apiService.getCart(sessionId);
        
        if (!data || !data.CartItems || data.CartItems.length === 0) {
          this.error = 'Your cart is empty';
        } else {
          this.cart = data;
        }
        this.loading = false;
      } catch (error) {
        logger.error('Error loading cart', error);
        this.error = 'Failed to load cart. Please try again.';
        this.loading = false;
      }
    },
    async updateQuantity(productId, newQuantity) {
      if (newQuantity < 1) return;
      
      try {
        const sessionId = localStorage.getItem('cartSessionId');
        await apiService.updateCartItem(sessionId, productId, newQuantity);
        await this.loadCart();
      } catch (error) {
        logger.error('Error updating quantity', error);
        alert('Failed to update quantity. Please try again.');
      }
    },
    async removeItem(productId) {
      try {
        const sessionId = localStorage.getItem('cartSessionId');
        await apiService.removeCartItem(sessionId, productId);
        await this.loadCart();
      } catch (error) {
        logger.error('Error removing item', error);
        alert('Failed to remove item. Please try again.');
      }
    },
    async checkout() {
      if (this.checkingOut) return;
      
      try {
        this.checkingOut = true;
        const sessionId = localStorage.getItem('cartSessionId');
        
        const order = await apiService.createOrder(
          sessionId,
          this.shippingInfo,
          this.paymentMethod
        );
        
        localStorage.removeItem('cartSessionId'); // Clear cart session
        
        // Redirect to order confirmation
        this.$router.push(`/order-confirmation/${order.orderId}`);
      } catch (error) {
        logger.error('Error during checkout', error);
        alert('Failed to process checkout. Please try again.');
      } finally {
        this.checkingOut = false;
      }
    }
  },
  created() {
    this.loadCart();
  }
}
</script>

<style scoped>
.cart-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .empty-cart {
  text-align: center;
  padding: 40px;
}

.cart-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.cart-items {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.cart-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quantity-controls button {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.quantity-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  padding: 8px 16px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cart-summary {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.summary-row.total {
  font-size: 1.2em;
  font-weight: bold;
  border-top: 2px solid #eee;
  padding-top: 10px;
  margin-top: 10px;
}

.checkout-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkout-btn {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1em;
  cursor: pointer;
  margin-top: 20px;
}

.checkout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .cart-content {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style> 