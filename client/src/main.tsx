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

// OneSignal initialization script with error handling
const initializeOneSignalScript = document.createElement('script');
initializeOneSignalScript.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
initializeOneSignalScript.onerror = (error) => {
  console.error('Không thể tải OneSignal SDK:', error);
  // Tạo đối tượng OneSignal giả để tránh lỗi
  window.OneSignal = window.OneSignal || {
    push: () => {},
    init: () => {},
    getUserId: (callback: Function) => callback(null)
  };
};

// Initialize OneSignal when script is loaded
initializeOneSignalScript.onload = () => {
  console.log('OneSignal SDK loaded successfully');
  window.OneSignal = window.OneSignal || [];
};

// Thêm script vào head
document.head.appendChild(initializeOneSignalScript);

// Create a type declaration for window.OneSignal
declare global {
  interface Window {
    OneSignal: any;
  }
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
