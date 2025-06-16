<template>
  <div class="products-page">
    <h1 class="title">Apple Products</h1>
    <div class="category-buttons">
      <button
        v-for="category in ['All', ...categories]"
        :key="category"
        @click="selectedCategory = category"
        :class="['category-button', { selected: selectedCategory === category }]"
      >
        {{ category }}
      </button>
    </div>
    <div class="products-list">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <img :src="product.image" :alt="product.name">
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="description">{{ product.description }}</p>
          <p class="price">${{ product.price }}</p>
          <button @click="addToCart(product)" class="add-to-cart">Add to Cart</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import logger from '../utils/logger'
import { apiService } from '../services/api'

const selectedCategory = ref('All')
const products = ref([])
const categories = ref([])

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'All') return products.value
  return products.value.filter(product => product.category === selectedCategory.value)
})

const loadProducts = async () => {
  try {
    const data = await apiService.getProducts()
    products.value = data
    // 카테고리 목록 추출
    const uniqueCategories = Array.from(new Set(data.map(p => p.category)))
    categories.value = uniqueCategories
    logger.info('Products loaded', { count: products.value.length })
  } catch (error) {
    logger.error('Error loading products', error)
    alert('Failed to load products')
  }
}

const addToCart = async (product) => {
  try {
    let sessionId = localStorage.getItem('cartSessionId')
    if (!sessionId) {
      // Create new cart if session doesn't exist
      const data = await apiService.createCart()
      sessionId = data.sessionId
      localStorage.setItem('cartSessionId', sessionId)
    }

    // Add item to cart
    await apiService.addToCart(sessionId, product.id, 1)
    
    logger.info('Product added to cart', { 
      productId: product.id,
      productName: product.name,
      price: product.price
    })
    alert('Product added to cart!')
  } catch (error) {
    logger.error('Error adding product to cart', error)
    alert('Failed to add product to cart')
  }
}

onMounted(() => {
  loadProducts()
  logger.info('Products page mounted', { 
    totalProducts: products.value.length
  })
})
</script>

<style scoped>
.products-page {
  padding: 2rem;
}

h1.title {
  text-align: center;
  margin-bottom: 2rem;
  color: #1d1d1f;
}

.category-buttons {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.category-button {
  min-width: 100px;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  border: 2px solid #2196f3;
  background: #fff;
  color: #2196f3;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-button.selected {
  background: #2196f3;
  color: #fff;
  border: 2px solid #2196f3;
}

.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-card img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.product-info {
  padding: 1.5rem;
}

.product-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1d1d1f;
  font-size: 1.2rem;
}

.description {
  color: #86868b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.price {
  color: #1d1d1f;
  font-weight: bold;
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.add-to-cart {
  width: 100%;
  padding: 0.8rem;
  background-color: #0071e3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-to-cart:hover {
  background-color: #0077ed;
}

@media (max-width: 768px) {
  .category-button {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }
}
</style> 