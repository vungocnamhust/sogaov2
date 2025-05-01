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

// Khai báo interface cho window.OneSignal để TypeScript không báo lỗi
declare global {
  interface Window {
    OneSignal: any;
  }
}

// Để đảm bảo ứng dụng luôn khởi động, chúng ta sẽ không khởi tạo OneSignal trong quá trình render
// OneSignal sẽ được tải riêng sau khi ứng dụng đã khởi động hoàn toàn
console.log('React app starting without OneSignal to ensure stability');

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
