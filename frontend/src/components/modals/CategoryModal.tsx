import { useEffect, useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  categoryId?: string | null;
}

export function CategoryModal({ open, onClose, categoryId }: CategoryModalProps) {
  const { categories, addCategory, updateCategory } = useStock();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setFormData({
          name: category.name,
          description: category.description || '',
        });
      }
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [categoryId, categories, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (categoryId) {
      updateCategory(categoryId, formData);
      toast.success('Catégorie modifiée avec succès');
    } else {
      addCategory(formData);
      toast.success('Catégorie ajoutée avec succès');
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoryId ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {categoryId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
