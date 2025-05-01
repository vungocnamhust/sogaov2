// Redirect all database operations to Supabase
import type {
  User,
  Order,
  AdminAccess,
  ZaloSetting,
  Notification,
  OrderWithUser
} from "@shared/schema";

// Import all functions from Supabase implementation
import * as supabaseStorage from '../db/supabase';

// Re-export all functions from supabase.ts
export const {
  getUserById,
  getUserByPhone,
  createUser,
  updateUser,
  updateUserPlayerID,
  createOrder,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
  getAllOrdersWithUsers,
  getAdminAccessByToken,
  saveAdminAccessToken,
  getZaloSettings,
  saveZaloSettings,
  disconnectZalo,
  createNotification,
  getNotificationsByUserId
} = supabaseStorage;