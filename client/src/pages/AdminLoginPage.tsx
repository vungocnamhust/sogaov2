import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdminLogin from "@/components/admin/AdminLogin";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  
  // Check if admin is already logged in
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setLocation('/admin/dashboard');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập quản trị</h2>
            <AdminLogin />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
