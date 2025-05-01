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

// OneSignal initialization script
const initializeOneSignalScript = document.createElement('script');
initializeOneSignalScript.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
document.head.appendChild(initializeOneSignalScript);

// Initialize OneSignal when script is loaded
initializeOneSignalScript.onload = () => {
  window.OneSignal = window.OneSignal || [];
};

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
