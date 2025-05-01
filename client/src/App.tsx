import { Switch, Route, useLocation } from "wouter";
// Import only what we need
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import RegistrationPage from "@/pages/RegistrationPage";
import OrderHistoryPage from "@/pages/OrderHistoryPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";

function Router() {
  const [location] = useLocation();

  // Switch manifest based on route
  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      if (location.startsWith("/admin")) {
        manifestLink.setAttribute("href", "/admin-manifest.json");
      } else {
        manifestLink.setAttribute("href", "/manifest.json");
      }
    }
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/register" component={RegistrationPage} />
      <Route path="/orders" component={OrderHistoryPage} />
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={AdminDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Service worker registration is now handled in main.tsx

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
