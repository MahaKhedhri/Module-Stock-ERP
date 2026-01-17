import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { alertsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useStock } from '@/contexts/StockContext';
import { PurchaseOrderModal } from '@/components/modals/PurchaseOrderModal';

interface AlertProduct {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    min_stock: number;
    category_name?: string;
    supplier_name?: string;
}

export default function Alerts() {
    const { products: allProducts, suppliers, addPurchaseOrder } = useStock();
    const [products, setProducts] = useState<AlertProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const data = await alertsApi.getLowStock();
            setProducts(data);
        } catch (err: any) {
            console.error('Error fetching alerts:', err);
            setError(err.message || 'Impossible de charger les alertes');
            toast.error('Erreur lors du chargement des alertes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Recherche des produits en alerte...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8" />
                        Alertes de Stock
                    </h2>
                    <p className="text-muted-foreground">Produits dont la quantité est critique (inférieure au stock minimum)</p>
                </div>
                <Button onClick={fetchAlerts} variant="outline" className="gap-2">
                    Actualiser
                </Button>
            </div>

            <Card className="border-destructive/20">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead className="text-center">Stock Actuel</TableHead>
                            <TableHead className="text-center">Stock Minimum</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category_name || '-'}</TableCell>
                                <TableCell>{product.supplier_name || '-'}</TableCell>
                                <TableCell className="text-center font-bold text-destructive text-lg">
                                    {product.quantity}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                    {product.min_stock}
                                </TableCell>
                                <TableCell>
                                    {product.quantity === 0 ? (
                                        <Badge variant="destructive">Rupture</Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-destructive text-destructive">Faible</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        size="sm" 
                                        variant="default" 
                                        className="gap-2"
                                        onClick={() => {
                                            setSelectedProductId(product.id);
                                            setIsOrderModalOpen(true);
                                        }}
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        Commander
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-10 w-10 text-green-500 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        </div>
                                        <p className="font-medium text-lg">Tout est en ordre !</p>
                                        <p className="text-sm">Aucun produit en dessous du stock minimum.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <PurchaseOrderModal 
                open={isOrderModalOpen} 
                onClose={() => {
                    setIsOrderModalOpen(false);
                    setSelectedProductId(null);
                }}
                preSelectedProductId={selectedProductId}
            />
        </div>
    );
}
