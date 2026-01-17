import { useEffect, useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  productId?: string | null;
}

interface SupplierEntry {
  supplierId: string;
  purchasePrice: string;
  salePrice: string;
}

export function ProductModal({ open, onClose, productId }: ProductModalProps) {
  const { products, categories, suppliers, addProduct, updateProduct } = useStock();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unit: 'unité',
    minStock: '',
    purchasePrice: '',
    salePrice: '',
    image: '',
  });
  const [productSuppliers, setProductSuppliers] = useState<SupplierEntry[]>([]);

  useEffect(() => {
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setFormData({
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          unit: product.unit,
          minStock: product.minStock.toString(),
          purchasePrice: product.purchasePrice.toString(),
          salePrice: product.salePrice.toString(),
          image: product.image || '',
        });
        // Load suppliers if available
        if (product.suppliers && product.suppliers.length > 0) {
          setProductSuppliers(product.suppliers.map(s => ({
            supplierId: s.supplierId,
            purchasePrice: s.purchasePrice.toString(),
            salePrice: s.salePrice.toString(),
          })));
        } else {
          setProductSuppliers([]);
        }
      }
    } else {
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        unit: 'unité',
        minStock: '',
        purchasePrice: '',
        salePrice: '',
        image: '',
      });
      setProductSuppliers([]);
    }
  }, [productId, products, open]);

  // Calculate gain (profit) for a supplier entry
  const calculateGain = (purchasePrice: string, salePrice: string) => {
    const purchase = parseFloat(purchasePrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    if (purchase === 0) return null;
    const gain = sale - purchase;
    const marginPercent = (gain / purchase) * 100;
    return { gain, marginPercent };
  };

  const addSupplier = () => {
    setProductSuppliers([...productSuppliers, {
      supplierId: '',
      purchasePrice: formData.purchasePrice || '',
      salePrice: formData.salePrice || '',
    }]);
  };

  const removeSupplier = (index: number) => {
    setProductSuppliers(productSuppliers.filter((_, i) => i !== index));
  };

  const updateSupplier = (index: number, field: keyof SupplierEntry, value: string) => {
    const updated = [...productSuppliers];
    updated[index] = { ...updated[index], [field]: value };
    setProductSuppliers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one supplier is added
    if (productSuppliers.length === 0) {
      toast.error('Veuillez ajouter au moins un fournisseur');
      return;
    }

    // Validate all suppliers have required fields and non-negative values
    for (const supplier of productSuppliers) {
      if (!supplier.supplierId || !supplier.salePrice) {
        toast.error('Veuillez remplir tous les champs des fournisseurs');
        return;
      }
      const purchasePrice = parseFloat(supplier.purchasePrice) || 0;
      const salePrice = parseFloat(supplier.salePrice);
      if (purchasePrice < 0 || salePrice < 0) {
        toast.error('Les prix ne peuvent pas être négatifs');
        return;
      }
    }

    // Use the first supplier's sale price as the default product sale price
    // This ensures we always have a valid sale_price for the products table
    const defaultSalePrice = productSuppliers.length > 0 && productSuppliers[0].salePrice
      ? parseFloat(productSuppliers[0].salePrice)
      : parseFloat(formData.salePrice) || 0;

    if (!defaultSalePrice || isNaN(defaultSalePrice)) {
      toast.error('Veuillez entrer un prix de vente valide');
      return;
    }

    const minStock = Math.max(0, parseInt(formData.minStock) || 0);
    
    const productData = {
      name: formData.name,
      sku: formData.sku,
      categoryId: formData.categoryId,
      purchasePrice: Math.max(0, parseFloat(formData.purchasePrice) || 0),
      salePrice: Math.max(0, defaultSalePrice),
      unit: formData.unit,
      minStock: minStock,
      image: formData.image || undefined,
      suppliers: productSuppliers.map(s => ({
        supplierId: s.supplierId,
        purchasePrice: Math.max(0, parseFloat(s.purchasePrice) || 0),
        salePrice: Math.max(0, parseFloat(s.salePrice)),
      })),
    };

    try {
      if (productId) {
        await updateProduct(productId, productData);
        toast.success('Produit modifié avec succès');
        onClose();
      } else {
        await addProduct(productData);
        toast.success('Produit ajouté avec succès');
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMessage = error.message || 'Une erreur est survenue lors de l\'enregistrement';
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productId ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Ordinateur portable"
            />
          </div>

          {/* 2. SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
              placeholder="Ex: PROD-001"
            />
          </div>

          {/* 3. Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Unité */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unité *</Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unité">Unité</SelectItem>
                <SelectItem value="boîte">Boîte</SelectItem>
                <SelectItem value="ramette">Ramette</SelectItem>
                <SelectItem value="kg">Kilogramme</SelectItem>
                <SelectItem value="litre">Litre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Stock min */}
          <div className="space-y-2">
            <Label htmlFor="minStock">Stock minimum *</Label>
            <Input
              id="minStock"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              required
              placeholder="Ex: 10"
              min="0"
            />
          </div>

          {/* 6, 7, 8. Fournisseurs avec Prix d'achat et Prix de vente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fournisseurs *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSupplier} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un fournisseur
              </Button>
            </div>
            {productSuppliers.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground">
                Aucun fournisseur ajouté. Cliquez sur "Ajouter un fournisseur" pour commencer.
              </Card>
            ) : (
              <div className="space-y-4">
                {productSuppliers.map((supplier, index) => {
                  const gainInfo = calculateGain(supplier.purchasePrice, supplier.salePrice);
                  const selectedSupplier = suppliers.find(s => s.id === supplier.supplierId);

                  return (
                    <Card key={index} className="p-4 border-2">
                      <div className="space-y-4">
                        {/* Fournisseur nom */}
                        <div className="space-y-2">
                          <Label>Fournisseur (nom) *</Label>
                          <Select
                            value={supplier.supplierId}
                            onValueChange={(value) => updateSupplier(index, 'supplierId', value)}
                          >
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

                        <div className="grid grid-cols-2 gap-4">
                          {/* Prix d'achat */}
                          <div className="space-y-2">
                            <Label>Prix d'achat (€) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={supplier.purchasePrice}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || parseFloat(val) >= 0) {
                                  updateSupplier(index, 'purchasePrice', val);
                                }
                              }}
                              placeholder="0.00"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Coût d'achat depuis ce fournisseur
                            </p>
                          </div>

                          {/* Prix de vente */}
                          <div className="space-y-2">
                            <Label>Prix de vente (€) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={supplier.salePrice}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || parseFloat(val) >= 0) {
                                  updateSupplier(index, 'salePrice', val);
                                }
                              }}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Prix de vente au client
                            </p>
                          </div>
                        </div>

                        {/* Gain calculé automatiquement */}
                        {gainInfo && supplier.purchasePrice && supplier.salePrice && (
                          <div className="p-3 bg-muted rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Gain par unité:</span>
                              </div>
                              <div className="text-right">
                                <Badge variant={gainInfo.gain > 0 ? "default" : "destructive"} className="text-lg px-3 py-1">
                                  {gainInfo.gain >= 0 ? '+' : ''}{gainInfo.gain.toFixed(2)} €
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Marge: {gainInfo.marginPercent >= 0 ? '+' : ''}{gainInfo.marginPercent.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            {selectedSupplier && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Pour chaque unité commandée depuis <strong>{selectedSupplier.name}</strong>, 
                                vous dépensez <strong>{parseFloat(supplier.purchasePrice).toFixed(2)} €</strong> 
                                et gagnez <strong>{gainInfo.gain.toFixed(2)} €</strong> à la vente.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSupplier(index)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="image">URL Image (optionnel)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {productId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
