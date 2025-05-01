import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './use-auth';

// Định nghĩa các loại tin nhắn WebSocket
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(path = '/ws') {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { user } = useAuth();
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo WebSocket
  const connectWebSocket = useCallback(() => {
    // Nếu đã có kết nối đang mở, không cần tạo mới
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Nếu đang có kết nối đang đóng, đợi nó đóng xong
    if (socketRef.current?.readyState === WebSocket.CLOSING) {
      setTimeout(connectWebSocket, 500);
      return;
    }
    
    // Xóa kết nối cũ nếu có
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (err) {
        console.warn('Error closing existing WebSocket:', err);
      }
    }
    
    // Xây dựng URL cho WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}${path}`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      // Tạo kết nối WebSocket mới
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Xử lý sự kiện kết nối
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Đăng ký user nếu đã đăng nhập
        if (user?.id) {
          socket.send(JSON.stringify({
            type: 'register',
            userId: user.id
          }));
        }
        
        // Thiết lập ping định kỳ 30 giây một lần
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
              type: 'ping', 
              timestamp: Date.now() 
            }));
          }
        }, 30000);
        
        // Lưu interval ID để dọn dẹp
        (socket as any).pingInterval = pingInterval;
      };

      // Xử lý tin nhắn đến
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          setLastMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      // Xử lý lỗi
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Lỗi kết nối WebSocket');
      };

      // Xử lý đóng kết nối
      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        setIsConnected(false);
        
        // Xóa interval khi đóng kết nối
        if ((socket as any).pingInterval) {
          clearInterval((socket as any).pingInterval);
        }
        
        if (event.code !== 1000) { // Normal closure
          setError(`Mất kết nối WebSocket (${event.code})`);
          
          // Tự động kết nối lại sau 5 giây
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          
          reconnectTimerRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Lỗi tạo kết nối WebSocket');
    }
  }, [path, user]);

  // Kết nối lại khi path hoặc user thay đổi
  useEffect(() => {
    connectWebSocket();
    
    // Đóng kết nối khi component unmount
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (socketRef.current) {
        // Xóa interval nếu có
        if ((socketRef.current as any).pingInterval) {
          clearInterval((socketRef.current as any).pingInterval);
        }
        
        // Đóng kết nối
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Hàm gửi tin nhắn
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      setError('WebSocket chưa sẵn sàng');
      // Thử kết nối lại
      connectWebSocket();
      return false;
    }
  }, [connectWebSocket]);

  // Hàm ping để kiểm tra kết nối
  const ping = useCallback(() => {
    return sendMessage({ type: 'ping', timestamp: Date.now() });
  }, [sendMessage]);

  // Đăng ký người dùng với WebSocket
  const registerUser = useCallback((userId: string) => {
    return sendMessage({
      type: 'register',
      userId: userId
    });
  }, [sendMessage]);

  return { 
    isConnected, 
    error, 
    lastMessage, 
    sendMessage, 
    ping,
    registerUser,
    reconnect: connectWebSocket
  };
}