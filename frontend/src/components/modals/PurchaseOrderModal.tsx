import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
}

interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function PurchaseOrderModal({ open, onClose }: PurchaseOrderModalProps) {
  const { suppliers, products, addPurchaseOrder } = useStock();
  const [supplierId, setSupplierId] = useState('');
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
        newLines[index].unitPrice = product.purchasePrice;
      }
    }

    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    if (lines.some(line => !line.productId || line.quantity <= 0)) {
      toast.error('Veuillez remplir toutes les lignes correctement');
      return;
    }

    try {
      await addPurchaseOrder({
        supplierId,
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        lines,
        total: calculateTotal(),
      });

      toast.success('Commande créée avec succès');
      setSupplierId('');
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
          <DialogTitle>Nouvelle Commande d'Achat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Fournisseur *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(sup => (
                  <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lignes de commande</Label>
              <Button type="button" size="sm" onClick={addLine} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>

            {lines.map((line, index) => (
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
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24 space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>

                <div className="w-32 space-y-2">
                  <Label>Prix unitaire</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value))}
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
            ))}
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
