import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date) => {
  if (!date) return "";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

export const formatDateTime = (date: string | Date) => {
  if (!date) return "";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
};

// OneSignal initialization
export const initializeOneSignal = async (playerId?: string) => {
  if (typeof window !== "undefined" && "OneSignal" in window) {
    try {
      const OneSignal = (window as any).OneSignal;
      
      // Thiết lập giá trị mặc định cho các biến môi trường
      const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || 
                   process.env.VITE_ONESIGNAL_APP_ID || 
                   "placeholder-app-id";
      
      // Tùy chỉnh cài đặt WebSocket để sửa lỗi
      await OneSignal.init({
        appId: appId,
        notifyButton: {
          enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
        // Thêm các cài đặt để vô hiệu hóa kết nối WebSocket nếu không cần thiết
        promptOptions: {
          slidedown: {
            enabled: true,
            autoPrompt: false,
          }
        },
        // Vô hiệu hóa các tính năng không cần thiết
        welcomeNotification: {
          disable: true
        },
        // Hạn chế các yêu cầu mạng không cần thiết
        persistNotification: false
      });
      
      // Thêm xử lý lỗi và thử lại cho các hoạt động của OneSignal
      try {
        // Update user's player ID if logged in
        if (playerId) {
          OneSignal.setExternalUserId(playerId);
        }
      } catch (err) {
        console.warn("Error setting external user ID:", err);
      }
      
      return OneSignal;
    } catch (error) {
      console.error("Error initializing OneSignal:", error);
      // Trả về đối tượng giả lập nếu khởi tạo thất bại
      return {
        getUserId: (callback: Function) => callback(null),
        showNativePrompt: () => {},
        registerForPushNotifications: () => Promise.resolve(),
        setExternalUserId: () => {},
        sendTag: () => {}
      };
    }
  }
  return null;
};

// Check if app is installed (running in standalone mode)
export const isAppInstalled = () => {
  return window.matchMedia("(display-mode: standalone)").matches || 
         (window.navigator as any).standalone === true;
};

// Format status to Vietnamese
export const formatStatus = (status: string) => {
  switch (status) {
    case "pending":
      return "Đang xử lý";
    case "completed":
      return "Hoàn thành";
    case "canceled":
      return "Đã hủy";
    default:
      return "Không xác định";
  }
};

// Get status class for badges
export const getStatusClass = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-warning/10 text-warning";
    case "completed":
      return "bg-success/10 text-success";
    case "canceled":
      return "bg-error/10 text-error";
    default:
      return "bg-neutral-light/50 text-neutral-dark";
  }
};
