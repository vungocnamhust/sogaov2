import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RegistrationForm from "@/components/user/RegistrationForm";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RegistrationPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to home if user already registered
  useEffect(() => {
    if (!isLoading && user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  // Don't render content while checking auth
  if (isLoading) {
    return <div className="min-h-screen bg-neutral-lightest"></div>;
  }
  
  // Don't render if user found (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Đăng ký thông tin</h2>
            <RegistrationForm />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
