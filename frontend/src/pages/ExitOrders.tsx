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
import { ExitOrderModal } from '@/components/modals/ExitOrderModal';
import { toast } from 'sonner';

export default function ExitOrders() {
  const { exitOrders, products, updateExitOrder, confirmExitOrder, closeExitOrder, loading, error } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'confirmed':
        return <Badge className="bg-orange-500 text-white">Confirmé</Badge>;
      case 'closed':
        return <Badge className="bg-green-500 text-white">Clos</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleConfirm = async (orderId: string) => {
    if (confirm('Confirmer cette commande de sortie ? Le stock sera déduit automatiquement.')) {
      try {
        await confirmExitOrder(orderId);
        toast.success('Commande confirmée et stock mis à jour');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la confirmation');
      }
    }
  };

  const handleClose = async (orderId: string) => {
    if (confirm('Clôturer cette commande ?')) {
      try {
        await closeExitOrder(orderId);
        toast.success('Commande clôturée');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la clôture');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des commandes de sortie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Commandes de Sortie</h2>
            <p className="text-muted-foreground">Gérez les sorties de stock</p>
          </div>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-semibold">Erreur lors du chargement</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Commandes de Sortie</h2>
          <p className="text-muted-foreground">Gérez les sorties de stock</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle commande de sortie
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exitOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">EO-{order.id}</TableCell>
                <TableCell>{order.customerName || '-'}</TableCell>
                <TableCell>{new Date(order.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>{order.lines.length} ligne(s)</TableCell>
                <TableCell className="text-right font-semibold">{order.total.toFixed(2)} €</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right">
                  {order.status === 'draft' && (
                    <Button size="sm" onClick={() => handleConfirm(order.id)} className="mr-2">
                      Confirmer
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button size="sm" variant="outline" onClick={() => handleClose(order.id)}>
                      Clôturer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {exitOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Aucune commande de sortie
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ExitOrderModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

