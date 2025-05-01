import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  quantity: z.coerce.number().min(1, {
    message: "Số lượng tối thiểu là 1kg.",
  }),
  address: z.string().min(10, {
    message: "Địa chỉ phải có ít nhất 10 ký tự.",
  }),
  note: z.string().optional(),
});

type OrderFormValues = z.infer<typeof formSchema>;

export default function OrderForm() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [orderPreview, setOrderPreview] = useState({
    quantity: 5,
    remainingBefore: user?.rice_left || 0,
    remainingAfter: (user?.rice_left || 0) - 5,
  });

  const maxQuantity = user?.rice_left || 0;

  // Define form with default values
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 5,
      address: user?.address || "",
      note: "",
    },
  });

  // Handle quantity controls
  const incrementQuantity = () => {
    const currentValue = form.getValues("quantity");
    if (currentValue < maxQuantity) {
      const newValue = currentValue + 1;
      form.setValue("quantity", newValue);
      updateOrderPreview(newValue);
    }
  };

  const decrementQuantity = () => {
    const currentValue = form.getValues("quantity");
    if (currentValue > 1) {
      const newValue = currentValue - 1;
      form.setValue("quantity", newValue);
      updateOrderPreview(newValue);
    }
  };

  const updateOrderPreview = (quantity: number) => {
    setOrderPreview({
      quantity,
      remainingBefore: user?.rice_left || 0,
      remainingAfter: (user?.rice_left || 0) - quantity,
    });
  };

  // Watch quantity field to update preview
  const quantity = form.watch("quantity");
  
  // Update preview when quantity changes
  useState(() => {
    updateOrderPreview(quantity);
  });

  // Create order mutation
  const orderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      return await apiRequest("POST", "/api/orders", data);
    },
    onSuccess: async () => {
      toast({
        title: "Đặt hàng thành công",
        description: "Đơn hàng của bạn đã được ghi nhận.",
      });
      
      // Refresh user data (to update rice balance)
      await refreshUser();
      
      // Reset form
      form.reset({
        quantity: 5,
        address: user?.address || "",
        note: "",
      });
      
      // Update preview
      updateOrderPreview(5);
      
      // Invalidate orders query
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Đặt hàng thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: OrderFormValues) {
    // Validate maximum quantity
    if (values.quantity > maxQuantity) {
      form.setError("quantity", {
        type: "manual",
        message: `Số lượng tối đa là ${maxQuantity}kg.`,
      });
      return;
    }
    
    orderMutation.mutate(values);
  }

  return (
    <div id="orderForm" className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h3 className="text-xl font-semibold text-neutral-darkest mb-6">Đặt gạo</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-neutral-dark mb-2 font-medium">Số lượng gạo (kg)</FormLabel>
                <div className="flex items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={decrementQuantity}
                    className="bg-neutral-lightest hover:bg-neutral-light text-neutral-dark rounded-l-lg p-3 focus:outline-none transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={maxQuantity}
                      className="p-3 text-center w-full border-y border-neutral-light focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none rounded-none" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "1" : e.target.value;
                        const numValue = parseInt(value);
                        field.onChange(numValue);
                        updateOrderPreview(numValue);
                      }}
                    />
                  </FormControl>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={incrementQuantity}
                    className="bg-neutral-lightest hover:bg-neutral-light text-neutral-dark rounded-r-lg p-3 focus:outline-none transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
                <p className="text-sm text-neutral mt-2">Số lượng tối đa: <span>{maxQuantity}</span> kg</p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-neutral-dark mb-2 font-medium">Địa chỉ giao hàng</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={3}
                    className="w-full p-3 border border-neutral-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" 
                    placeholder="Nhập địa chỉ giao hàng"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-neutral-dark mb-2 font-medium">Ghi chú (tùy chọn)</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={2}
                    className="w-full p-3 border border-neutral-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" 
                    placeholder="Thêm ghi chú cho đơn hàng của bạn"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="bg-neutral-lightest p-4 rounded-lg mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-neutral-dark">Số lượng:</span>
              <span className="font-medium">{orderPreview.quantity} kg</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-neutral-dark">Số dư hiện tại:</span>
              <span className="font-medium">{orderPreview.remainingBefore} kg</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-neutral-dark">Số dư sau khi đặt:</span>
              <span>{orderPreview.remainingAfter} kg</span>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            disabled={orderMutation.isPending || maxQuantity === 0}
          >
            {orderMutation.isPending ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </Button>
          
          {maxQuantity === 0 && (
            <p className="text-error text-center">Bạn đã hết gạo, không thể đặt thêm.</p>
          )}
        </form>
      </Form>
    </div>
  );
}
