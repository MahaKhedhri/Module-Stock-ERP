import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryModal } from '@/components/modals/CategoryModal';

export default function Categories() {
  const { categories, products, deleteCategory } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleEdit = (categoryId: string) => {
    setEditingCategory(categoryId);
    setIsModalOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    const productsInCategory = products.filter(p => p.categoryId === categoryId).length;
    if (productsInCategory > 0) {
      alert(`Impossible de supprimer cette catégorie car ${productsInCategory} produit(s) y sont associés.`);
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      deleteCategory(categoryId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Catégories</h2>
          <p className="text-muted-foreground">Organisez vos produits par catégorie</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const productCount = products.filter(p => p.categoryId === category.id).length;
          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description || 'Aucune description'}</CardDescription>
                  </div>
                  <Badge variant="secondary">{productCount} produits</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category.id)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
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

      <CategoryModal
        open={isModalOpen}
        onClose={handleCloseModal}
        categoryId={editingCategory}
      />
    </div>
  );
}
