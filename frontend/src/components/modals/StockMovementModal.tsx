import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface StockMovementModalProps {
    open: boolean;
    onClose: () => void;
    defaultType?: 'in' | 'out' | 'adjustment';
}

export function StockMovementModal({ open, onClose, defaultType = 'out' }: StockMovementModalProps) {
    const { products, addStockMovement } = useStock();
    const [formData, setFormData] = useState({
        productId: '',
        type: defaultType,
        quantity: '',
        reference: '',
        note: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await addStockMovement({
                productId: formData.productId,
                type: formData.type as 'in' | 'out' | 'adjustment',
                quantity: parseInt(formData.quantity) || 0,
                date: new Date().toISOString(),
                reference: formData.reference,
                note: formData.note,
            });
            toast.success('Mouvement de stock enregistré avec succès');
            onClose();
            setFormData({
                productId: '',
                type: defaultType,
                quantity: '',
                reference: '',
                note: '',
            });
        } catch (error: any) {
            console.error('Error adding stock movement:', error);
            toast.error(error.message || 'Erreur lors de l\'enregistrement');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nouveau Mouvement de Stock</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="product">Produit *</Label>
                        <Select
                            value={formData.productId}
                            onValueChange={(value) => setFormData({ ...formData, productId: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un produit" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name} ({product.sku}) - Stock: {product.quantity}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type de mouvement *</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value as 'in' | 'out' | 'adjustment' })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in">Entrée</SelectItem>
                                <SelectItem value="out">Sortie</SelectItem>
                                <SelectItem value="adjustment">Ajustement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantité *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (parseInt(val) >= 1)) {
                                setFormData({ ...formData, quantity: val });
                              }
                            }}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Référence</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Ex: CMD-123"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                            id="note"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Raison du mouvement..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit">
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
