import { useState, useRef } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Plus, Package, Warehouse as WarehouseIcon, GripVertical, X, Printer, QrCode as QRCodeIcon } from 'lucide-react';
import QRCode from "react-qr-code";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Warehouses() {
  const { warehouses, products, addWarehouse, updateWarehouse, deleteWarehouse, assignProductToWarehouse, removeProductFromWarehouse, moveProductBetweenWarehouses, loading } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<string | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [draggedProduct, setDraggedProduct] = useState<{ productId: string; warehouseId?: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', description: '', zones: '', shelves: '' });

  // Assignment Modal State
  const [assignmentModal, setAssignmentModal] = useState<{ isOpen: boolean; productId: string | null; warehouseId: string | null; sourceWarehouseId?: string | null }>({ isOpen: false, productId: null, warehouseId: null, sourceWarehouseId: null });
  const [assignmentData, setAssignmentData] = useState({ shelf: '', expirationDate: '', zoneId: '' });
  const [qrData, setQrData] = useState<string | null>(null);

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
          zones: warehouse.zones?.map(z => z.name).join(', ') || '',
          shelves: warehouse.shelves || ''
        });
        setEditingWarehouse(warehouseId);
      }
    } else {
      setFormData({ name: '', address: '', description: '', zones: '', shelves: '' });
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
      setFormData({ name: '', address: '', description: '', zones: '', shelves: '' });
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
          // Open modal for move details
          setAssignmentModal({
            isOpen: true,
            productId: draggedProduct.productId,
            warehouseId: targetWarehouseId,
            sourceWarehouseId: draggedProduct.warehouseId
          });
          setAssignmentData({ shelf: '', expirationDate: '', zoneId: '' });
          setQrData(null);
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

        // Assigning new product to warehouse - open modal for details
        setAssignmentModal({
          isOpen: true,
          productId: draggedProduct.productId,
          warehouseId: targetWarehouseId,
          sourceWarehouseId: null
        });
        setAssignmentData({ shelf: '', expirationDate: '', zoneId: '' });
        setQrData(null);
      }
      setDraggedProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du déplacement');
      setDraggedProduct(null);
    }
  };

  const handleAssignmentConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentModal.productId || !assignmentModal.warehouseId) return;

    try {
      let product;
      let qty = 0;

      if (assignmentModal.sourceWarehouseId) {
        // Handle Move
        const sourceWarehouse = warehouses.find(w => w.id === assignmentModal.sourceWarehouseId);
        const sourceProduct = sourceWarehouse?.products?.find(p => p.productId === assignmentModal.productId);
        product = products.find(p => p.id === assignmentModal.productId); // Get generic product info
        qty = sourceProduct?.quantity || 0;

        await moveProductBetweenWarehouses(
          assignmentModal.sourceWarehouseId,
          assignmentModal.warehouseId,
          assignmentModal.productId,
          qty,
          assignmentData.shelf,
          assignmentData.expirationDate,
          assignmentData.zoneId || null
        );
      } else {
        // Handle New Assignment
        product = products.find(p => p.id === assignmentModal.productId);
        qty = product?.quantity || 0;

        await assignProductToWarehouse(
          assignmentModal.warehouseId,
          assignmentModal.productId,
          qty,
          assignmentData.shelf,
          assignmentData.expirationDate,
          assignmentData.zoneId || null
        );
      }

      const productQuantity = qty;

      // Generate QR Code Data
      const selectedZone = warehouses
        .find(w => w.id === assignmentModal.warehouseId)
        ?.zones?.find(z => z.id === assignmentData.zoneId);

      const qrPayload = {
        product: product?.name,
        quantity: productQuantity,
        expiration: assignmentData.expirationDate,
        shelf: assignmentData.shelf,
        zone: selectedZone?.name || 'N/A',
        addedAt: new Date().toISOString().split('T')[0]
      };

      setQrData(JSON.stringify(qrPayload));
      toast.success('Produit assigné avec succès');
      // Do not close modal yet, show QR code
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'assignation');
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Voir le QR Code"
                          onClick={() => {
                            const qrPayload = {
                              product: product.productName,
                              quantity: product.quantity,
                              expiration: product.expirationDate,
                              shelf: product.shelf,
                            };
                            setQrData(JSON.stringify(qrPayload));
                            setAssignmentModal({ isOpen: true, productId: null, warehouseId: null });
                          }}
                        >
                          <QRCodeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Retirer le produit"
                          onClick={() => handleRemoveProduct(warehouse.id, product.productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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

            {!editingWarehouse && (
              <div className="space-y-2">
                <Label htmlFor="type">Type d'entrepôt (Pré-configuration)</Label>
                <Select onValueChange={(value) => {
                  let zones = '';
                  let shelves = '';
                  // Pre-configurations
                  if (value === 'small') {
                    zones = 'Zone A, Zone B, Zone C, Zone D';
                    shelves = 'A-1, A-2, A-3, A-4, B-1, B-2, B-3, B-4, C-1, C-2, C-3, C-4, D-1, D-2, D-3, D-4';
                  } else if (value === 'medium') {
                    zones = 'Zone A, Zone B, Zone C, Zone D, Zone E, Zone F';
                    shelves = 'A-1, A-2, A-3, B-1, B-2, B-3, C-1, C-2, C-3, D-1, D-2, D-3, E-1, E-2, E-3, F-1, F-2, F-3';
                  } else if (value === 'large') {
                    zones = 'Zone Reception, Zone Expédition, Zone Stockage A, Zone Stockage B, Zone Froid, Zone Vrac';
                    shelves = 'A-01, A-02, A-03, A-04, A-05, B-01, B-02, B-03, B-04, B-05, F-01, F-02, V-01, V-02';
                  }

                  setFormData(prev => ({
                    ...prev,
                    zones: value === 'custom' ? '' : zones,
                    shelves: value === 'custom' ? '' : shelves
                  }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Petit (4 Zones, ~16 Étagères)</SelectItem>
                    <SelectItem value="medium">Moyen (6 Zones, ~20 Étagères)</SelectItem>
                    <SelectItem value="large">Grand (Industriel)</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
            <div className="space-y-2">
              <Label htmlFor="zones">Zones (séparées par des virgules)</Label>
              <Input
                id="zones"
                value={formData.zones}
                onChange={(e) => setFormData({ ...formData, zones: e.target.value })}
                placeholder="Ex: Zone A, Zone B, Zone Froid"
              />
              <p className="text-xs text-muted-foreground">Les zones définissent les grandes sections de l'entrepôt.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelves">Étagères / Rayons (séparées par des virgules)</Label>
              <Input
                id="shelves"
                value={formData.shelves}
                onChange={(e) => setFormData({ ...formData, shelves: e.target.value })}
                placeholder="Ex: A-1, A-2, B-1, C-12"
              />
              <p className="text-xs text-muted-foreground">Définissez les étagères disponibles pour suggestion rapide.</p>
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

      {/* Product Assignment & QR Modal */}
      <Dialog open={assignmentModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setAssignmentModal(prev => ({ ...prev, isOpen: false }));
          setQrData(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validation du placement</DialogTitle>
          </DialogHeader>

          {!qrData ? (
            <form onSubmit={handleAssignmentConfirm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={assignmentData.zoneId}
                  onValueChange={(value) => setAssignmentData({ ...assignmentData, zoneId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une zone (Optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const w = warehouses.find(w => w.id === assignmentModal.warehouseId);
                      if (w?.zones && w.zones.length > 0) {
                        return w.zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.name}
                          </SelectItem>
                        ));
                      }
                      return <SelectItem value="none" disabled>Aucune zone disponible</SelectItem>;
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf">Étagère / Rayon</Label>
                {warehouses.find(w => w.id === assignmentModal.warehouseId)?.shelves?.trim() ? (
                  <Select
                    value={assignmentData.shelf}
                    onValueChange={(value) => setAssignmentData({ ...assignmentData, shelf: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une étagère" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const w = warehouses.find(w => w.id === assignmentModal.warehouseId);
                        const shelfList = w?.shelves?.split(',').map(s => s.trim()).filter(s => s);

                        if (shelfList && shelfList.length > 0) {
                          return shelfList.map((shelf, idx) => (
                            <SelectItem key={idx} value={shelf}>{shelf}</SelectItem>
                          ));
                        }
                        return <SelectItem value="none" disabled>Aucune étagère disponible</SelectItem>;
                      })()}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="shelf"
                    placeholder="Ex: A-12"
                    value={assignmentData.shelf}
                    onChange={(e) => setAssignmentData({ ...assignmentData, shelf: e.target.value })}
                    required
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration">Date d'expiration</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={assignmentData.expirationDate}
                  onChange={(e) => setAssignmentData({ ...assignmentData, expirationDate: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignmentModal(prev => ({ ...prev, isOpen: false }))}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer et générer QR</Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div id="qr-code-print" className="p-4 border rounded bg-white">
                <QRCode value={qrData} size={200} />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Ce QR code contient les informations du produit et sa localisation.
              </p>
              <div className="flex gap-2 w-full">
                <Button className="w-full gap-2" variant="outline" onClick={() => {
                  const printContent = document.getElementById('qr-code-print');
                  const win = window.open('', '', 'height=500, width=500');
                  if (win && printContent) {
                    win.document.write('<html><body>');
                    win.document.write(printContent.innerHTML);
                    win.document.write('</body></html>');
                    win.document.close();
                    win.print();
                  }
                }}>
                  <Printer className="h-4 w-4" /> Imprimer
                </Button>
                <Button className="w-full" onClick={() => setAssignmentModal(prev => ({ ...prev, isOpen: false }))}>
                  Terminer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

