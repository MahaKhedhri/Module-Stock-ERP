import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
        <Popover>
          <PopoverTrigger asChild>
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
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Alertes de Stock</h4>
                <p className="text-sm text-muted-foreground">
                  {lowStockCount} produit(s) en rupture ou stock bas.
                </p>
              </div>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {products
                  .filter(p => p.quantity <= p.minStock)
                  .map(product => (
                    <div key={product.id} className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <Badge variant={product.quantity === 0 ? "destructive" : "secondary"}>
                        {product.quantity}
                      </Badge>
                    </div>
                  ))}
                {lowStockCount === 0 && (
                  <p className="text-sm text-center py-4 text-muted-foreground">Tout est en ordre ✅</p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
