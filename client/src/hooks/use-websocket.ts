import { useEffect, useRef, useState, useCallback } from 'react';

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

  // Khởi tạo WebSocket
  useEffect(() => {
    // Xây dựng URL cho WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}${path}`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      // Tạo kết nối WebSocket
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Xử lý sự kiện kết nối
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
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
        
        if (event.code !== 1000) { // Normal closure
          setError(`Mất kết nối WebSocket (${event.code})`);
        }
      };

      // Đóng kết nối khi component unmount
      return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Lỗi tạo kết nối WebSocket');
    }
  }, [path]);

  // Hàm gửi tin nhắn
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      setError('WebSocket chưa sẵn sàng');
    }
  }, []);

  // Hàm ping để kiểm tra kết nối
  const ping = useCallback(() => {
    sendMessage({ type: 'ping', timestamp: Date.now() });
  }, [sendMessage]);

  return { isConnected, error, lastMessage, sendMessage, ping };
}