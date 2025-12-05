import { useEffect, useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  supplierId?: string | null;
}

export function SupplierModal({ open, onClose, supplierId }: SupplierModalProps) {
  const { suppliers, addSupplier, updateSupplier } = useStock();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (supplierId) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        setFormData({
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
        });
      }
    } else {
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
  }, [supplierId, suppliers, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (supplierId) {
      updateSupplier(supplierId, formData);
      toast.success('Fournisseur modifié avec succès');
    } else {
      addSupplier(formData);
      toast.success('Fournisseur ajouté avec succès');
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplierId ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du fournisseur *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {supplierId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
