// OneSignal loader - tách riêng để không ảnh hưởng đến ứng dụng chính
let isOneSignalLoaded = false;

export async function loadOneSignal() {
  // Chỉ tải một lần
  if (isOneSignalLoaded) {
    return;
  }
  
  try {
    // Tạo script tag
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    
    // Đặt flag khi đã tải
    script.onload = () => {
      isOneSignalLoaded = true;
      console.log('OneSignal script loaded');
      
      // Khởi tạo OneSignal sau khi script đã tải
      if (window.OneSignal) {
        try {
          const appId = process.env.VITE_ONESIGNAL_APP_ID || import.meta.env.VITE_ONESIGNAL_APP_ID;
          if (appId) {
            window.OneSignal.init({ appId });
            console.log('OneSignal initialized with app ID');
          } else {
            console.warn('Missing OneSignal App ID');
          }
        } catch (err) {
          console.error('Failed to initialize OneSignal:', err);
        }
      }
    };
    
    // Xử lý lỗi
    script.onerror = () => {
      console.error('Failed to load OneSignal script');
    };
    
    // Thêm script vào trang
    document.head.appendChild(script);
  } catch (err) {
    console.error('Error setting up OneSignal:', err);
  }
}

// Đăng ký PlayerID với OneSignal
export async function registerPlayerId(playerId: string) {
  if (!window.OneSignal) {
    console.warn('OneSignal not available for registering player ID');
    return false;
  }
  
  try {
    // Sử dụng phương thức v16 nếu có
    if (typeof window.OneSignal.login === 'function') {
      await window.OneSignal.login(playerId);
      console.log('Player ID registered with OneSignal login()');
      return true;
    } 
    // Fallback to legacy method
    else if (typeof window.OneSignal.setExternalUserId === 'function') {
      await window.OneSignal.setExternalUserId(playerId);
      console.log('Player ID registered with OneSignal setExternalUserId()');
      return true;
    }
  } catch (err) {
    console.error('Failed to register player ID with OneSignal:', err);
  }
  
  return false;
}

// Yêu cầu cấp quyền thông báo
export function requestNotificationPermission() {
  if (!window.OneSignal) {
    console.warn('OneSignal not available for requesting notification permission');
    return;
  }
  
  try {
    // Sử dụng phương thức thích hợp
    if (typeof window.OneSignal.showNativePrompt === 'function') {
      window.OneSignal.showNativePrompt();
    } else if (window.OneSignal.Notifications?.requestPermission) {
      window.OneSignal.Notifications.requestPermission();
    }
  } catch (err) {
    console.error('Failed to request notification permission:', err);
  }
}