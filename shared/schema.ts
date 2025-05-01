import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  address: text("address").notNull(),
  rice_total: integer("rice_total").notNull().default(100),
  rice_left: integer("rice_left").notNull().default(100),
  player_id: text("player_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, canceled
  address: text("address").notNull(),
  note: text("note"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at"),
});

// Admin access table
export const adminAccess = pgTable("admin_access", {
  access_token: text("access_token").primaryKey(),
  expires: timestamp("expires"),
  code_verifier: text("code_verifier"), // For PKCE
});

// Zalo settings table
export const zaloSettings = pgTable("zalo_settings", {
  id: uuid("id").primaryKey(),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  expires_at: timestamp("expires_at"),
  oa_name: text("oa_name"),
  send_new_order_notification: boolean("send_new_order_notification").notNull().default(true),
  send_status_update_notification: boolean("send_status_update_notification").notNull().default(true),
  code_verifier: text("code_verifier"), // For PKCE
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // order, status, system
  read: boolean("read").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  notifications: many(notifications),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.user_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

// Zod validation schemas
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  phone: z.string().min(10, "Số điện thoại phải hợp lệ"),
  address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
  rice_total: z.coerce.number().min(10, "Số lượng gạo tối thiểu là 10kg"),
});

export const insertOrderSchema = createInsertSchema(orders, {
  quantity: z.coerce.number().min(1, "Số lượng tối thiểu là 1kg"),
  address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "completed", "canceled"], {
    errorMap: () => ({ message: "Trạng thái không hợp lệ" }),
  }),
});

export const updateZaloSettingsSchema = z.object({
  send_new_order_notification: z.boolean().optional(),
  send_status_update_notification: z.boolean().optional(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type AdminAccess = typeof adminAccess.$inferSelect;
export type ZaloSetting = typeof zaloSettings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// Complex types
export type OrderWithUser = Order & { user: User };
