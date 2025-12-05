import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductModal } from '@/components/modals/ProductModal';

export default function Products() {
  const { products, categories, suppliers, deleteProduct } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (productId: string) => {
    setEditingProduct(productId);
    setIsModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(productId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produits</h2>
          <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Prix Achat</TableHead>
              <TableHead className="text-right">Prix Vente</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.categoryId);
              const supplier = suppliers.find(s => s.id === product.supplierId);
              const isLowStock = product.quantity <= product.minStock;

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>{category?.name}</TableCell>
                  <TableCell>{supplier?.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isLowStock && <AlertCircle className="h-4 w-4 text-warning" />}
                      <span className={isLowStock ? 'text-warning font-semibold' : ''}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.purchasePrice.toFixed(2)} €</TableCell>
                  <TableCell className="text-right">{product.salePrice.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge variant={isLowStock ? 'destructive' : 'default'}>
                      {isLowStock ? 'Stock faible' : 'En stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <ProductModal
        open={isModalOpen}
        onClose={handleCloseModal}
        productId={editingProduct}
      />
    </div>
  );
}
