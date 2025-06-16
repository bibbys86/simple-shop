const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: logger.stream }));

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/simple_shop', {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg)
});

// Import models
const Product = require('./models/Product')(sequelize);
const Cart = require('./models/Cart')(sequelize);
const CartItem = require('./models/CartItem')(sequelize);
const Order = require('./models/Order')(sequelize);
const OrderItem = require('./models/OrderItem')(sequelize);

// Initialize model associations
const models = {
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem
};

Object.values(models).forEach(model => {
  if (model.associate) {
    logger.debug('Initializing associations for model', { modelName: model.name });
    model.associate(models);
  }
});

// Define associations
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'CartItems' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'Product' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'CartItems' });

// Initialize database and start server
async function initializeDatabase() {
  try {
    // Sync database with force to reset all data
    await sequelize.sync({ force: true })
    logger.info('Database synced with force')

    // Seed products
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone',
        price: 999.00,
        category: 'iPhone',
        image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'iPad Pro',
        description: 'Powerful iPad',
        price: 799.00,
        category: 'iPad',
        image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'MacBook Air',
        description: 'Lightweight laptop',
        price: 1199.00,
        category: 'Mac',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Apple Watch',
        description: 'Smart watch',
        price: 399.00,
        category: 'Watch',
        image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds',
        price: 249.00,
        category: 'AirPods',
        image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'iPhone 15',
        description: 'Affordable iPhone',
        price: 799.00,
        category: 'iPhone',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'iPad Air',
        description: 'Lightweight iPad',
        price: 599.00,
        category: 'iPad',
        image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'MacBook Pro',
        description: 'High performance laptop',
        price: 1999.00,
        category: 'Mac',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Apple Watch SE',
        description: 'Affordable smart watch',
        price: 279.00,
        category: 'Watch',
        image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'AirPods Max',
        description: 'Premium over-ear headphones',
        price: 549.00,
        category: 'AirPods',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
      }
    ]

    await Product.bulkCreate(products)
    logger.info('Products seeded')

    // Create default cart for testing
    await Cart.create({
      sessionId: '8c85c569-a597-4a15-9436-32e7270ed42c'
    })
    logger.info('Default cart created')
  } catch (error) {
    logger.error('Error initializing database', error)
    throw error
  }
}

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', { error: error.message });
  }
}

testConnection();

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  logger.info('Home route accessed');
  res.json({ message: 'Welcome to Simple Shop API' });
});

// Cart API endpoints
app.post('/api/cart', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const cart = await Cart.create({ sessionId });
    logger.info('Cart created', { cartId: cart.id, sessionId });
    res.json({ cartId: cart.id, sessionId });
  } catch (error) {
    logger.error('Error creating cart', error);
    res.status(500).json({ error: 'Failed to create cart' });
  }
});

app.get('/api/cart/:sessionId', async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { sessionId: req.params.sessionId },
      include: [{
        model: CartItem,
        as: 'CartItems',
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['id', 'name', 'price', 'image', 'description']
        }]
      }]
    });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    logger.error('Error retrieving cart', error);
    res.status(500).json({ message: 'Error retrieving cart' });
  }
});

app.post('/api/cart/:sessionId/items', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({
      where: { sessionId: req.params.sessionId },
      include: [{
        model: CartItem,
        as: 'CartItems'
      }]
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const existingItem = cart.CartItems.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId,
        quantity
      });
    }

    // Get updated cart with items
    const updatedCart = await Cart.findOne({
      where: { sessionId: req.params.sessionId },
      include: [{
        model: CartItem,
        as: 'CartItems',
        include: [{
          model: Product,
          as: 'Product'
        }]
      }]
    });

    res.json(updatedCart);
  } catch (error) {
    logger.error('Error adding item to cart', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
});

app.delete('/api/cart/:sessionId/items/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { sessionId: req.params.sessionId } });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    await CartItem.destroy({
      where: { cartId: cart.id, productId: req.params.productId }
    });

    logger.info('Cart item removed', { 
      cartId: cart.id, 
      productId: req.params.productId 
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    logger.error('Error removing item from cart', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Products API endpoint
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    logger.info('Products retrieved', { count: products.length });
    res.json(products);
  } catch (error) {
    logger.error('Error retrieving products', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Checkout endpoint
app.post('/api/checkout', async (req, res) => {
  try {
    const { sessionId, shippingAddress, paymentMethod } = req.body;

    // Get cart and items
    const cart = await Cart.findOne({
      where: { sessionId },
      include: [{
        model: CartItem,
        include: [Product]
      }]
    });

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cart.CartItems.reduce((total, item) => {
      return total + (item.Product.price * item.quantity);
    }, 0);

    // Create order
    const order = await Order.create({
      sessionId,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Create order items
    await Promise.all(cart.CartItems.map(item => 
      OrderItem.create({
        orderId: order.id,
        productId: item.Product.id,
        quantity: item.quantity,
        price: item.Product.price
      })
    ));

    // Clear cart
    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    logger.info('Order created', { 
      orderId: order.id,
      totalAmount,
      itemCount: cart.CartItems.length
    });

    res.json({
      orderId: order.id,
      totalAmount,
      status: order.status
    });
  } catch (error) {
    logger.error('Error creating order', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order details
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId },
      include: [{
        model: OrderItem,
        include: [Product]
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info('Order retrieved', { orderId: order.id });
    res.json(order);
  } catch (error) {
    logger.error('Error retrieving order', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ error: 'Internal Server Error' });
}); 