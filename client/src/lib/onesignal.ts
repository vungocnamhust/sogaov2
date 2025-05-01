// Không sử dụng OneSignal, chỉ giữ lại các hàm với chức năng trả về null
// Các hàm này vẫn được export để tránh lỗi import ở những nơi khác

export async function loadOneSignal() {
  console.log('OneSignal đã bị tắt, không tải');
  return null;
}

export async function registerPlayerId(_playerId: string) {
  console.log('OneSignal đã bị tắt, không đăng ký player ID');
  return false;
}

export function requestNotificationPermission() {
  console.log('OneSignal đã bị tắt, không yêu cầu quyền thông báo');
  return null;
}