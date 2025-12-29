import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
import { PurchaseOrderModal } from '@/components/modals/PurchaseOrderModal';
import { toast } from 'sonner';

export default function PurchaseOrders() {
  const { purchaseOrders, suppliers, products, updatePurchaseOrder, receivePurchaseOrder, loading, error } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'sent':
        return <Badge variant="default">Envoyé</Badge>;
      case 'received':
        return <Badge className="bg-success text-success-foreground">Réceptionné</Badge>;
      case 'closed':
        return <Badge variant="outline">Clos</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleReceive = async (orderId: string) => {
    if (confirm('Confirmer la réception de cette commande ? Le stock sera mis à jour automatiquement.')) {
      try {
        await receivePurchaseOrder(orderId);
        toast.success('Commande réceptionnée et stock mis à jour');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la réception');
      }
    }
  };

  const handleChangeStatus = async (orderId: string, newStatus: 'draft' | 'sent' | 'received' | 'closed') => {
    try {
      await updatePurchaseOrder(orderId, { status: newStatus });
      toast.success('Statut mis à jour');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Commandes d'Achat</h2>
            <p className="text-muted-foreground">Suivez vos commandes fournisseurs</p>
          </div>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-semibold">Error loading purchase orders</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Commandes d'Achat</h2>
          <p className="text-muted-foreground">Suivez vos commandes fournisseurs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.map((order) => {
              const supplier = suppliers.find(s => s.id === order.supplierId);
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">PO-{order.id}</TableCell>
                  <TableCell>{supplier?.name}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{order.lines.length} ligne(s)</TableCell>
                  <TableCell className="text-right font-semibold">{order.total.toFixed(2)} €</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    {order.status === 'sent' && (
                      <Button size="sm" onClick={() => handleReceive(order.id)} className="mr-2">
                        Réceptionner
                      </Button>
                    )}
                    {order.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => handleChangeStatus(order.id, 'sent')}>
                        Marquer envoyé
                      </Button>
                    )}
                    {order.status === 'received' && (
                      <Button size="sm" variant="outline" onClick={() => handleChangeStatus(order.id, 'closed')}>
                        Clôturer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <PurchaseOrderModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
