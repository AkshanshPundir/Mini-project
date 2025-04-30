import { 
    products, orders, orderItems
  } from "./schema.js";
  import { db } from "./db.js";
  import { eq } from "drizzle-orm";
  
  export class DatabaseStorage {
    async getProducts() {
      const productList = await db.select().from(products);
      return productList.map(product => this.addProductStatus(product));
    }
  
    async getProduct(id) {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      if (!product) return undefined;
      return this.addProductStatus(product);
    }
  
    async createProduct(insertProduct) {
      const [product] = await db
        .insert(products)
        .values(insertProduct)
        .returning();
      return product;
    }
  
    async updateProduct(id, updateData) {
      const [product] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      return product;
    }
  
    async deleteProduct(id) {
      await db
        .delete(products)
        .where(eq(products.id, id));
      return true;
    }
  
    async getOrders() {
      const ordersList = await db.select().from(orders);
      const allOrderItems = await db.select().from(orderItems);
      const allProducts = await db.select().from(products);
      
      return ordersList.map(order => {
        const items = allOrderItems
          .filter(item => item.orderId === order.id)
          .map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) {
              throw new Error(`Product not found for orderItem ${item.id}`);
            }
            return { ...item, product };
          });
        
        return { ...order, items };
      });
    }
  
    async getOrder(id) {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      if (!order) return undefined;
      
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id));
      
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          
          if (!product) {
            throw new Error(`Product not found for orderItem ${item.id}`);
          }
          
          return { ...item, product };
        })
      );
      
      return { ...order, items: itemsWithProducts };
    }
  
    async createOrder(orderData, items) {
      // Create order
      const [order] = await db
        .insert(orders)
        .values(orderData)
        .returning();
      
      // Create order items
      for (const item of items) {
        await db
          .insert(orderItems)
          .values({ ...item, orderId: order.id });
        
        // Update product quantity
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        if (product) {
          await db
            .update(products)
            .set({ quantity: product.quantity + item.quantity })
            .where(eq(products.id, item.productId));
        }
      }
      
      return order;
    }
  
    async updateOrderStatus(id, status) {
      const [order] = await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();
      
      return order;
    }
  
    async getDashboardMetrics() {
      const allProducts = await this.getProducts();
      
      return {
        totalProducts: allProducts.length,
        lowStockItems: allProducts.filter(p => p.status === 'low-stock').length,
        profitableItems: allProducts.filter(p => p.profit > 0).length,
        lossItems: allProducts.filter(p => p.profit < 0).length
      };
    }
  
    async getProfitLossData() {
      // Generate profit/loss data for chart display
      return [
        { month: 'Jan', profit: 5000, loss: 2000 },
        { month: 'Feb', profit: 7000, loss: 1500 },
        { month: 'Mar', profit: 6500, loss: 2500 },
        { month: 'Apr', profit: 8000, loss: 3000 },
        { month: 'May', profit: 9500, loss: 2000 },
        { month: 'Jun', profit: 10000, loss: 2500 }
      ];
    }
  
    async getAlerts() {
      const products = await this.getProducts();
      
      const lowStockItems = products.filter(p => p.status === 'low-stock').length;
      const outOfStockItems = products.filter(p => p.status === 'out-of-stock').length;
      
      const alerts = [];
      
      if (lowStockItems > 0) {
        alerts.push({
          id: 1,
          type: 'warning',
          title: 'Low stock alert',
          message: `${lowStockItems} items are below reorder level`
        });
      }
      
      if (outOfStockItems > 0) {
        alerts.push({
          id: 2,
          type: 'error',
          title: 'Out of stock',
          message: `${outOfStockItems} products are completely out of stock`
        });
      }
      
      alerts.push({
        id: 3,
        type: 'info',
        title: 'Inventory check',
        message: 'Scheduled inventory check on Friday'
      });
      
      return alerts;
    }
  
    // HELPER METHODS
    addProductStatus(product) {
      const profit = parseFloat(product.sellingPrice.toString()) - parseFloat(product.costPrice.toString());
      
      let status;
      if (product.quantity <= 0) {
        status = 'out-of-stock';
      } else if (product.quantity <= product.reorderLevel) {
        status = 'low-stock';
      } else {
        status = 'in-stock';
      }
      
      return {
        ...product,
        status,
        profit
      };
    }
  }
  
  export const storage = new DatabaseStorage();
