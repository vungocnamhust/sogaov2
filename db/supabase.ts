import { createClient } from '@supabase/supabase-js';
import type { User, Order, AdminAccess, ZaloSetting, Notification } from '@shared/schema';
import { v4 as uuid } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

// User functions
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data as User;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('phone', phone)
    .single();
  
  if (error || !data) return null;
  return data as User;
}

export async function createUser(data: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const userId = uuid();
  const newUser = {
    id: userId,
    ...data,
    created_at: new Date().toISOString()
  };
  
  const { data: createdUser, error } = await supabase
    .from('users')
    .insert(newUser)
    .select()
    .single();
  
  if (error) throw error;
  return createdUser as User;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return updatedUser as User;
}

export async function updateUserPlayerID(id: string, player_id: string): Promise<User | null> {
  return updateUser(id, { player_id });
}

// Order functions
export async function createOrder(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
  const orderId = uuid();
  const newOrder = {
    id: orderId,
    ...data,
    created_at: new Date().toISOString()
  };
  
  const { data: createdOrder, error } = await supabase
    .from('orders')
    .insert(newOrder)
    .select()
    .single();
  
  if (error) throw error;
  return createdOrder as Order;
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Order[];
}

export interface OrderWithUser extends Order {
  user: User;
}

export async function getOrderById(id: string): Promise<OrderWithUser | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:user_id (*)
    `)
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data as unknown as OrderWithUser;
}

export async function updateOrderStatus(id: string, status: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Order;
}

export async function getAllOrdersWithUsers(
  page: number = 1, 
  limit: number = 10, 
  statusFilter?: string, 
  search?: string
): Promise<{ 
  orders: OrderWithUser[], 
  total: number, 
  totalPending: number, 
  totalCompleted: number, 
  totalCanceled: number
}> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      user:user_id (*)
    `, { count: 'exact' });
  
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  
  if (search) {
    query = query.or(`user.name.ilike.%${search}%,user.phone.ilike.%${search}%`);
  }
  
  // Get paginated results
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  if (error) throw error;
  
  // Get status counts for dashboard stats
  const [pendingCount, completedCount, canceledCount] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact' }).eq('status', 'pending').then(res => res.count || 0),
    supabase.from('orders').select('*', { count: 'exact' }).eq('status', 'completed').then(res => res.count || 0),
    supabase.from('orders').select('*', { count: 'exact' }).eq('status', 'canceled').then(res => res.count || 0)
  ]);
  
  return {
    orders: data as unknown as OrderWithUser[],
    total: count || 0,
    totalPending: pendingCount,
    totalCompleted: completedCount,
    totalCanceled: canceledCount
  };
}

// Admin functions
export async function getAdminAccessByToken(token: string): Promise<AdminAccess | null> {
  const { data, error } = await supabase
    .from('admin_access')
    .select()
    .eq('access_token', token)
    .single();
  
  if (error || !data) return null;
  return data as AdminAccess;
}

export async function saveAdminAccessToken(token: string, expiresIn?: number): Promise<AdminAccess> {
  // Check if token exists
  const existingToken = await getAdminAccessByToken(token);
  
  const expires = expiresIn 
    ? new Date(Date.now() + expiresIn * 1000).toISOString() 
    : null;
  
  if (existingToken) {
    // Update existing token
    const { data, error } = await supabase
      .from('admin_access')
      .update({ expires })
      .eq('access_token', token)
      .select()
      .single();
    
    if (error) throw error;
    return data as AdminAccess;
  } else {
    // Create new token
    const { data, error } = await supabase
      .from('admin_access')
      .insert({ access_token: token, expires })
      .select()
      .single();
    
    if (error) throw error;
    return data as AdminAccess;
  }
}

// Zalo settings functions
export async function getZaloSettings(): Promise<ZaloSetting | null> {
  const { data, error } = await supabase
    .from('zalo_settings')
    .select()
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) return null;
  return data as ZaloSetting;
}

export async function saveZaloSettings(data: Partial<ZaloSetting>): Promise<ZaloSetting> {
  // Check if settings exist
  const existingSettings = await getZaloSettings();
  
  if (existingSettings) {
    // Update existing settings
    const { data: updatedData, error } = await supabase
      .from('zalo_settings')
      .update(data)
      .eq('id', existingSettings.id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData as ZaloSetting;
  } else {
    // Create new settings
    const { data: newData, error } = await supabase
      .from('zalo_settings')
      .insert({
        id: uuid(),
        ...data
      })
      .select()
      .single();
    
    if (error) throw error;
    return newData as ZaloSetting;
  }
}

export async function disconnectZalo(): Promise<void> {
  const settings = await getZaloSettings();
  if (settings) {
    await supabase
      .from('zalo_settings')
      .update({
        access_token: null,
        refresh_token: null,
        expires_at: null,
        oa_name: null
      })
      .eq('id', settings.id);
  }
}

// Notification functions
export async function createNotification(data: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
  const notificationId = uuid();
  const newNotification = {
    id: notificationId,
    ...data,
    created_at: new Date().toISOString()
  };
  
  const { data: createdNotification, error } = await supabase
    .from('notifications')
    .insert(newNotification)
    .select()
    .single();
  
  if (error) throw error;
  return createdNotification as Notification;
}

export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Notification[];
}