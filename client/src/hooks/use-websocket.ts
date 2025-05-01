// Không sử dụng WebSocket, thay bằng API thông thường
// Hook này chỉ giữ lại interface để tương thích với code hiện tại
import { useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  // Trả về các hàm và giá trị giả lập để tránh lỗi nếu có code đang sử dụng hook này
  return { 
    isConnected: true, 
    error: null, 
    lastMessage: null, 
    sendMessage: useCallback((_message: WebSocketMessage) => true, []),
    ping: useCallback(() => true, []),
    registerUser: useCallback((_userId: string) => true, []),
    reconnect: useCallback(() => {}, [])
  };
}