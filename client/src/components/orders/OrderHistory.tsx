import { useQuery } from "@tanstack/react-query";
import { formatDate, formatStatus, getStatusClass } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

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

export default function OrderHistory() {
  const { user } = useAuth();
  
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-neutral-light pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <p className="text-error">Đã xảy ra lỗi khi tải lịch sử đơn hàng. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <p className="text-neutral-dark text-center py-8">Bạn chưa có đơn hàng nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      {orders.map((order) => (
        <div key={order.id} className="border-b border-neutral-light pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold">Đơn hàng #{order.id.substring(0, 6)}</h4>
              <p className="text-sm text-neutral">Ngày đặt: {formatDate(order.created_at)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}>
              {formatStatus(order.status)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-neutral-dark mb-1">Số lượng</p>
              <p className="font-medium">{order.quantity} kg</p>
            </div>
            <div>
              <p className="text-sm text-neutral-dark mb-1">Địa chỉ giao hàng</p>
              <p className="font-medium">{order.address}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-dark mb-1">Ghi chú</p>
              <p className="font-medium">{order.note || "Không có ghi chú"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
