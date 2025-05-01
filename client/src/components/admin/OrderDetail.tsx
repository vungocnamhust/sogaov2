import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatStatus, getStatusClass } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  phone: string;
  address: string;
  rice_total: number;
  rice_left: number;
  player_id: string | null;
}

interface Order {
  id: string;
  user_id: string;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string | null;
  address: string;
  note: string | null;
  user: User;
}

interface OrderDetailProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}

export default function OrderDetail({ order, isOpen, onClose, onStatusChange }: OrderDetailProps) {
  const { toast } = useToast();
  const [confirmAction, setConfirmAction] = useState<{ action: string; title: string; message: string } | null>(null);
  
  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("POST", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: async () => {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái đơn hàng đã được cập nhật.",
      });
      
      setConfirmAction(null);
      onStatusChange();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Cập nhật thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    let title = "";
    let message = "";
    
    if (order.status === "pending" && newStatus === "completed") {
      title = "Xác nhận hoàn thành đơn hàng";
      message = "Đơn hàng sẽ được chuyển sang trạng thái Hoàn thành.";
    } else if (order.status === "pending" && newStatus === "canceled") {
      title = "Xác nhận hủy đơn hàng";
      message = "Đơn hàng sẽ bị hủy và số gạo sẽ được hoàn lại cho khách hàng.";
    } else if (order.status === "completed" && newStatus === "canceled") {
      title = "Xác nhận hủy đơn đã hoàn thành";
      message = "Đơn hàng đã hoàn thành sẽ bị hủy và số gạo sẽ được hoàn lại cho khách hàng.";
    } else if (order.status === "canceled" && newStatus === "pending") {
      title = "Xác nhận kích hoạt lại đơn hàng";
      message = "Đơn hàng sẽ được kích hoạt lại và số gạo sẽ được trừ lại từ tài khoản khách hàng.";
    } else if (order.status === "canceled" && newStatus === "completed") {
      title = "Xác nhận chuyển đơn hủy thành hoàn thành";
      message = "Đơn hàng sẽ được chuyển sang hoàn thành và số gạo sẽ được trừ lại từ tài khoản khách hàng.";
    }
    
    setConfirmAction({ action: newStatus, title, message });
  };

  const confirmStatusChange = () => {
    if (confirmAction) {
      statusMutation.mutate({
        orderId: order.id,
        status: confirmAction.action,
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chi tiết đơn hàng #{order.id.substring(0, 6)}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <h4 className="text-neutral-dark font-medium mb-2">Thông tin khách hàng</h4>
            <div className="bg-neutral-lightest p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Tên</p>
                  <p className="font-medium">{order.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Số điện thoại</p>
                  <p className="font-medium">{order.user.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-neutral-dark mb-1">Địa chỉ</p>
                  <p className="font-medium">{order.user.address}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Tổng gạo đăng ký</p>
                  <p className="font-medium">{order.user.rice_total} kg</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Số gạo còn lại</p>
                  <p className="font-medium">{order.user.rice_left} kg</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-neutral-dark font-medium mb-2">Thông tin đơn hàng</h4>
            <div className="bg-neutral-lightest p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Mã đơn hàng</p>
                  <p className="font-medium">#{order.id.substring(0, 6)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Ngày đặt</p>
                  <p className="font-medium">{formatDateTime(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Số lượng</p>
                  <p className="font-medium">{order.quantity} kg</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-dark mb-1">Trạng thái</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-neutral-dark mb-1">Địa chỉ giao hàng</p>
                  <p className="font-medium">{order.address}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-neutral-dark mb-1">Ghi chú</p>
                  <p className="font-medium">{order.note || "Không có ghi chú"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-wrap gap-3 justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="bg-neutral-light hover:bg-neutral text-neutral-darkest font-medium">
                Đóng
              </Button>
            </DialogClose>
            
            {order.status === "pending" && (
              <>
                <Button 
                  className="bg-success hover:bg-success/80 text-white font-medium"
                  onClick={() => handleStatusChange("completed")}
                  disabled={statusMutation.isPending}
                >
                  Hoàn thành đơn
                </Button>
                <Button 
                  className="bg-error hover:bg-error/80 text-white font-medium"
                  onClick={() => handleStatusChange("canceled")}
                  disabled={statusMutation.isPending}
                >
                  Hủy đơn
                </Button>
              </>
            )}
            
            {order.status === "completed" && (
              <Button 
                className="bg-error hover:bg-error/80 text-white font-medium"
                onClick={() => handleStatusChange("canceled")}
                disabled={statusMutation.isPending}
              >
                Hủy đơn
              </Button>
            )}
            
            {order.status === "canceled" && (
              <>
                <Button 
                  className="bg-warning hover:bg-warning/80 text-white font-medium"
                  onClick={() => handleStatusChange("pending")}
                  disabled={statusMutation.isPending}
                >
                  Kích hoạt lại
                </Button>
                <Button 
                  className="bg-success hover:bg-success/80 text-white font-medium"
                  onClick={() => handleStatusChange("completed")}
                  disabled={statusMutation.isPending}
                >
                  Chuyển thành hoàn thành
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      {confirmAction && (
        <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmAction.title}</DialogTitle>
            </DialogHeader>
            
            <p className="py-4">{confirmAction.message}</p>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmAction(null)}
              >
                Hủy
              </Button>
              <Button 
                variant="default" 
                className={
                  confirmAction.action === "completed" ? "bg-success" : 
                  confirmAction.action === "canceled" ? "bg-error" : 
                  "bg-warning"
                }
                onClick={confirmStatusChange}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
