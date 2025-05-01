import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Order {
  id: string;
  user_id: string;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string | null;
  address: string;
  note: string | null;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
}

export function useOrders() {
  const queryClient = useQueryClient();

  // Fetch orders
  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ['/api/orders'],
  });

  // Create order mutation
  const createOrder = useMutation({
    mutationFn: async (orderData: { quantity: number; address: string; note?: string }) => {
      return apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      // Invalidate orders query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      // Also invalidate user to update rice balance
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });

  return {
    orders: data?.orders || [],
    totalOrders: data?.total || 0,
    isLoading,
    error,
    createOrder,
  };
}

export function useAdminOrders(page = 1, status = "all", search = "") {
  const queryClient = useQueryClient();

  // Fetch admin orders with pagination, filtering and search
  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: [`/api/admin/orders?page=${page}&status=${status}&search=${search}`],
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("POST", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      // Invalidate admin orders query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
  });

  return {
    orders: data?.orders || [],
    totalOrders: data?.total || 0,
    isLoading,
    error,
    updateOrderStatus,
  };
}
