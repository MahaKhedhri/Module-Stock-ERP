import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { TrendingUp, Package, AlertTriangle, DollarSign, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

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

interface CategoryDist {
    name: string;
    count: number;
    value: number;
}

interface TopMover {
    name: string;
    total_out: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Reports() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [valuation, setValuation] = useState<StockValuationItem[]>([]);
    const [categoryDist, setCategoryDist] = useState<CategoryDist[]>([]);
    const [topMovers, setTopMovers] = useState<TopMover[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Load essential data
                const [statsData, valuationData] = await Promise.all([
                    reportsApi.getDashboardStats(),
                    reportsApi.getStockValuation(),
                ]);
                setStats(statsData);
                setValuation(valuationData);

                // Load enhancements (fail gracefully)
                try {
                    const catData = await reportsApi.getCategoryDistribution();
                    setCategoryDist(catData);
                } catch (e) {
                    console.warn('Failed to load category distribution', e);
                }

                try {
                    const moversData = await reportsApi.getTopMovers();
                    setTopMovers(moversData);
                } catch (e) {
                    console.warn('Failed to load top movers', e);
                }

            } catch (err: any) {
                console.error('Error fetching reports:', err);
                toast.error('Erreur lors du chargement des rapports principaux');
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

    // Prepare data for Category Pie Chart (Value based)
    const pieData = categoryDist.map(c => ({
        name: c.name,
        value: Number(c.value || 0)
    })).filter(d => d.value > 0);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Rapports & Analyses</h2>
                <p className="text-muted-foreground">Vue d'ensemble de la performance et de la valeur du stock</p>
            </div>

            {/* Key Metrics Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valeur Totale du Stock</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Number(stats.totalStockValue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                            <p className="text-xs text-muted-foreground">Coût d'acquisition total</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Références Actives</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProducts}</div>
                            <p className="text-xs text-muted-foreground">Produits uniques en catalogue</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Critique</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.lowStockCount}</div>
                            <p className="text-xs text-muted-foreground">Produits sous le seuil minimum</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Top Movers Bar Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle>Top 5 Sorties (30 jours)</CardTitle>
                        </div>
                        <CardDescription>Produits les plus mouvementés (sorties)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {topMovers.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topMovers} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="total_out" name="Quantité sortie" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Pas de données récentes
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Valeur par Catégorie</CardTitle>
                        </div>
                        <CardDescription>Répartition de la valeur financière du stock</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Pas de données disponibles
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Détail de la Valorisation
                    </CardTitle>
                    <CardDescription>Liste complète des produits et leur valeur actuelle</CardDescription>
                </CardHeader>
                <div className="max-h-[600px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-right">Quantité</TableHead>
                                <TableHead className="text-right">P.U. Moyen</TableHead>
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
                                    <TableCell className="text-right">
                                        <span className={`font-mono ${item.quantity === 0 ? 'text-muted-foreground' : ''}`}>
                                            {item.quantity}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                        {Number(item.purchase_price || 0).toFixed(2)} €
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono">
                                        {Number(item.total_value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
