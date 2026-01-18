import { useState, useMemo } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle, Search, FilterX, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StockMovements() {
    const { stockMovements, products, loading, error } = useStock();

    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterProduct, setFilterProduct] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Derived state: Filtered Movements
    const filteredMovements = useMemo(() => {
        return stockMovements.filter(movement => {
            const product = products.find(p => p.id === movement.productId);
            const productName = product?.name.toLowerCase() || '';
            const reference = (movement.reference || '').toLowerCase();
            const note = (movement.note || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            // Search filter
            const matchesSearch =
                productName.includes(searchLower) ||
                reference.includes(searchLower) ||
                note.includes(searchLower);

            // Type filter
            const matchesType = filterType === 'all' || movement.type === filterType;

            // Product filter
            const matchesProduct = filterProduct === 'all' || movement.productId === filterProduct;

            // Date filter
            let matchesDate = true;
            if (startDate) {
                matchesDate = matchesDate && new Date(movement.date) >= new Date(startDate);
            }
            if (endDate) {
                matchesDate = matchesDate && new Date(movement.date) <= new Date(endDate);
            }

            return matchesSearch && matchesType && matchesProduct && matchesDate;
        });
    }, [stockMovements, products, searchTerm, filterType, filterProduct, startDate, endDate]);

    // Derived state: Statistics
    const stats = useMemo(() => {
        return filteredMovements.reduce((acc, curr) => {
            acc.totalMovements += 1;
            if (curr.type === 'in') {
                acc.totalIn += curr.quantity;
            } else if (curr.type === 'out') {
                acc.totalOut += curr.quantity;
            }
            return acc;
        }, { totalMovements: 0, totalIn: 0, totalOut: 0 });
    }, [filteredMovements]);

    // Derived state: Chart Data
    const chartData = useMemo(() => {
        const dataMap = new Map<string, { date: string; in: number; out: number }>();

        // Sort by date
        const sorted = [...filteredMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted.forEach(m => {
            const dateStr = new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            if (!dataMap.has(dateStr)) {
                dataMap.set(dateStr, { date: dateStr, in: 0, out: 0 });
            }
            const entry = dataMap.get(dateStr)!;
            if (m.type === 'in') entry.in += m.quantity;
            if (m.type === 'out') entry.out += m.quantity;
        });

        // Take last 14 days or all if less
        return Array.from(dataMap.values()).slice(-14);
    }, [filteredMovements]);

    // ... (getTypeIcon and getTypeBadge functions remain the same)
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'in': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
            case 'out': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
            case 'adjustment': return <RefreshCw className="h-4 w-4 text-blue-500" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'in': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Entrée</Badge>;
            case 'out': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Sortie</Badge>;
            case 'adjustment': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Ajustement</Badge>;
            default: return <Badge variant="outline">{type}</Badge>;
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setFilterProduct('all');
        setStartDate('');
        setEndDate('');
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
            <div className="p-6">
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                    <p className="font-semibold">Erreur lors du chargement</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mouvements de Stock</h2>
                <p className="text-muted-foreground">Journal complet des entrées et sorties</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Mouvements</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMovements}</div>
                        <p className="text-xs text-muted-foreground">Sur la période sélectionnée</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entrées</CardTitle>
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{stats.totalIn}</div>
                        <p className="text-xs text-muted-foreground">Unités reçues</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sorties</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-{stats.totalOut}</div>
                        <p className="text-xs text-muted-foreground">Unités sorties</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Flux de Stock (14 derniers jours actifs)</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="in" name="Entrées" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="out" name="Sorties" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Filters */}
            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Recherche</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Réf, Note, Produit..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type de mouvement</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                <SelectItem value="in">Entrée</SelectItem>
                                <SelectItem value="out">Sortie</SelectItem>
                                <SelectItem value="adjustment">Ajustement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Produit</label>
                        <Select value={filterProduct} onValueChange={setFilterProduct}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les produits" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="all">Tous les produits</SelectItem>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Période</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="relative flex-1">
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" onClick={resetFilters} className="w-full">
                        <FilterX className="mr-2 h-4 w-4" />
                        Réinitialiser
                    </Button>
                </div>
            </Card>

            {/* Data Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Date & Heure</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead className="text-center">Quantité</TableHead>
                            <TableHead>Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMovements.length > 0 ? (
                            filteredMovements.map((movement) => {
                                const product = products.find(p => p.id === movement.productId);
                                return (
                                    <TableRow key={movement.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(movement.type)}
                                                {getTypeBadge(movement.type)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{new Date(movement.date).toLocaleDateString('fr-FR')}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {/* If timestamp exists, show it, otherwise just date */}
                                                    {/* Usually date is ISO string, so we might have time */}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{product?.name || 'Produit inconnu'}</span>
                                                <span className="text-xs text-muted-foreground">{product?.sku || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {movement.reference || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`font-bold ${movement.type === 'in' ? 'text-green-600' :
                                                movement.type === 'out' ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={movement.note || ''}>
                                            {movement.note || '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 text-muted-foreground/50" />
                                        <p>Aucun mouvement trouvé avec ces filtres</p>
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
