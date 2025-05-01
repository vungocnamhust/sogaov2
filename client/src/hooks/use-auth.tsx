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

  // Tạm thời bỏ qua initializing OneSignal để đảm bảo ứng dụng hoạt động ổn định
  // Chức năng thông báo sẽ được thêm lại sau
  useEffect(() => {
    if (user) {
      console.log('User authenticated:', user.name);
    }
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
