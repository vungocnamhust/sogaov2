import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { z } from "zod";
import { insertUserSchema, insertOrderSchema } from "@shared/schema";
import axios from "axios";
import crypto from "crypto";
import { ZodError } from "zod";
import session from "express-session";

// Extend the Express Request type to include session
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
      adminToken?: string;
    }
  }
}

// Admin token validation middleware
const validateAdminToken = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(" ")[1] || 
                req.cookies?.admin_token || 
                req.body?.admin_token;
  
  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy token xác thực." });
  }
  
  try {
    const adminAccess = await storage.getAdminAccessByToken(token);
    
    if (!adminAccess) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }
    
    if (adminAccess.expires && new Date(adminAccess.expires) < new Date()) {
      return res.status(401).json({ message: "Token đã hết hạn." });
    }
    
    // Store admin token in request for use in route handlers
    (req as any).adminToken = token;
    next();
  } catch (error) {
    console.error("Admin token validation error:", error);
    return res.status(500).json({ message: "Lỗi xác thực admin." });
  }
};

// User middleware to attach user from session to request
const attachUser = async (req: Request, res: Response, next: Function) => {
  if (req.session && 'userId' in req.session) {
    try {
      const userId = req.session.userId || '';
      const user = await storage.getUserById(userId);
      req.user = user;
    } catch (error) {
      console.error("Error attaching user:", error);
    }
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add middleware
  app.use(attachUser);
  
  // === USER ROUTES ===
  
  // Get current user
  app.get("/api/users/me", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy người dùng." });
    }
    
    return res.json(req.user);
  });
  
  // Register user
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user with this phone already exists
      const existingUser = await storage.getUserByPhone(validatedData.phone);
      if (existingUser) {
        return res.status(400).json({ message: "Số điện thoại đã được đăng ký." });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        name: validatedData.name,
        phone: validatedData.phone,
        address: validatedData.address,
        rice_total: validatedData.rice_total,
        rice_left: validatedData.rice_total, // Initially same as total
        player_id: validatedData.player_id || null
      });
      
      // Set user ID in session
      req.session.userId = newUser.id;
      
      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ.", errors: error.errors });
      }
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Lỗi tạo người dùng." });
    }
  });
  
  // Update user's player_id for push notifications
  app.post("/api/users/player-id", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Không tìm thấy người dùng." });
    }
    
    try {
      const { player_id } = req.body;
      
      if (!player_id) {
        return res.status(400).json({ message: "Player ID không được để trống." });
      }
      
      const updatedUser = await storage.updateUserPlayerID(req.user.id, player_id);
      
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating player ID:", error);
      return res.status(500).json({ message: "Lỗi cập nhật player ID." });
    }
  });
  
  // === ORDER ROUTES ===
  
  // Create new order
  app.post("/api/orders", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để đặt hàng." });
    }
    
    try {
      const user = req.user;
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        user_id: user.id
      });
      
      // Check if user has enough rice left
      if (user.rice_left < validatedData.quantity) {
        return res.status(400).json({ 
          message: `Bạn chỉ còn ${user.rice_left}kg gạo, không đủ để đặt ${validatedData.quantity}kg.` 
        });
      }
      
      // Create new order
      const newOrder = await storage.createOrder({
        user_id: user.id,
        quantity: validatedData.quantity,
        status: "pending",
        address: validatedData.address,
        note: validatedData.note || null
      });
      
      // Update user's rice balance
      const updatedUser = await storage.updateUser(user.id, {
        rice_left: user.rice_left - validatedData.quantity
      });
      
      // Get admin token to check if notifications are enabled
      const zaloSettings = await storage.getZaloSettings();
      
      // Send push notification to admin if OneSignal is configured
      if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY) {
        try {
          // Send notification to admin (tagged with role=admin)
          await axios.post(
            'https://onesignal.com/api/v1/notifications',
            {
              app_id: process.env.ONESIGNAL_APP_ID,
              filters: [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
              headings: { en: 'Đơn hàng mới', vi: 'Đơn hàng mới' },
              contents: { 
                en: `${user.name} đã đặt ${validatedData.quantity}kg gạo`, 
                vi: `${user.name} đã đặt ${validatedData.quantity}kg gạo` 
              },
              data: { 
                order_id: newOrder.id,
                url: '/admin/dashboard'
              },
              buttons: [
                { id: 'admin_view', text: 'Xem đơn hàng' }
              ]
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
              }
            }
          );
        } catch (error) {
          console.error('Error sending OneSignal notification:', error);
        }
      }
      
      // Send Zalo notification if connected and enabled
      if (zaloSettings?.access_token && zaloSettings.send_new_order_notification) {
        try {
          // This would be implemented with Zalo API
          console.log(`Sending Zalo notification for new order: ${newOrder.id}`);
        } catch (error) {
          console.error('Error sending Zalo notification:', error);
        }
      }
      
      return res.status(201).json({
        order: newOrder,
        user: updatedUser
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ.", errors: error.errors });
      }
      console.error("Error creating order:", error);
      return res.status(500).json({ message: "Lỗi tạo đơn hàng." });
    }
  });
  
  // Get user's orders
  app.get("/api/orders", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để xem đơn hàng." });
    }
    
    try {
      const user = req.user;
      const orders = await storage.getOrdersByUserId(user.id);
      
      return res.json(orders);
    } catch (error) {
      console.error("Error getting orders:", error);
      return res.status(500).json({ message: "Lỗi lấy dữ liệu đơn hàng." });
    }
  });
  
  // === ADMIN ROUTES ===
  
  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ message: "Mã khóa không được để trống." });
      }
      
      // For security, compare with environment variable
      const validToken = process.env.ADMIN_ACCESS_TOKEN || "admin_secret_token";
      
      if (access_token !== validToken) {
        return res.status(401).json({ message: "Mã khóa không chính xác." });
      }
      
      // Save token to database with 30 days expiration
      await storage.saveAdminAccessToken(access_token, 30 * 24 * 60 * 60);
      
      // Set cookie for browser access
      res.cookie('admin_token', access_token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });
      
      return res.json({ 
        token: access_token,
        message: "Đăng nhập thành công." 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ message: "Lỗi đăng nhập." });
    }
  });
  
  // Verify admin token
  app.get("/api/admin/verify", validateAdminToken, (req: Request, res: Response) => {
    return res.json({ valid: true });
  });
  
  // Get all orders (admin)
  app.get("/api/admin/orders", validateAdminToken, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;
      
      const result = await storage.getAllOrdersWithUsers(
        page, 
        limit, 
        status === 'all' ? undefined : status,
        search
      );
      
      return res.json(result);
    } catch (error) {
      console.error("Error getting admin orders:", error);
      return res.status(500).json({ message: "Lỗi lấy dữ liệu đơn hàng." });
    }
  });
  
  // Update order status (admin)
  app.post("/api/admin/orders/:id/status", validateAdminToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || !status) {
        return res.status(400).json({ message: "ID đơn hàng và trạng thái không được để trống." });
      }
      
      // Validate status
      if (!['pending', 'completed', 'canceled'].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ." });
      }
      
      // Get order with user details
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
      }
      
      // Handle rice balance logic based on status change
      let updatedUser = null;
      
      if (order.status === 'pending' && status === 'canceled') {
        // Pending -> Canceled: Return rice to user
        updatedUser = await storage.updateUser(order.user_id, {
          rice_left: order.user.rice_left + order.quantity
        });
      } else if (order.status === 'completed' && status === 'canceled') {
        // Completed -> Canceled: Return rice to user
        updatedUser = await storage.updateUser(order.user_id, {
          rice_left: order.user.rice_left + order.quantity
        });
      } else if (order.status === 'canceled' && status === 'pending') {
        // Canceled -> Pending: Deduct rice from user
        // Make sure user has enough rice
        if (order.user.rice_left < order.quantity) {
          return res.status(400).json({ 
            message: `Khách hàng chỉ còn ${order.user.rice_left}kg gạo, không đủ để kích hoạt lại đơn hàng ${order.quantity}kg.` 
          });
        }
        
        updatedUser = await storage.updateUser(order.user_id, {
          rice_left: order.user.rice_left - order.quantity
        });
      } else if (order.status === 'canceled' && status === 'completed') {
        // Canceled -> Completed: Deduct rice from user
        // Make sure user has enough rice
        if (order.user.rice_left < order.quantity) {
          return res.status(400).json({ 
            message: `Khách hàng chỉ còn ${order.user.rice_left}kg gạo, không đủ để hoàn thành đơn hàng ${order.quantity}kg.` 
          });
        }
        
        updatedUser = await storage.updateUser(order.user_id, {
          rice_left: order.user.rice_left - order.quantity
        });
      }
      
      // Update order status
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      // Get Zalo settings
      const zaloSettings = await storage.getZaloSettings();
      
      // Send push notification to user if OneSignal is configured and user has player_id
      if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY && order.user.player_id) {
        try {
          let title = '';
          let message = '';
          
          if (status === 'completed') {
            title = 'Đơn hàng đã hoàn thành';
            message = `Đơn hàng #${id.substring(0, 6)} của bạn đã được giao thành công.`;
          } else if (status === 'canceled') {
            title = 'Đơn hàng đã bị hủy';
            message = `Đơn hàng #${id.substring(0, 6)} của bạn đã bị hủy.`;
          } else {
            title = 'Cập nhật đơn hàng';
            message = `Đơn hàng #${id.substring(0, 6)} của bạn đã được cập nhật.`;
          }
          
          await axios.post(
            'https://onesignal.com/api/v1/notifications',
            {
              app_id: process.env.ONESIGNAL_APP_ID,
              include_player_ids: [order.user.player_id],
              headings: { en: title, vi: title },
              contents: { en: message, vi: message },
              data: { 
                order_id: order.id,
                url: '/orders'
              },
              buttons: [
                { id: 'view_order', text: 'Xem đơn hàng' }
              ]
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
              }
            }
          );
        } catch (error) {
          console.error('Error sending OneSignal notification:', error);
        }
      }
      
      // Send Zalo notification if connected and enabled
      if (zaloSettings?.access_token && zaloSettings.send_status_update_notification) {
        try {
          // This would be implemented with Zalo API
          console.log(`Sending Zalo notification for order status update: ${order.id} -> ${status}`);
        } catch (error) {
          console.error('Error sending Zalo notification:', error);
        }
      }
      
      return res.json({
        order: updatedOrder,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({ message: "Lỗi cập nhật trạng thái đơn hàng." });
    }
  });
  
  // === ZALO INTEGRATION ROUTES ===
  
  // Get Zalo settings
  app.get("/api/admin/zalo-settings", validateAdminToken, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getZaloSettings();
      
      // Format response for frontend
      return res.json({
        connected: !!settings?.access_token,
        oaName: settings?.oa_name,
        sendNewOrderNotification: settings?.send_new_order_notification ?? true,
        sendStatusUpdateNotification: settings?.send_status_update_notification ?? true
      });
    } catch (error) {
      console.error("Error getting Zalo settings:", error);
      return res.status(500).json({ message: "Lỗi lấy cài đặt Zalo." });
    }
  });
  
  // Update Zalo notification settings
  app.post("/api/admin/zalo-settings", validateAdminToken, async (req: Request, res: Response) => {
    try {
      const { sendNewOrderNotification, sendStatusUpdateNotification } = req.body;
      
      const updatedSettings = await storage.saveZaloSettings({
        send_new_order_notification: sendNewOrderNotification,
        send_status_update_notification: sendStatusUpdateNotification
      });
      
      return res.json({
        connected: !!updatedSettings.access_token,
        oaName: updatedSettings.oa_name,
        sendNewOrderNotification: updatedSettings.send_new_order_notification,
        sendStatusUpdateNotification: updatedSettings.send_status_update_notification
      });
    } catch (error) {
      console.error("Error updating Zalo settings:", error);
      return res.status(500).json({ message: "Lỗi cập nhật cài đặt Zalo." });
    }
  });
  
  // Initiate Zalo OAuth flow
  app.post("/api/admin/connect-zalo", validateAdminToken, async (req: Request, res: Response) => {
    try {
      // Generate PKCE challenge and verifier based on Zalo docs
      const verifier = crypto.randomBytes(32).toString('base64url');
      const challenge = crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Store verifier in database for later verification
      await storage.saveZaloSettings({ code_verifier: verifier });
      
      // Generate state parameter to prevent CSRF
      const state = crypto.randomBytes(16).toString('hex');
      
      // Get redirect URI from environment
      const redirectUri = process.env.ZALO_REDIRECT_URI || "";
      
      // Generate Zalo OAuth URL based on documentation
      const appId = process.env.ZALO_APP_ID || "";
      
      // Using the Zalo Official Account API endpoints
      const authUrl = `https://oauth.zaloapp.com/v4/oa/permission?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;
      
      return res.json({ authUrl });
    } catch (error) {
      console.error("Error initiating Zalo connection:", error);
      return res.status(500).json({ message: "Lỗi kết nối Zalo." });
    }
  });
  
  // Complete Zalo OAuth flow
  app.post("/api/admin/complete-zalo-auth", validateAdminToken, async (req: Request, res: Response) => {
    try {
      const { code, state } = req.body;
      
      if (!code || !state) {
        return res.status(400).json({ message: "Mã xác thực không đầy đủ." });
      }
      
      // Get stored code verifier
      const settings = await storage.getZaloSettings();
      
      if (!settings || !settings.code_verifier) {
        return res.status(400).json({ message: "Không tìm thấy mã xác thực Zalo." });
      }
      
      // Exchange code for access token - follow Zalo documentation
      const appId = process.env.ZALO_APP_ID || "";
      const appSecret = process.env.ZALO_APP_SECRET || "";
      const redirectUri = process.env.ZALO_REDIRECT_URI || "";
      
      // Prepare form data
      const formData = new URLSearchParams();
      formData.append('code', code);
      formData.append('app_id', appId);
      formData.append('grant_type', 'authorization_code');
      formData.append('code_verifier', settings.code_verifier);
      
      const tokenResponse = await axios.post(
        'https://oauth.zaloapp.com/v4/oa/access_token',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'secret_key': appSecret
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get OA info using Zalo Open API
      const oaInfoResponse = await axios.get(
        'https://openapi.zalo.me/v2.0/oa/getoa',
        {
          headers: {
            'access_token': access_token
          }
        }
      );
      
      const oaName = oaInfoResponse.data.data.name;
      
      // Calculate token expiration date
      const expiresAt = new Date(Date.now() + expires_in * 1000);
      
      // Save Zalo tokens
      await storage.saveZaloSettings({
        access_token,
        refresh_token,
        expires_at: expiresAt.toISOString(),
        oa_name: oaName,
        code_verifier: null // Clear verifier after use
      });
      
      return res.json({
        connected: true,
        oaName
      });
    } catch (error) {
      console.error("Error completing Zalo authentication:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const responseData = (error as any)?.response?.data || null;
      return res.status(500).json({ 
        message: "Lỗi xác thực Zalo.",
        error: responseData || errorMessage 
      });
    }
  });
  
  // Disconnect Zalo
  app.post("/api/admin/disconnect-zalo", validateAdminToken, async (req: Request, res: Response) => {
    try {
      await storage.disconnectZalo();
      
      return res.json({
        connected: false,
        message: "Đã ngắt kết nối Zalo thành công."
      });
    } catch (error) {
      console.error("Error disconnecting Zalo:", error);
      return res.status(500).json({ message: "Lỗi ngắt kết nối Zalo." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
