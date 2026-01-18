import { useState, useRef } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Plus, Package, Warehouse as WarehouseIcon, GripVertical, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Warehouses() {
  const { warehouses, products, addWarehouse, updateWarehouse, deleteWarehouse, assignProductToWarehouse, removeProductFromWarehouse, moveProductBetweenWarehouses, loading } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<string | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [draggedProduct, setDraggedProduct] = useState<{ productId: string; warehouseId?: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', description: '' });

  // Get products not in any warehouse
  const getAvailableProducts = () => {
    // Get all product IDs that are in any warehouse
    const assignedProductIds = new Set<string>();
    warehouses.forEach(warehouse => {
      warehouse.products?.forEach(product => {
        assignedProductIds.add(product.productId);
      });
    });

    // Return products that are not in any warehouse
    return products.filter(p => !assignedProductIds.has(p.id));
  };

  const handleOpenModal = (warehouseId?: string) => {
    if (warehouseId) {
      const warehouse = warehouses.find(w => w.id === warehouseId);
      if (warehouse) {
        setFormData({
          name: warehouse.name,
          address: warehouse.address || '',
          description: warehouse.description || '',
        });
        setEditingWarehouse(warehouseId);
      }
    } else {
      setFormData({ name: '', address: '', description: '' });
      setEditingWarehouse(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse, formData);
        toast.success('Entrepôt modifié avec succès');
      } else {
        await addWarehouse(formData);
        toast.success('Entrepôt créé avec succès');
      }
      setIsModalOpen(false);
      setFormData({ name: '', address: '', description: '' });
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async () => {
    if (deletingWarehouse) {
      try {
        await deleteWarehouse(deletingWarehouse);
        toast.success('Entrepôt supprimé avec succès');
        setDeletingWarehouse(null);
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, productId: string, warehouseId?: string) => {
    setDraggedProduct({ productId, warehouseId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', productId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset dragged product if drop was not successful
    if (draggedProduct) {
      setDraggedProduct(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetWarehouseId: string) => {
    e.preventDefault();
    if (!draggedProduct) return;

    try {
      if (draggedProduct.warehouseId) {
        // Moving from one warehouse to another
        if (draggedProduct.warehouseId !== targetWarehouseId) {
          const sourceWarehouse = warehouses.find(w => w.id === draggedProduct.warehouseId);
          const product = sourceWarehouse?.products?.find(p => p.productId === draggedProduct.productId);
          if (product) {
            await moveProductBetweenWarehouses(
              draggedProduct.warehouseId,
              targetWarehouseId,
              draggedProduct.productId,
              product.quantity
            );
            toast.success('Produit déplacé avec succès');
          }
        }
      } else {
        // Check if product is already in another warehouse
        const productInWarehouse = warehouses.find(w =>
          w.products?.some(p => p.productId === draggedProduct.productId)
        );

        if (productInWarehouse) {
          toast.error(`Ce produit est déjà dans l'entrepôt "${productInWarehouse.name}"`);
          setDraggedProduct(null);
          return;
        }

        // Assigning new product to warehouse - use current product quantity
        const product = products.find(p => p.id === draggedProduct.productId);
        const productQuantity = product?.quantity || 0;
        await assignProductToWarehouse(targetWarehouseId, draggedProduct.productId, productQuantity);
        toast.success('Produit assigné à l\'entrepôt');
      }
      setDraggedProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du déplacement');
      setDraggedProduct(null);
    }
  };

  const handleRemoveProduct = async (warehouseId: string, productId: string) => {
    if (confirm('Retirer ce produit de l\'entrepôt ?')) {
      try {
        await removeProductFromWarehouse(warehouseId, productId);
        toast.success('Produit retiré de l\'entrepôt');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des entrepôts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Entrepôts</h2>
          <p className="text-muted-foreground">Gérez vos entrepôts et assignez des produits</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel entrepôt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Products */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            <h3 className="font-semibold">Produits disponibles</h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {getAvailableProducts().map((product) => (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => handleDragStart(e, product.id)}
                onDragEnd={handleDragEnd}
                className="p-3 border rounded-lg cursor-move hover:bg-muted transition-colors flex items-center gap-3"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <Badge variant="outline">{product.quantity} {product.unit}</Badge>
              </div>
            ))}
            {getAvailableProducts().length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {selectedWarehouse ? 'Tous les produits sont dans cet entrepôt' : 'Aucun produit disponible'}
              </p>
            )}
          </div>
        </Card>

        {/* Warehouses */}
        <div className="lg:col-span-2 space-y-4">
          {warehouses.map((warehouse) => (
            <Card
              key={warehouse.id}
              className={`p-4 border-2 transition-colors ${draggedProduct ? 'border-primary' : ''
                }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, warehouse.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <WarehouseIcon className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                    <Badge variant="secondary">{warehouse.productCount} produit(s)</Badge>
                  </div>
                  {warehouse.address && (
                    <p className="text-sm text-muted-foreground mb-1">{warehouse.address}</p>
                  )}
                  {warehouse.description && (
                    <p className="text-sm text-muted-foreground">{warehouse.description}</p>
                  )}
                </div>
                <div className="flex gap-2">

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(warehouse.id)}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingWarehouse(warehouse.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>

              {/* Products in warehouse */}
              <div className="space-y-2 min-h-[100px]">
                {warehouse.products && warehouse.products.length > 0 ? (
                  warehouse.products.map((product) => (
                    <div
                      key={product.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, product.productId, warehouse.id)}
                      onDragEnd={handleDragEnd}
                      className="p-2 border rounded-lg bg-muted/50 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                        <Badge variant="outline">{product.quantity} {product.unit}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveProduct(warehouse.id, product.productId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Glissez des produits ici pour les assigner à cet entrepôt
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {warehouses.length === 0 && (
            <Card className="p-12 text-center">
              <WarehouseIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Aucun entrepôt créé</p>
              <Button onClick={() => handleOpenModal()}>Créer un entrepôt</Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Entrepôt Principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: 123 Rue Example, Ville"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'entrepôt..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingWarehouse ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingWarehouse !== null} onOpenChange={(open) => !open && setDeletingWarehouse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'entrepôt</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet entrepôt ? Cette action est irréversible.
              {warehouses.find(w => w.id === deletingWarehouse)?.productCount > 0 && (
                <span className="block mt-2 text-destructive font-semibold">
                  Attention : Cet entrepôt contient des produits. Ils seront retirés.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

