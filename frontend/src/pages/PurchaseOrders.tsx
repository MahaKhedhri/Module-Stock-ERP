import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    const supplier = suppliers.find(s => s.id === order.supplierId);
    if (!supplier) {
      toast.error('Fournisseur introuvable pour cette commande');
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('BON DE COMMANDE', 105, 20, { align: 'center' });

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // Left Column: Order Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`N° Commande:`, 20, 40);
    doc.setFont("helvetica", "bold");
    doc.text(`PO-${order.id}`, 60, 40);

    doc.setFont("helvetica", "normal");
    doc.text(`Date:`, 20, 48);
    doc.text(`${new Date(order.date).toLocaleDateString('fr-FR')}`, 60, 48);

    doc.text(`Statut:`, 20, 56);
    doc.text(`${order.status}`, 60, 56);

    // Right Column: Supplier Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Fournisseur', 140, 40);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(supplier.name, 140, 46);
    doc.text(supplier.email, 140, 52);
    if (supplier.phone) doc.text(supplier.phone, 140, 58);

    // Address wrapping
    if (supplier.address) {
      const splitAddress = doc.splitTextToSize(supplier.address, 50);
      doc.text(splitAddress, 140, 64);
    }

    // Table of products
    const tableColumn = ["Produit", "Réf (SKU)", "Qté", "P.U. (HT)", "Total (HT)"];
    const tableRows: any[] = [];

    order.lines.forEach(line => {
      // We might need to fetch product details if not already in line
      // But the context says 'products' are available
      const product = products.find(p => p.id === line.productId);
      const lineData = [
        product?.name || 'Produit inconnu',
        product?.sku || '-',
        line.quantity,
        `${Number(line.unitPrice).toFixed(2)} €`,
        `${(line.quantity * line.unitPrice).toFixed(2)} €`,
      ];
      tableRows.push(lineData);
    });

    autoTable(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      foot: [['', '', '', 'Total Global', `${Number(order.total).toFixed(2)} €`]],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    // Footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Page ' + String(i) + ' / ' + String(pageCount), 190, 285, { align: 'right' });
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 20, 285);
    }

    doc.save(`commande_PO-${order.id}.pdf`);
    toast.success('Devis PDF généré avec succès');
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
