import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-primary-light/10 to-accent-light/20 rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="md:w-3/5 mb-6 md:mb-0 md:pr-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Gạo sinh thái<br/>tươi ngon mỗi ngày
          </h2>
          <p className="text-neutral-dark mb-6">
            Đặt gạo làng gạo, thưởng thức hương vị tươi ngon của thiên nhiên, được nuôi trồng và thu hoạch 
            bằng phương pháp sinh thái bền vững.
          </p>
          <div className="flex space-x-4">
            <Link href="#orderForm">
              <Button className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition shadow-sm">
                Đặt gạo ngay
              </Button>
            </Link>
            <Button variant="outline" className="border border-neutral-light text-neutral-dark font-medium px-6 py-3 rounded-lg hover:bg-white transition">
              Tìm hiểu thêm
            </Button>
          </div>
        </div>
        <div className="md:w-2/5">
          <img 
            src="https://images.unsplash.com/photo-1586201375761-83865001e8cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
            alt="Gạo sinh thái" 
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
