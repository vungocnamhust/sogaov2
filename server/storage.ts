import { db } from '@db';
import { 
  users, 
  orders, 
  adminAccess, 
  zaloSettings, 
  notifications,
  User,
  Order, 
  AdminAccess,
  ZaloSetting,
  Notification,
  OrderWithUser
} from '@shared/schema';
import { eq, and, desc, asc, like, or, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users
export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result.length > 0 ? result[0] : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.phone, phone));
  return result.length > 0 ? result[0] : null;
}

export async function createUser(data: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const newUser = {
    ...data,
    id: uuid(),
    created_at: new Date(),
  };
  const [user] = await db.insert(users).values(newUser).returning();
  return user;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  const [updatedUser] = await db.update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  
  return updatedUser || null;
}

export async function updateUserPlayerID(id: string, player_id: string): Promise<User | null> {
  return updateUser(id, { player_id });
}

// Orders
export async function createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  const newOrder = {
    ...data,
    id: uuid(),
    created_at: new Date(),
    updated_at: null,
  };
  const [order] = await db.insert(orders).values(newOrder).returning();
  return order;
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  return db.select()
    .from(orders)
    .where(eq(orders.user_id, userId))
    .orderBy(desc(orders.created_at));
}

export async function getOrderById(id: string): Promise<OrderWithUser | null> {
  const result = await db.select({
    id: orders.id,
    user_id: orders.user_id,
    quantity: orders.quantity,
    status: orders.status,
    created_at: orders.created_at,
    updated_at: orders.updated_at,
    address: orders.address,
    note: orders.note,
    user: {
      id: users.id,
      name: users.name,
      phone: users.phone,
      address: users.address,
      rice_total: users.rice_total,
      rice_left: users.rice_left,
      player_id: users.player_id,
    }
  })
  .from(orders)
  .innerJoin(users, eq(orders.user_id, users.id))
  .where(eq(orders.id, id));
  
  return result.length > 0 ? result[0] : null;
}

export async function updateOrderStatus(id: string, status: string): Promise<Order | null> {
  const [updatedOrder] = await db.update(orders)
    .set({ 
      status,
      updated_at: new Date()
    })
    .where(eq(orders.id, id))
    .returning();
  
  return updatedOrder || null;
}

export async function getAllOrdersWithUsers(page: number = 1, limit: number = 10, statusFilter?: string, search?: string): Promise<{orders: OrderWithUser[], total: number, totalPending: number, totalCompleted: number, totalCanceled: number}> {
  // Build the query conditionally
  let query = db.select({
    id: orders.id,
    user_id: orders.user_id,
    quantity: orders.quantity,
    status: orders.status,
    created_at: orders.created_at,
    updated_at: orders.updated_at,
    address: orders.address,
    note: orders.note,
    user: {
      id: users.id,
      name: users.name,
      phone: users.phone,
      address: users.address,
      rice_total: users.rice_total,
      rice_left: users.rice_left,
      player_id: users.player_id,
    }
  })
  .from(orders)
  .innerJoin(users, eq(orders.user_id, users.id));

  // Apply filters
  const conditions = [];
  
  if (statusFilter && statusFilter !== 'all') {
    conditions.push(eq(orders.status, statusFilter));
  }
  
  if (search) {
    conditions.push(or(
      like(users.name, `%${search}%`),
      like(users.phone, `%${search}%`),
      like(orders.address, `%${search}%`)
    ));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Get all orders for counts
  const allOrders = await db.select({ 
    id: orders.id, 
    status: orders.status 
  }).from(orders);
  
  // Count totals
  const total = conditions.length > 0 
    ? (await query.execute()).length 
    : allOrders.length;
    
  const totalPending = allOrders.filter(o => o.status === 'pending').length;
  const totalCompleted = allOrders.filter(o => o.status === 'completed').length;
  const totalCanceled = allOrders.filter(o => o.status === 'canceled').length;

  // Apply pagination
  const offset = (page - 1) * limit;
  const ordersList = await query
    .orderBy(desc(orders.created_at))
    .limit(limit)
    .offset(offset);

  return {
    orders: ordersList,
    total,
    totalPending,
    totalCompleted,
    totalCanceled
  };
}

// Admin Access
export async function getAdminAccessByToken(token: string): Promise<AdminAccess | null> {
  const result = await db.select()
    .from(adminAccess)
    .where(eq(adminAccess.access_token, token));
  
  return result.length > 0 ? result[0] : null;
}

export async function saveAdminAccessToken(token: string, expiresIn?: number): Promise<AdminAccess> {
  const expires = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
  
  // Check if token already exists
  const existingToken = await getAdminAccessByToken(token);
  
  if (existingToken) {
    // Update existing token
    const [updatedToken] = await db.update(adminAccess)
      .set({ expires: expires as any })
      .where(eq(adminAccess.access_token, token))
      .returning();
    
    return updatedToken;
  } else {
    // Create new token
    const [newToken] = await db.insert(adminAccess)
      .values({ access_token: token, expires: expires as any })
      .returning();
    
    return newToken;
  }
}

// Zalo Settings
export async function getZaloSettings(): Promise<ZaloSetting | null> {
  const result = await db.select().from(zaloSettings).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveZaloSettings(data: Partial<ZaloSetting>): Promise<ZaloSetting> {
  const settings = await getZaloSettings();
  
  if (settings) {
    // Update existing settings
    const [updatedSettings] = await db.update(zaloSettings)
      .set(data)
      .where(eq(zaloSettings.id, settings.id))
      .returning();
    
    return updatedSettings;
  } else {
    // Create new settings
    const [newSettings] = await db.insert(zaloSettings)
      .values({
        id: uuid(),
        access_token: data.access_token || null,
        refresh_token: data.refresh_token || null,
        expires_at: data.expires_at || null,
        oa_name: data.oa_name || null,
        send_new_order_notification: data.send_new_order_notification !== undefined 
          ? data.send_new_order_notification 
          : true,
        send_status_update_notification: data.send_status_update_notification !== undefined
          ? data.send_status_update_notification
          : true,
      })
      .returning();
    
    return newSettings;
  }
}

export async function disconnectZalo(): Promise<void> {
  const settings = await getZaloSettings();
  
  if (settings) {
    await db.update(zaloSettings)
      .set({
        access_token: null,
        refresh_token: null,
        expires_at: null,
        oa_name: null,
      })
      .where(eq(zaloSettings.id, settings.id));
  }
}

// Notifications
export async function createNotification(data: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
  const newNotification = {
    ...data,
    id: uuid(),
    created_at: new Date(),
  };
  const [notification] = await db.insert(notifications).values(newNotification).returning();
  return notification;
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
  return db.select()
    .from(notifications)
    .where(eq(notifications.user_id, userId))
    .orderBy(desc(notifications.created_at));
}
