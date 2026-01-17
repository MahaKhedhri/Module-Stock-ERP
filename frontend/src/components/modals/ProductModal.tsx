import { useEffect, useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
    purchasePrice: '',
    salePrice: '',
    unit: 'unité',
    minStock: '',
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
          purchasePrice: product.purchasePrice.toString(),
          salePrice: product.salePrice.toString(),
          unit: product.unit,
          minStock: product.minStock.toString(),
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
        purchasePrice: '',
        salePrice: '',
        unit: 'unité',
        minStock: '',
        image: '',
      });
      setProductSuppliers([]);
    }
  }, [productId, products, open]);

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

    // Validate all suppliers have required fields
    for (const supplier of productSuppliers) {
      if (!supplier.supplierId || !supplier.salePrice) {
        toast.error('Veuillez remplir tous les champs des fournisseurs');
        return;
      }
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      categoryId: formData.categoryId,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      salePrice: parseFloat(formData.salePrice),
      unit: formData.unit,
      minStock: parseInt(formData.minStock) || 0,
      image: formData.image || undefined,
      suppliers: productSuppliers.map(s => ({
        supplierId: s.supplierId,
        purchasePrice: parseFloat(s.purchasePrice) || 0,
        salePrice: parseFloat(s.salePrice),
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productId ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Prix d'achat par défaut (€)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Prix de vente par défaut (€) *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock min. *</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                required
              />
            </div>
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
          </div>

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
              <div className="space-y-3">
                {productSuppliers.map((supplier, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4 space-y-2">
                        <Label>Fournisseur *</Label>
                        <Select
                          value={supplier.supplierId}
                          onValueChange={(value) => updateSupplier(index, 'supplierId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map(sup => (
                              <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label>Prix d'achat (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={supplier.purchasePrice}
                          onChange={(e) => updateSupplier(index, 'purchasePrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label>Prix de vente (€) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={supplier.salePrice}
                          onChange={(e) => updateSupplier(index, 'salePrice', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSupplier(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
