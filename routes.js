import express from 'express';
import { storage } from './storage.js';

const router = express.Router();

// Product routes
router.get('/products', async (req, res) => {
  try {
    const products = await storage.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await storage.getProduct(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await storage.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const product = await storage.updateProduct(parseInt(req.params.id), req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const success = await storage.deleteProduct(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order routes
router.get('/orders', async (req, res) => {
  try {
    const orders = await storage.getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { order, items } = req.body;
    const newOrder = await storage.createOrder(order, items);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dashboard routes
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard/profit-loss', async (req, res) => {
  try {
    const data = await storage.getProfitLossData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard/alerts', async (req, res) => {
  try {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
