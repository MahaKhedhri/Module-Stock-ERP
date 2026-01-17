import { useState, useEffect } from 'react';
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
  orderId?: string | null;
  preSelectedProductId?: string | null;
}

interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function PurchaseOrderModal({ open, onClose, orderId, preSelectedProductId }: PurchaseOrderModalProps) {
  const { suppliers, products, purchaseOrders, addPurchaseOrder, updatePurchaseOrder } = useStock();
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);

  // Load order data when editing
  useEffect(() => {
    if (open) {
      if (orderId) {
        // Editing existing order
        const order = purchaseOrders.find(po => po.id === orderId);
        if (order) {
          setSupplierId(order.supplierId);
          setLines(order.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice
          })));
        }
      } else if (preSelectedProductId) {
        // Pre-select product from alerts
        const product = products.find(p => p.id === preSelectedProductId);
        if (product && product.suppliers && product.suppliers.length > 0) {
          // Use first supplier
          const firstSupplier = product.suppliers[0];
          setSupplierId(firstSupplier.supplierId);
          setLines([{
            productId: preSelectedProductId,
            quantity: 1,
            unitPrice: firstSupplier.purchasePrice || 0
          }]);
        }
      } else {
        // New order
        setSupplierId('');
        setLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
      }
    }
  }, [open, orderId, preSelectedProductId, purchaseOrders, products]);

  // Filter products that have the selected supplier
  const availableProducts = supplierId
    ? products.filter(product => 
        product.suppliers && product.suppliers.some(s => s.supplierId === supplierId)
      )
    : [];

  const handleSupplierChange = (newSupplierId: string) => {
    setSupplierId(newSupplierId);
    // Reset lines when supplier changes (only if not editing)
    if (!orderId) {
      setLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
    }
  };

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
    if (field === 'productId' && supplierId) {
      const product = products.find(p => p.id === value);
      if (product && product.suppliers) {
        // Find the supplier-specific price
        const supplierInfo = product.suppliers.find(s => s.supplierId === supplierId);
        if (supplierInfo && supplierInfo.purchasePrice > 0) {
          newLines[index].unitPrice = supplierInfo.purchasePrice;
        } else if (product.purchasePrice > 0) {
          // Fallback to product's default purchase price
          newLines[index].unitPrice = product.purchasePrice;
        }
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

    if (lines.some(line => !line.productId || line.quantity <= 0 || line.unitPrice < 0)) {
      toast.error('Veuillez remplir toutes les lignes correctement (quantité > 0, prix >= 0)');
      return;
    }

    try {
      if (orderId) {
        // Update existing order
        await updatePurchaseOrder(orderId, {
          supplierId,
          lines,
          total: calculateTotal(),
        });
        toast.success('Commande modifiée avec succès');
      } else {
        // Create new order
        await addPurchaseOrder({
          supplierId,
          date: new Date().toISOString().split('T')[0],
          status: 'draft',
          lines,
          total: calculateTotal(),
        });
        toast.success('Commande créée avec succès');
      }
      
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setSupplierId('');
    setLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{orderId ? 'Modifier la commande' : 'Nouvelle Commande d\'Achat'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Fournisseur *</Label>
            <Select value={supplierId} onValueChange={handleSupplierChange} disabled={!!orderId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(sup => (
                  <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supplierId && availableProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun produit configuré pour ce fournisseur. Veuillez d'abord ajouter ce fournisseur aux produits.
              </p>
            )}
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
                    disabled={!supplierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={supplierId ? "Sélectionner" : "Sélectionnez d'abord un fournisseur"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!supplierId && (
                    <p className="text-xs text-muted-foreground">
                      Veuillez d'abord sélectionner un fournisseur
                    </p>
                  )}
                </div>

                <div className="w-24 space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        updateLine(index, 'quantity', val);
                      }
                    }}
                  />
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
            ))}
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t">
            <span className="text-lg font-semibold">Total commande:</span>
            <span className="text-2xl font-bold text-primary">{calculateTotal().toFixed(2)} €</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!supplierId || availableProducts.length === 0}>
              {orderId ? 'Modifier' : 'Créer la commande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
