import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  phone: string;
  address: string;
  rice_total: number;
  rice_left: number;
  player_id: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localStorageUser, setLocalStorageUser] = useState<User | null>(null);
  
  // Try to get user from localStorage first for faster loading
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setLocalStorageUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Then fetch the latest user data from server
  const { data: user, isLoading, error, refetch } = useQuery<User | null>({
    queryKey: ['/api/users/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    initialData: localStorageUser,
    // Use staleTime to prevent too many refetches
    staleTime: 60 * 1000, // 1 minute
  });

  // Initialize OneSignal when user is available
  useEffect(() => {
    if (!user) return;
    
    // Tải module OneSignal một cách động
    const connectOneSignal = async () => {
      try {
        // Lazy load OneSignal module
        const { registerPlayerId, requestNotificationPermission } = await import('../lib/onesignal');
        
        // Nếu đã có player_id, đăng ký với OneSignal
        if (user.player_id) {
          registerPlayerId(user.player_id);
        } else {
          // Nếu chưa có player_id, kiểm tra và lấy từ OneSignal
          if (window.OneSignal) {
            try {
              if (window.OneSignal.getDeviceState) {
                // Cách mới (v16)
                const deviceState = await window.OneSignal.getDeviceState();
                if (deviceState && deviceState.userId) {
                  // Cập nhật player_id trên server
                  fetch('/api/users/player-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player_id: deviceState.userId }),
                    credentials: 'include',
                  }).catch(console.error);
                }
              } else if (window.OneSignal.getUserId) {
                // Cách cũ
                window.OneSignal.getUserId((id: string) => {
                  if (id) {
                    fetch('/api/users/player-id', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ player_id: id }),
                      credentials: 'include',
                    }).catch(console.error);
                  }
                });
              }
              
              // Yêu cầu quyền thông báo
              requestNotificationPermission();
            } catch (err) {
              console.warn("Lỗi khi tương tác với OneSignal:", err);
            }
          }
        }
      } catch (error) {
        console.warn("Không thể tải module OneSignal:", error);
        // Ứng dụng vẫn tiếp tục hoạt động bình thường
      }
    };
    
    // Đợi 3 giây để OneSignal được tải hoàn toàn
    const timer = setTimeout(connectOneSignal, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else if (!isLoading) {
      localStorage.removeItem("user");
    }
  }, [user, isLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Lỗi xác thực",
        description: "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    await refetch();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Helper function for unauthorized behavior
function getQueryFn({ on401 }: { on401: "returnNull" | "throw" }) {
  return async () => {
    const res = await fetch('/api/users/me', {
      credentials: 'include',
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }

    return await res.json();
  };
}
