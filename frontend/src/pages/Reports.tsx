import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { reportsApi } from '@/lib/api';
import { toast } from 'sonner';
import { TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';

interface DashboardStats {
    totalStockValue: number;
    totalProducts: number;
    lowStockCount: number;
}

interface StockValuationItem {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    purchase_price: number;
    total_value: number;
    category_name?: string;
}

export default function Reports() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [valuation, setValuation] = useState<StockValuationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsData, valuationData] = await Promise.all([
                    reportsApi.getDashboardStats(),
                    reportsApi.getStockValuation(),
                ]);
                setStats(statsData);
                setValuation(valuationData);
            } catch (err: any) {
                console.error('Error fetching reports:', err);
                toast.error('Erreur lors du chargement des rapports');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Génération des rapports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Rapports & Analyses</h2>
                <p className="text-muted-foreground">Vue d'ensemble de la performance et de la valeur du stock</p>
            </div>

            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valeur Totale du Stock</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalStockValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                            <p className="text-xs text-muted-foreground">Calculée sur le prix d'achat</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nombre de Références</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProducts}</div>
                            <p className="text-xs text-muted-foreground">Produits uniques catalogués</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Alertes Stock Bas</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.lowStockCount}</div>
                            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Valorisation du Stock par Produit
                    </CardTitle>
                </CardHeader>
                <div className="max-h-[600px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-right">Quantité</TableHead>
                                <TableHead className="text-right">Prix Unitaire (Achat)</TableHead>
                                <TableHead className="text-right">Valeur Totale</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {valuation.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.sku}</div>
                                    </TableCell>
                                    <TableCell>{item.category_name || '-'}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.purchase_price} €</TableCell>
                                    <TableCell className="text-right font-bold">{item.total_value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
