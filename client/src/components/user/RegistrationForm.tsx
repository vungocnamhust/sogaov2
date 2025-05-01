import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
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
import { useLocation } from "wouter";
import { initializeOneSignal } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tên phải có ít nhất 2 ký tự.",
  }),
  phone: z.string().min(10, {
    message: "Số điện thoại phải hợp lệ.",
  }),
  address: z.string().min(10, {
    message: "Địa chỉ phải có ít nhất 10 ký tự.",
  }),
  rice_total: z.coerce.number().min(10, {
    message: "Số lượng gạo tối thiểu là 10kg.",
  }),
});

type RegistrationFormValues = z.infer<typeof formSchema>;

export default function RegistrationForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { refreshUser } = useAuth();
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Initialize OneSignal to get player ID
  useEffect(() => {
    const setupOneSignal = async () => {
      try {
        const OneSignal = await initializeOneSignal();
        if (OneSignal) {
          OneSignal.getUserId((id: string) => {
            if (id) {
              setPlayerId(id);
            }
          });
        }
      } catch (error) {
        console.error("Error setting up OneSignal:", error);
      }
    };
    
    setupOneSignal();
  }, []);

  // Define form with default values
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      rice_total: 100,
    },
  });

  // Handle quantity controls
  const incrementRiceTotal = () => {
    const currentValue = form.getValues("rice_total");
    form.setValue("rice_total", currentValue + 5);
  };

  const decrementRiceTotal = () => {
    const currentValue = form.getValues("rice_total");
    if (currentValue > 10) {
      form.setValue("rice_total", currentValue - 5);
    }
  };

  // Create user mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormValues) => {
      return await apiRequest("POST", "/api/users", {
        ...data,
        player_id: playerId,
      });
    },
    onSuccess: async () => {
      toast({
        title: "Đăng ký thành công",
        description: "Thông tin của bạn đã được lưu lại.",
      });
      
      // Refresh user data
      await refreshUser();
      
      // Redirect to home page
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Đăng ký thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: RegistrationFormValues) {
    registerMutation.mutate(values);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-neutral-dark mb-6">Vui lòng cung cấp thông tin cá nhân để bắt đầu đặt gạo.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-dark font-medium">Họ và tên</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nhập họ và tên của bạn" 
                    {...field} 
                    className="w-full p-3 border border-neutral-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-dark font-medium">Số điện thoại</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nhập số điện thoại của bạn" 
                    {...field} 
                    className="w-full p-3 border border-neutral-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-dark font-medium">Địa chỉ</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Nhập địa chỉ giao hàng" 
                    {...field} 
                    rows={3}
                    className="w-full p-3 border border-neutral-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rice_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-dark font-medium">Số lượng gạo đăng ký (kg)</FormLabel>
                <div className="flex items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={decrementRiceTotal}
                    className="bg-neutral-lightest hover:bg-neutral-light text-neutral-dark rounded-l-lg p-3 focus:outline-none transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={10} 
                      step={5}
                      className="p-3 text-center w-full border-y border-neutral-light focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none rounded-none" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "10" : e.target.value;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={incrementRiceTotal}
                    className="bg-neutral-lightest hover:bg-neutral-light text-neutral-dark rounded-r-lg p-3 focus:outline-none transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
                <p className="text-sm text-neutral mt-2">Mặc định: 100 kg, tối thiểu: 10 kg</p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Đang xử lý..." : "Xác nhận đăng ký"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
