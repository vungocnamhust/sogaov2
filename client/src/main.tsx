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

// Khai báo window.OneSignal - OneSignal sẽ được tải riêng
declare global {
  interface Window {
    OneSignal: any;
  }
}

// OneSignal sẽ được tải và khởi tạo trong useEffect hook sau khi ứng dụng khởi động
// Điều này đảm bảo ứng dụng luôn khởi động, ngay cả khi OneSignal gặp lỗi
console.log('OneSignal sẽ được tải sau khi ứng dụng khởi động thành công');

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
