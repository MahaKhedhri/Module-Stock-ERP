import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierModal } from '@/components/modals/SupplierModal';

export default function Suppliers() {
  const { suppliers, products, deleteSupplier } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);

  const handleEdit = (supplierId: string) => {
    setEditingSupplier(supplierId);
    setIsModalOpen(true);
  };

  const handleDelete = (supplierId: string) => {
    const productsFromSupplier = products.filter(p => p.supplierId === supplierId).length;
    if (productsFromSupplier > 0) {
      alert(`Impossible de supprimer ce fournisseur car ${productsFromSupplier} produit(s) y sont associés.`);
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      deleteSupplier(supplierId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">Gérez vos partenaires fournisseurs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un fournisseur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => {
          const productCount = products.filter(p => p.supplierId === supplier.id).length;
          return (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{supplier.name}</CardTitle>
                <CardDescription>{productCount} produit(s) fourni(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{supplier.address}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier.id)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier.id)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SupplierModal
        open={isModalOpen}
        onClose={handleCloseModal}
        supplierId={editingSupplier}
      />
    </div>
  );
}
