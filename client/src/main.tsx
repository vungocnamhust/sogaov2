import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister any existing service workers first to ensure new version is used
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('Service worker unregistered to update to new version');
      }
      
      // Register the new service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('SW registered: ', registration);
    } catch (error) {
      console.error('SW registration failed: ', error);
    }
  });
}

// Create a type declaration for window.OneSignal and OneSignalDeferred
declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: {
      push: (callback: (instance: any) => void) => number;
      [key: number]: any;
    };
  }
}

// OneSignal initialization script with error handling
try {
  // Tạo và thêm script OneSignal mới (v16)
  const oneSignalScript = document.createElement('script');
  oneSignalScript.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  oneSignalScript.defer = true;
  oneSignalScript.onerror = (error) => {
    console.error('Không thể tải OneSignal SDK:', error);
    // Tạo đối tượng OneSignal giả để tránh lỗi
    window.OneSignal = window.OneSignal || {};
    window.OneSignalDeferred = {
      push: (callback) => {
        console.warn('OneSignal không khả dụng, bỏ qua callback');
        return 0;
      }
    };
  };
  
  document.head.appendChild(oneSignalScript);
  
  // Khởi tạo OneSignal với cấu hình mới
  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = [] as any;
  }
  
  window.OneSignalDeferred.push(async function(OneSignalInstance: any) {
    try {
      await OneSignalInstance.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "8a432abf-2df3-4318-b3d1-8eeddf6497b6",
      });
      console.log('OneSignal khởi tạo thành công');
    } catch (err) {
      console.error('Lỗi khởi tạo OneSignal:', err);
      // Không làm gì thêm, cho phép ứng dụng tiếp tục chạy
    }
  });
} catch (err) {
  // Xử lý mọi ngoại lệ có thể xảy ra trong quá trình cài đặt
  console.error('Lỗi thiết lập OneSignal:', err);
  // Đảm bảo ứng dụng vẫn tiếp tục chạy
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
