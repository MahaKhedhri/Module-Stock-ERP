import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
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
import { Archive as ArchiveIcon } from 'lucide-react';

export default function Archive() {
  const { purchaseOrders, suppliers, loading } = useStock();

  // Filter only closed purchase orders
  const archivedOrders = purchaseOrders.filter(order => order.status === 'closed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'closed':
        return <Badge variant="outline">Clos</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArchiveIcon className="h-8 w-8" />
            Archives
          </h2>
          <p className="text-muted-foreground">Commandes d'achat clôturées</p>
        </div>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedOrders.map((order) => {
              const supplier = suppliers.find(s => s.id === order.supplierId);
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">PO-{order.id}</TableCell>
                  <TableCell>{supplier?.name}</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{order.lines.length} ligne(s)</TableCell>
                  <TableCell className="text-right font-semibold">{order.total.toFixed(2)} €</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                </TableRow>
              );
            })}
            {archivedOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <ArchiveIcon className="h-12 w-12 text-muted-foreground" />
                    <p className="font-medium text-lg">Aucune commande archivée</p>
                    <p className="text-sm">Les commandes clôturées apparaîtront ici</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

