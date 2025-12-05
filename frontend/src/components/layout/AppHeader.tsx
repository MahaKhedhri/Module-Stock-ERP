import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStock } from '@/contexts/StockContext';

export function AppHeader() {
  const { products } = useStock();
  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold text-foreground">Gestion de Stock</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {lowStockCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {lowStockCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
