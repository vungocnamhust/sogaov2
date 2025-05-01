import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
import { useLocation } from "wouter";


const formSchema = z.object({
  access_token: z.string().min(1, {
    message: "Mã khóa không được để trống.",
  }),
});

type AdminLoginFormValues = z.infer<typeof formSchema>;

export default function AdminLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  // Không cần trạng thái loading nữa vì không sử dụng OneSignal

  // Define form with default values
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      access_token: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: AdminLoginFormValues) => {
      return await apiRequest("POST", "/api/admin/login", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Store token
      localStorage.setItem('admin_token', data.token);
      
      // Không sử dụng OneSignal cho thông báo
      
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn đến với trang quản trị Làng Gạo.",
      });
      
      // Redirect to admin dashboard
      setLocation("/admin/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Đăng nhập thất bại",
        description: error instanceof Error ? error.message : "Mã khóa không chính xác.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: AdminLoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-neutral-dark mb-6">Vui lòng nhập mã khóa để truy cập trang quản trị.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="access_token"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-neutral-dark mb-2 font-medium">Mã khóa</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Nhập mã khóa của bạn" 
                    {...field} 
                    className="w-full p-3 border border-neutral-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
