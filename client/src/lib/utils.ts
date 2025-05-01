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

// Không sử dụng OneSignal, chỉ để hàm trống để tương thích với code hiện tại
export const initializeOneSignal = async (_playerId?: string) => {
  console.log('OneSignal đã bị vô hiệu hóa');
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
