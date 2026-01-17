import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Send, FileText, Check } from 'lucide-react';
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

export default function PurchaseOrders() {
  const { purchaseOrders, suppliers, products, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder, loading, error } = useStock();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Filter out closed orders (they appear in Archive)
  const activeOrders = purchaseOrders.filter(order => order.status !== 'closed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'sent':
        return <Badge variant="default">Envoyé</Badge>;
      case 'received':
        return <Badge className="bg-green-500 text-white">Réceptionné</Badge>;
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

  const handleDelete = async () => {
    if (deletingOrderId) {
      try {
        await deletePurchaseOrder(deletingOrderId);
        toast.success('Commande supprimée avec succès');
        setDeletingOrderId(null);
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (orderId: string) => {
    setEditingOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleGeneratePDF = (orderId: string) => {
    // TODO: Implement PDF generation
    toast.info('Génération du devis PDF en cours de développement');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des commandes...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Commandes d'Achat</h2>
          <p className="text-muted-foreground">Suivez vos commandes fournisseurs</p>
        </div>
        <Button onClick={() => {
          setEditingOrderId(null);
          setIsModalOpen(true);
        }} className="gap-2">
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
            {activeOrders.map((order) => {
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
                    <div className="flex items-center justify-end gap-2">
                      {/* Brouillon: Edit, Delete, Send */}
                      {order.status === 'draft' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(order.id)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Modifier
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setDeletingOrderId(order.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => handleChangeStatus(order.id, 'sent')}
                            className="gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Envoyer
                          </Button>
                        </>
                      )}
                      
                      {/* Sent: Receive, PDF */}
                      {order.status === 'sent' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => handleReceive(order.id)}
                            className="gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Réceptionner
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleGeneratePDF(order.id)}
                            className="gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Devis PDF
                          </Button>
                        </>
                      )}
                      
                      {/* Received: Close, PDF */}
                      {order.status === 'received' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleChangeStatus(order.id, 'closed')}
                            className="gap-1"
                          >
                            Clôturer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleGeneratePDF(order.id)}
                            className="gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Devis PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {activeOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Aucune commande d'achat active. Les commandes clôturées sont dans les Archives.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <PurchaseOrderModal 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrderId(null);
        }}
        orderId={editingOrderId}
      />

      <AlertDialog open={deletingOrderId !== null} onOpenChange={(open) => !open && setDeletingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la commande</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
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
    </div>
  );
}
