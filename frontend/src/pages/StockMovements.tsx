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
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function StockMovements() {
    const { stockMovements, products, loading, error } = useStock();

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'in':
                return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
            case 'out':
                return <ArrowUpRight className="h-4 w-4 text-red-500" />;
            case 'adjustment':
                return <RefreshCw className="h-4 w-4 text-blue-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'in':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">Entrée</Badge>;
            case 'out':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300">Sortie</Badge>;
            case 'adjustment':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300">Ajustement</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement des mouvements...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Mouvements de Stock</h2>
                <div className="bg-red-50 text-red-900 p-4 rounded-lg dark:bg-red-900/20 dark:text-red-300">
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
                    <h2 className="text-3xl font-bold tracking-tight">Mouvements de Stock</h2>
                    <p className="text-muted-foreground">Historique des entrées et sorties</p>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockMovements.map((movement) => {
                            const product = products.find(p => p.id === movement.productId);
                            return (
                                <TableRow key={movement.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(movement.type)}
                                            {getTypeBadge(movement.type)}
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(movement.date).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell className="font-medium">{product?.name || 'Produit inconnus'}</TableCell>
                                    <TableCell className={movement.type === 'out' ? 'text-red-600' : 'text-green-600'}>
                                        {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                                    </TableCell>
                                    <TableCell>{movement.reference || '-'}</TableCell>
                                    <TableCell>{movement.note || '-'}</TableCell>
                                </TableRow>
                            );
                        })}
                        {stockMovements.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Aucun mouvement enregistré
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
