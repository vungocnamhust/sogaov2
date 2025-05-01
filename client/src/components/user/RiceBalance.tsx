import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

export default function RiceBalance() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const { rice_total, rice_left } = user;
  const percentage = rice_total > 0 ? Math.floor((rice_left / rice_total) * 100) : 0;
  const usedAmount = rice_total - rice_left;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h3 className="text-xl font-semibold text-neutral-darkest mb-4">Số dư gạo của bạn</h3>
      <div className="flex items-center mb-4">
        <div className="text-4xl font-bold text-primary">{rice_left}</div>
        <div className="text-lg text-neutral ml-2">/ <span>{rice_total}</span> kg</div>
      </div>
      
      {/* Progress bar */}
      <Progress className="h-4 bg-neutral-lightest rounded-full overflow-hidden mb-2" value={percentage} />
      
      <p className="text-sm text-neutral mb-4">
        Bạn đã sử dụng {usedAmount}kg từ tổng số {rice_total}kg gạo đăng ký.
      </p>
      
      <Link href="#orderForm">
        <Button className="inline-block bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg transition">
          Đặt gạo ngay
        </Button>
      </Link>
    </div>
  );
}
