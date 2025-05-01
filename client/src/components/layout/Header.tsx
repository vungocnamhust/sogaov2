import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="https://images.unsplash.com/photo-1586201375761-83865001e8cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=50&q=80" 
            alt="Logo" 
            className="w-10 h-10 rounded-full object-cover" 
          />
          <Link href="/">
            <h1 className="font-display font-bold text-xl text-primary md:text-2xl cursor-pointer">
              {isAdmin ? "Làng Gạo Admin" : "Làng Gạo"}
            </h1>
          </Link>
        </div>
        <nav>
          <button 
            id="menuButton" 
            className="p-2 rounded-full hover:bg-neutral-lightest md:hidden"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {isAdmin ? (
            <ul className="hidden md:flex space-x-6 items-center">
              <li>
                <Link href="/admin/dashboard">
                  <a className={`font-medium hover:text-primary transition ${location === '/admin/dashboard' ? 'text-primary' : 'text-neutral-dark'}`}>
                    Quản lý đơn hàng
                  </a>
                </Link>
              </li>
              <li>
                <Button 
                  variant="outline" 
                  className="text-error" 
                  onClick={() => {
                    localStorage.removeItem('admin_token');
                    window.location.href = '/admin';
                  }}
                >
                  Đăng xuất
                </Button>
              </li>
            </ul>
          ) : (
            <ul className="hidden md:flex space-x-6 items-center">
              <li>
                <Link href="/">
                  <a className={`font-medium hover:text-primary transition ${location === '/' ? 'text-primary' : 'text-neutral-dark'}`}>
                    Trang chủ
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/orders">
                  <a className={`font-medium hover:text-primary transition ${location === '/orders' ? 'text-primary' : 'text-neutral-dark'}`}>
                    Lịch sử đặt hàng
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/#orderForm">
                  <a className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg transition">
                    Đặt gạo ngay
                  </a>
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
      
      {/* Mobile menu */}
      <div id="mobileMenu" className={`md:hidden ${mobileMenuOpen ? '' : 'hidden'}`}>
        {isAdmin ? (
          <ul className="bg-white py-2 px-4 space-y-2">
            <li>
              <Link href="/admin/dashboard">
                <a className={`block py-2 font-medium ${location === '/admin/dashboard' ? 'text-primary' : 'text-neutral-dark'}`}>
                  Quản lý đơn hàng
                </a>
              </Link>
            </li>
            <li className="pt-2">
              <button 
                className="block w-full text-center bg-primary text-white font-medium px-4 py-2 rounded-lg"
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  window.location.href = '/admin';
                }}
              >
                Đăng xuất
              </button>
            </li>
          </ul>
        ) : (
          <ul className="bg-white py-2 px-4 space-y-2">
            <li>
              <Link href="/">
                <a className={`block py-2 font-medium ${location === '/' ? 'text-primary' : 'text-neutral-dark'}`}>
                  Trang chủ
                </a>
              </Link>
            </li>
            <li>
              <Link href="/orders">
                <a className={`block py-2 font-medium ${location === '/orders' ? 'text-primary' : 'text-neutral-dark'}`}>
                  Lịch sử đặt hàng
                </a>
              </Link>
            </li>
            <li className="pt-2">
              <Link href="/#orderForm">
                <a className="block text-center bg-primary text-white font-medium px-4 py-2 rounded-lg">
                  Đặt gạo ngay
                </a>
              </Link>
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
