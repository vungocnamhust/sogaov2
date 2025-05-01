export default function Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-secondary-light mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold mb-2">Gạo sinh thái</h4>
        <p className="text-neutral-dark">Gạo được trồng theo phương pháp sinh thái, đảm bảo an toàn cho sức khỏe và môi trường.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-secondary-light mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold mb-2">Giao hàng nhanh chóng</h4>
        <p className="text-neutral-dark">Đơn hàng của bạn được xử lý nhanh chóng và giao đến tận nơi trong thời gian ngắn nhất.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-secondary-light mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold mb-2">Quản lý đơn hàng</h4>
        <p className="text-neutral-dark">Theo dõi tình trạng đơn hàng và lịch sử đặt gạo dễ dàng trên ứng dụng.</p>
      </div>
    </div>
  );
}
