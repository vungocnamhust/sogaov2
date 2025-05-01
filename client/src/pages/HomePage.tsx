import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import RiceBalance from "@/components/user/RiceBalance";
import OrderForm from "@/components/user/OrderForm";
import Features from "@/components/home/Features";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Kiểm tra trình duyệt để phát hiện lỗi
  useEffect(() => {
    console.log("HomePage rendered");
    console.log("Auth state:", { user, isLoading });
  }, [user, isLoading]);
  
  // Chuyển hướng đến trang đăng ký nếu không tìm thấy người dùng
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Redirecting to registration page");
      setLocation('/register');
    }
  }, [user, isLoading, setLocation]);

  // Hiển thị trạng thái loading khi đang kiểm tra xác thực
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-dark">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }
  
  // Không hiển thị nội dung nếu không tìm thấy người dùng (sẽ chuyển hướng)
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-lightest flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-dark">Đang chuyển hướng đến trang đăng ký...</p>
        </div>
      </div>
    );
  }

  // Hiển thị nội dung chính khi đã có thông tin người dùng
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6">
          <Hero />
          <RiceBalance />
          <OrderForm />
          <Features />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
