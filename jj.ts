import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PRODUCT SCHEMA
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
});

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true })
  .extend({
    costPrice: z.number().min(0.01, "Cost price must be greater than 0"),
    sellingPrice: z.number().min(0.01, "Selling price must be greater than 0"),
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
    reorderLevel: z.number().int().min(1, "Reorder level must be at least 1"),
  });

// ORDER SCHEMA
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supplier: text("supplier").notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true })
  .extend({
    supplier: z.string().min(1, "Supplier is required"),
    expectedDeliveryDate: z.string().or(z.date()),
  });

// ORDER ITEM SCHEMA
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id), // Ensure foreign key constraint
  productId: integer("product_id").notNull().references(() => products.id), // Ensure foreign key constraint
  quantity: integer("quantity").notNull().default(1), // Default value for quantity
});

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true })
  .extend({
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
  });

// TYPES
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// EXTENDED TYPES FOR FRONTEND
export interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product })[];
}

export interface ProductWithStatus extends Product {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  profit: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockItems: number;
  profitableItems: number;
  lossItems: number;
}

export interface ProfitData {
  month: string;
  profit: number;
  loss: number;
}

export interface Alert {
  id: number;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
}
