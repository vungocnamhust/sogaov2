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
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('SW registered: ', registration);
    } catch (error) {
      console.error('SW registration failed: ', error);
      // Không block ứng dụng nếu service worker lỗi
    }
  });
}

// Khai báo window.OneSignal
declare global {
  interface Window {
    OneSignal: any;
  }
}

// Đơn giản hóa việc triển khai OneSignal
try {
  const initOneSignal = () => {
    window.OneSignal = window.OneSignal || {};
    
    // Create fake methods if needed
    if (!window.OneSignal) {
      window.OneSignal = {
        init: () => {},
        getUserId: (cb: Function) => { if (cb) cb(null); },
        showNativePrompt: () => {},
        login: () => {},
        getDeviceState: () => Promise.resolve({ userId: null })
      };
    }
  };
  
  // Khởi tạo OneSignal để các hàm không bị lỗi
  initOneSignal();
  
  // OneSignal sẽ được khởi tạo đầy đủ trong useEffect hooks khi cần thiết
  console.log('OneSignal đã được chuẩn bị, sẽ được khởi tạo khi cần');
} catch (err) {
  console.error('Lỗi chuẩn bị OneSignal:', err);
  // Vẫn tiếp tục chạy ứng dụng
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
