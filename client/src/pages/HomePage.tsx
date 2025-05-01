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
  
  // Redirect to registration if user not found
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/register');
    }
  }, [user, isLoading, setLocation]);

  // Don't render content while checking auth
  if (isLoading) {
    return <div className="min-h-screen bg-neutral-lightest"></div>;
  }
  
  // Don't render if user not found (will redirect)
  if (!user) {
    return null;
  }

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
