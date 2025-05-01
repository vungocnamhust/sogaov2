import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { isAppInstalled } from "@/lib/utils";

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isAppInstalled());

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    });
    
    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    });
  };

  return (
    <footer className="bg-neutral-darkest text-neutral-lightest p-8 mt-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Làng Gạo</h3>
            <p className="mb-4">Cung cấp gạo sinh thái chất lượng cao, an toàn và thân thiện với môi trường.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-light hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                </svg>
              </a>
              <a href="#" className="text-neutral-light hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                </svg>
              </a>
              <a href="#" className="text-neutral-light hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2.2467A9.7533,9.7533,0,0,0,2.247,12C2.2474,16.8027,5.1935,20.9105,9.7317,22.5622A9.7551,9.7551,0,1,0,12,2.2467Zm2.5814,17.1418c-.4217-.1013-2.5183-.7664-2.9081-.8541s-.6865-.2151-.9809.2164c-.2927.4297-1.1388,1.1273-1.3946,1.3577-.2547.229-.5093.2583-.931.1563s-3.1314-1.562-4.7368-3.6914c-.3546-.565.3552-.5238.9423-1.8217.1042-.2301.0521-.4276-.0271-.5992C4.211,14.6176,3.8807,13.693,3.6252,13.2864c-.2513-.3979-.525-.3348-.9289-.3348s-.8648-.0729-1.2079-.0729-.8229.1155-1.251.5733c-.4292.4577-1.6428,1.6069-1.6428,3.9179,0,2.3105,1.6843,4.5377,1.9165,4.853.2343.3136,3.2839,5.0162,7.9561,7.0356,1.1121.4788,1.9819.7622,2.6585.9813a6.3842,6.3842,0,0,0,2.921.1834c.89-.1329,2.7378-1.1189,3.1233-2.1981.386-1.0792.386-2.0051.2712-2.1981C14.8459,19.5822,14.5912,19.4884,14.1593,19.3885Z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Liên hệ</h3>
            <address className="not-italic">
              <p className="mb-2">123 Đường Nông Nghiệp, Huyện Làng Gạo</p>
              <p className="mb-2">Tỉnh An Giang, Việt Nam</p>
              <p className="mb-2">Email: info@langgao.vn</p>
              <p>Điện thoại: 0987 654 321</p>
            </address>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Tải ứng dụng</h3>
            <p className="mb-4">Cài đặt ứng dụng Đặt Gạo Làng Gạo trên thiết bị của bạn để trải nghiệm tốt nhất.</p>
            {!isInstalled ? (
              <Button
                id="installApp"
                className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg transition flex items-center"
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Cài đặt ứng dụng
              </Button>
            ) : (
              <p className="text-accent">Ứng dụng đã được cài đặt ✓</p>
            )}
          </div>
        </div>
        
        <div className="border-t border-neutral-dark mt-8 pt-6 text-center text-neutral">
          <p>&copy; {new Date().getFullYear()} Làng Gạo. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
