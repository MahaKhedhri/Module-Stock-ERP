import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExitOrderModalProps {
  open: boolean;
  onClose: () => void;
}

interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function ExitOrderModal({ open, onClose }: ExitOrderModalProps) {
  const { products, addExitOrder } = useStock();
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);

  const addLine = () => {
    setLines([...lines, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof OrderLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-fill price when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newLines[index].unitPrice = product.salePrice;
      }
    }

    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lines.some(line => !line.productId || line.quantity <= 0 || line.unitPrice < 0)) {
      toast.error('Veuillez remplir toutes les lignes correctement (quantité > 0, prix >= 0)');
      return;
    }

    // Check stock availability
    for (const line of lines) {
      const product = products.find(p => p.id === line.productId);
      if (product && product.quantity < line.quantity) {
        toast.error(`Stock insuffisant pour ${product.name}. Disponible: ${product.quantity}, Demandé: ${line.quantity}`);
        return;
      }
    }

    try {
      await addExitOrder({
        customerName: customerName || undefined,
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        lines,
        total: calculateTotal(),
        note: note || undefined,
      });

      toast.success('Commande de sortie créée avec succès');
      setCustomerName('');
      setNote('');
      setLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Commande de Sortie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nom du client (optionnel)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom du client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note..."
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lignes de commande</Label>
              <Button type="button" size="sm" onClick={addLine} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>

            {lines.map((line, index) => {
              const product = products.find(p => p.id === line.productId);
              const availableStock = product ? product.quantity : 0;
              const isStockInsufficient = product && availableStock < line.quantity;

              return (
                <div key={index} className="flex gap-2 items-end p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Produit</Label>
                    <Select
                      value={line.productId}
                      onValueChange={(value) => updateLine(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.quantity > 0 && `(Stock: ${p.quantity})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {product && (
                      <p className="text-xs text-muted-foreground">
                        Stock disponible: {availableStock} {product.unit}
                      </p>
                    )}
                  </div>

                  <div className="w-24 space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={line.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= availableStock) {
                          updateLine(index, 'quantity', val);
                        }
                      }}
                      className={isStockInsufficient ? 'border-red-500' : ''}
                    />
                    {isStockInsufficient && (
                      <p className="text-xs text-red-500">Stock insuffisant</p>
                    )}
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Prix unitaire</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          updateLine(index, 'unitPrice', val);
                        }
                      }}
                    />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Total</Label>
                    <Input
                      value={(line.quantity * line.unitPrice).toFixed(2) + ' €'}
                      disabled
                    />
                  </div>

                  {lines.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t">
            <span className="text-lg font-semibold">Total commande:</span>
            <span className="text-2xl font-bold text-primary">{calculateTotal().toFixed(2)} €</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Créer la commande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

