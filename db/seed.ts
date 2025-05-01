import { db } from "./index";
import * as schema from "@shared/schema";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if admin token exists
    const adminToken = process.env.ADMIN_ACCESS_TOKEN || "admin_secret_token";
    const existingAdmin = await db.select()
      .from(schema.adminAccess)
      .where(eq(schema.adminAccess.access_token, adminToken));

    if (existingAdmin.length === 0) {
      console.log("Creating admin access token...");
      await db.insert(schema.adminAccess).values({
        access_token: adminToken,
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiration
      });
    } else {
      console.log("Admin access token already exists.");
    }

    // Create sample users if none exist
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log("Creating sample users...");
      
      const users = [
        {
          id: uuid(),
          name: "Nguyễn Văn A",
          phone: "0987654321",
          address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          rice_total: 100,
          rice_left: 75,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          id: uuid(),
          name: "Trần Thị B",
          phone: "0123456789",
          address: "456 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          rice_total: 50,
          rice_left: 45,
          created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        },
        {
          id: uuid(),
          name: "Lê Văn C",
          phone: "0909123456",
          address: "789 Đường Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          rice_total: 200,
          rice_left: 180,
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        }
      ];
      
      for (const user of users) {
        await db.insert(schema.users).values(user);
      }
      
      // Create sample orders
      console.log("Creating sample orders...");
      
      const orders = [
        {
          id: uuid(),
          user_id: users[0].id,
          quantity: 10,
          status: "pending",
          address: users[0].address,
          note: "Giao buổi sáng nếu có thể",
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
        {
          id: uuid(),
          user_id: users[0].id,
          quantity: 15,
          status: "completed",
          address: users[0].address,
          note: null,
          created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          updated_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), // 24 days ago
        },
        {
          id: uuid(),
          user_id: users[1].id,
          quantity: 5,
          status: "completed",
          address: users[1].address,
          note: null,
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          updated_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
        },
        {
          id: uuid(),
          user_id: users[2].id,
          quantity: 10,
          status: "canceled",
          address: users[2].address,
          note: "Giao buổi chiều",
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        },
        {
          id: uuid(),
          user_id: users[2].id,
          quantity: 10,
          status: "completed",
          address: users[2].address,
          note: null,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        }
      ];
      
      for (const order of orders) {
        await db.insert(schema.orders).values(order);
      }
    } else {
      console.log(`${existingUsers.length} users already exist, skipping sample data creation.`);
    }

    // Check if Zalo settings exist
    const existingZaloSettings = await db.select().from(schema.zaloSettings);
    
    if (existingZaloSettings.length === 0) {
      console.log("Creating default Zalo settings...");
      await db.insert(schema.zaloSettings).values({
        id: uuid(),
        send_new_order_notification: true,
        send_status_update_notification: true,
      });
    } else {
      console.log("Zalo settings already exist.");
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
