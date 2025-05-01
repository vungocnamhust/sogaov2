import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatStatus, getStatusClass } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrderDetail from "./OrderDetail";

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

interface OrdersResponse {
  orders: Order[];
  total: number;
  totalPending: number;
  totalCompleted: number;
  totalCanceled: number;
}

export default function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  
  const perPage = 10;

  const { data, isLoading, error, refetch } = useQuery<OrdersResponse>({
    queryKey: [`/api/admin/orders?page=${currentPage}&status=${statusFilter}&search=${searchTerm}`],
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (data && currentPage * perPage < data.total) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const totalPages = data ? Math.ceil(data.total / perPage) : 0;
  const showingFrom = data && data.total > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = data ? Math.min(currentPage * perPage, data.total) : 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-[200px] rounded-lg p-4">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <p className="text-error">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] bg-primary/10 rounded-lg p-4">
            <h4 className="text-primary font-medium mb-1">Tổng đơn hàng</h4>
            <p className="text-2xl font-bold">{data?.total || 0}</p>
          </div>
          <div className="flex-1 min-w-[200px] bg-warning/10 rounded-lg p-4">
            <h4 className="text-warning font-medium mb-1">Đơn đang xử lý</h4>
            <p className="text-2xl font-bold">{data?.totalPending || 0}</p>
          </div>
          <div className="flex-1 min-w-[200px] bg-success/10 rounded-lg p-4">
            <h4 className="text-success font-medium mb-1">Đơn hoàn thành</h4>
            <p className="text-2xl font-bold">{data?.totalCompleted || 0}</p>
          </div>
          <div className="flex-1 min-w-[200px] bg-error/10 rounded-lg p-4">
            <h4 className="text-error font-medium mb-1">Đơn đã hủy</h4>
            <p className="text-2xl font-bold">{data?.totalCanceled || 0}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-xl font-semibold">Danh sách đơn hàng</h3>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Đang xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="canceled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <Input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto"
              />
              <Button type="submit" variant="outline" className="ml-2">
                Tìm
              </Button>
            </form>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-light">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Mã đơn</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Người đặt</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Số lượng</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Ngày đặt</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-light">
              {data?.orders && data.orders.length > 0 ? (
                data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-neutral-darkest">
                      #{order.id.substring(0, 6)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-dark">
                      {order.user.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-dark">
                      {order.quantity} kg
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-dark">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        className="text-secondary hover:text-secondary-dark mr-3"
                        onClick={() => handleViewDetail(order)}
                      >
                        Chi tiết
                      </Button>
                      
                      {order.status === "pending" && (
                        <Button 
                          variant="ghost" 
                          className="text-success hover:text-success/80"
                          onClick={() => {
                            // This will be handled by the OrderDetail component
                            handleViewDetail(order);
                          }}
                        >
                          Hoàn thành
                        </Button>
                      )}
                      
                      {order.status === "completed" && (
                        <Button 
                          variant="ghost" 
                          className="text-error hover:text-error/80"
                          onClick={() => {
                            // This will be handled by the OrderDetail component
                            handleViewDetail(order);
                          }}
                        >
                          Hủy
                        </Button>
                      )}
                      
                      {order.status === "canceled" && (
                        <Button 
                          variant="ghost" 
                          className="text-warning hover:text-warning/80"
                          onClick={() => {
                            // This will be handled by the OrderDetail component
                            handleViewDetail(order);
                          }}
                        >
                          Kích hoạt lại
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-dark">
                    Không có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {data && data.total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-neutral-dark">
              Hiển thị {showingFrom}-{showingTo} của {data.total} đơn hàng
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                // Show current page and surrounding pages
                let pageToShow = currentPage;
                if (i === 0) pageToShow = Math.max(1, currentPage - 1);
                if (i === 1) pageToShow = currentPage;
                if (i === 2) pageToShow = Math.min(totalPages, currentPage + 1);
                
                // Adjust for first pages
                if (currentPage === 1 && i === 2) pageToShow = 3;
                if (currentPage === 1 && i === 1) pageToShow = 2;
                
                // Adjust for last pages
                if (currentPage === totalPages && i === 0) pageToShow = Math.max(1, totalPages - 2);
                if (currentPage === totalPages && i === 1) pageToShow = totalPages - 1;
                
                // Don't show page numbers beyond totalPages
                if (pageToShow > totalPages) return null;
                
                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageToShow)}
                    className={currentPage === pageToShow ? "bg-primary text-white" : ""}
                  >
                    {pageToShow}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Order Detail Modal */}
      {isDetailOpen && selectedOrder && (
        <OrderDetail 
          order={selectedOrder} 
          isOpen={isDetailOpen} 
          onClose={handleCloseDetail} 
          onStatusChange={refetch}
        />
      )}
    </>
  );
}
