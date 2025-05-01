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
  const [authTimeout, setAuthTimeout] = useState(false);
  
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

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);

  // Then fetch the latest user data from server
  const { data: user, isLoading, error, refetch } = useQuery<User | null>({
    queryKey: ['/api/users/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    initialData: localStorageUser,
    // Use staleTime to prevent too many refetches
    staleTime: 60 * 1000, // 1 minute
    retry: 1, // Limit retries to prevent infinite loading
    retryDelay: 1000, // 1 second between retries
    // Prevent blocking the UI on errors
    useErrorBoundary: false,
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
      console.error("Authentication error:", error);
      toast({
        title: "Lỗi xác thực",
        description: "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Force-exit loading state after timeout
  const finalIsLoading = isLoading && !authTimeout;

  const refreshUser = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      await refetch();
    } catch (refreshError) {
      console.error("Error refreshing user:", refreshError);
      // Don't block the UI on refresh errors
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: finalIsLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Helper function for unauthorized behavior
function getQueryFn({ on401 }: { on401: "returnNull" | "throw" }) {
  return async () => {
    try {
      const controller = new AbortController();
      // Set a timeout to abort the fetch if it takes too long
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch('/api/users/me', {
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (on401 === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Authentication request failed:", error);
      // If it's an AbortError, we timed out
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Authentication request timed out");
      }
      // Return null to avoid blocking the UI
      return null;
    }
  };
}
