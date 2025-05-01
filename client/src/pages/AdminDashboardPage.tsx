import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ZaloIntegration from "@/components/admin/ZaloIntegration";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Verify admin token
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setLocation('/admin');
        return;
      }
      
      try {
        setIsVerifying(true);
        await apiRequest("GET", "/api/admin/verify");
        setIsVerifying(false);
      } catch (error) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại.",
          variant: "destructive",
        });
        localStorage.removeItem('admin_token');
        setLocation('/admin');
      }
    };
    
    verifyAdmin();
  }, [setLocation, toast]);
  
  // Check for Zalo OAuth callback code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      // Complete Zalo OAuth flow
      const completeZaloAuth = async () => {
        try {
          await apiRequest("POST", "/api/admin/complete-zalo-auth", { code, state });
          
          toast({
            title: "Kết nối thành công",
            description: "Đã kết nối thành công với Zalo OA.",
          });
          
          // Clear URL params
          window.history.replaceState({}, document.title, "/admin/dashboard");
        } catch (error) {
          toast({
            title: "Kết nối thất bại",
            description: error instanceof Error ? error.message : "Có lỗi xảy ra khi kết nối với Zalo OA.",
            variant: "destructive",
          });
        }
      };
      
      completeZaloAuth();
    }
  }, [toast]);

  // Don't render content while verifying admin
  if (isVerifying) {
    return <div className="min-h-screen bg-neutral-lightest"></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAdmin />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h2>
          <AdminDashboard />
          <ZaloIntegration />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
