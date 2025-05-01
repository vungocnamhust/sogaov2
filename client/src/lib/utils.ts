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

// OneSignal initialization - sử dụng phiên bản mới (v16)
export const initializeOneSignal = async (playerId?: string) => {
  // Kiểm tra xem OneSignal đã được khởi tạo chưa
  if (typeof window !== "undefined") {
    try {
      // Chờ cho đến khi OneSignal được tải
      const waitForOneSignal = (maxWaitTime = 3000) => {
        return new Promise<any>((resolve) => {
          if (window.OneSignal) {
            return resolve(window.OneSignal);
          }
          
          let waitTime = 0;
          const interval = 100;
          const checkOneSignal = setInterval(() => {
            waitTime += interval;
            if (window.OneSignal) {
              clearInterval(checkOneSignal);
              resolve(window.OneSignal);
            } else if (waitTime >= maxWaitTime) {
              clearInterval(checkOneSignal);
              console.warn('Đã hết thời gian chờ OneSignal');
              resolve(null);
            }
          }, interval);
        });
      };
      
      // Đợi OneSignal khởi tạo (tối đa 3 giây)
      const OneSignal = await waitForOneSignal();
      
      if (!OneSignal) {
        return createFakeOneSignal();
      }
      
      // Thêm xử lý lỗi và thử lại cho các hoạt động của OneSignal
      try {
        // Cập nhật player ID nếu đã đăng nhập
        if (playerId) {
          // Sử dụng OneSignal v16 API
          await OneSignal.login(playerId);
        }
      } catch (err) {
        console.warn("Lỗi khi thiết lập ID người dùng OneSignal:", err);
      }
      
      return OneSignal;
    } catch (error) {
      console.error("Lỗi khởi tạo OneSignal:", error);
      return createFakeOneSignal();
    }
  }
  return null;
};

// Tạo đối tượng OneSignal giả để tránh lỗi
function createFakeOneSignal() {
  return {
    getUserId: (callback: Function) => callback(null),
    getExternalUserId: () => null,
    showNativePrompt: () => {},
    registerForPushNotifications: () => Promise.resolve(),
    setExternalUserId: () => {},
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    sendTag: () => {},
    init: () => Promise.resolve()
  };
}

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
