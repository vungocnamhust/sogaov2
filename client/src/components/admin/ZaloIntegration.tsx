import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ZaloSettings {
  connected: boolean;
  oaName: string | null;
  sendNewOrderNotification: boolean;
  sendStatusUpdateNotification: boolean;
}

interface UpdateZaloSettingsDto {
  sendNewOrderNotification: boolean;
  sendStatusUpdateNotification: boolean;
}

export default function ZaloIntegration() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ZaloSettings>({
    connected: false,
    oaName: null,
    sendNewOrderNotification: true,
    sendStatusUpdateNotification: true,
  });

  // Fetch Zalo settings
  const { data, isLoading, error, refetch } = useQuery<ZaloSettings>({
    queryKey: ['/api/admin/zalo-settings'],
  });

  // Update settings from fetched data
  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: UpdateZaloSettingsDto) => {
      return await apiRequest("POST", "/api/admin/zalo-settings", updatedSettings);
    },
    onSuccess: () => {
      toast({
        title: "Cài đặt đã được lưu",
        description: "Cài đặt thông báo Zalo đã được cập nhật.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Lưu cài đặt thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Connect to Zalo OA
  const connectZaloMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/connect-zalo", {});
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Redirect to Zalo OAuth page
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast({
        title: "Kết nối thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Disconnect from Zalo OA
  const disconnectZaloMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/disconnect-zalo", {});
    },
    onSuccess: () => {
      toast({
        title: "Ngắt kết nối thành công",
        description: "Đã ngắt kết nối với Zalo OA.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Ngắt kết nối thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      sendNewOrderNotification: settings.sendNewOrderNotification,
      sendStatusUpdateNotification: settings.sendStatusUpdateNotification,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Tích hợp Zalo OA</h3>
        <p className="text-error">Đã xảy ra lỗi khi tải cài đặt Zalo. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4">Tích hợp Zalo OA</h3>
      
      {settings.connected ? (
        <div id="zaloConnected">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Đã kết nối Zalo OA</h4>
                <p className="text-sm text-neutral-dark">{settings.oaName || "Làng Gạo Official"}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="text-error hover:text-error/80 font-medium"
              onClick={() => disconnectZaloMutation.mutate()}
              disabled={disconnectZaloMutation.isPending}
            >
              {disconnectZaloMutation.isPending ? "Đang xử lý..." : "Ngắt kết nối"}
            </Button>
          </div>
          
          <div className="bg-neutral-lightest p-4 rounded-lg mb-4">
            <h5 className="font-medium mb-2">Cài đặt thông báo</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new-order" 
                  checked={settings.sendNewOrderNotification} 
                  onCheckedChange={(checked) => 
                    setSettings({...settings, sendNewOrderNotification: !!checked})
                  }
                />
                <Label htmlFor="new-order">Gửi thông báo khi có đơn hàng mới</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="update-status" 
                  checked={settings.sendStatusUpdateNotification} 
                  onCheckedChange={(checked) => 
                    setSettings({...settings, sendStatusUpdateNotification: !!checked})
                  }
                />
                <Label htmlFor="update-status">Gửi thông báo khi cập nhật trạng thái đơn hàng</Label>
              </div>
            </div>
          </div>
          
          <Button 
            className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg transition"
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      ) : (
        <div id="zaloDisconnected">
          <p className="text-neutral-dark mb-4">
            Kết nối Zalo Official Account để gửi thông báo đến khách hàng khi cập nhật đơn hàng.
          </p>
          
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition flex items-center"
            onClick={() => connectZaloMutation.mutate()}
            disabled={connectZaloMutation.isPending}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            {connectZaloMutation.isPending ? "Đang xử lý..." : "Kết nối với Zalo OA"}
          </Button>
        </div>
      )}
    </div>
  );
}
