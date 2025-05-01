import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
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
