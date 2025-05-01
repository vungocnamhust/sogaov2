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

// OneSignal initialization - phiên bản đơn giản
export const initializeOneSignal = async (playerId?: string) => {
  if (typeof window === "undefined") {
    return null;
  }
  
  try {
    // Đơn giản hóa khởi tạo
    if (!window.OneSignal) {
      console.log('OneSignal không khả dụng, trả về đối tượng giả');
      return {
        init: () => {},
        getUserId: (cb: Function) => { if (cb) cb(null); },
        showNativePrompt: () => {},
        login: () => {},
        getDeviceState: () => Promise.resolve({ userId: null }),
        setExternalUserId: () => {}
      };
    }
    
    // Cơ bản thử cập nhật playerId nếu có
    if (playerId && window.OneSignal) {
      try {
        // Cố gắng sử dụng phương thức phù hợp
        if (typeof window.OneSignal.login === 'function') {
          console.log('Sử dụng OneSignal.login() - v16');
          window.OneSignal.login(playerId);
        } else if (typeof window.OneSignal.setExternalUserId === 'function') {
          console.log('Sử dụng OneSignal.setExternalUserId() - legacy');
          window.OneSignal.setExternalUserId(playerId);
        }
      } catch (e) {
        console.warn('Lỗi khi cập nhật player ID:', e);
        // Tiếp tục mà không dừng
      }
    }
    
    return window.OneSignal;
  } catch (error) {
    console.error('Lỗi xử lý OneSignal:', error);
    return null;
  }
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
