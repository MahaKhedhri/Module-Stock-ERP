import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  unit: string;
  image?: string;
  supplierId: string;
  minStock: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface PurchaseOrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  date: string;
  status: 'draft' | 'sent' | 'received' | 'closed';
  lines: PurchaseOrderLine[];
  total: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  date: string;
  reference?: string;
  note?: string;
}

interface StockContextType {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => void;
  receivePurchaseOrder: (id: string) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => void;
  adjustStock: (productId: string, quantity: number, note?: string) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

// Mock data initial
const initialCategories: Category[] = [
  { id: '1', name: 'Électronique', description: 'Appareils électroniques' },
  { id: '2', name: 'Mobilier', description: 'Meubles de bureau' },
  { id: '3', name: 'Fournitures', description: 'Fournitures de bureau' },
];

const initialSuppliers: Supplier[] = [
  { id: '1', name: 'TechSupply Co.', email: 'contact@techsupply.com', phone: '01 23 45 67 89', address: '123 Avenue de la Tech, 75001 Paris' },
  { id: '2', name: 'FurniPro', email: 'sales@furnipro.com', phone: '01 98 76 54 32', address: '45 Rue du Mobilier, 69001 Lyon' },
  { id: '3', name: 'Office Plus', email: 'info@officeplus.com', phone: '01 11 22 33 44', address: '78 Boulevard des Fournitures, 13001 Marseille' },
];

const initialProducts: Product[] = [
  { id: '1', name: 'Ordinateur Portable HP', sku: 'HP-LAP-001', categoryId: '1', purchasePrice: 650, salePrice: 899, quantity: 15, unit: 'unité', supplierId: '1', minStock: 5 },
  { id: '2', name: 'Clavier Mécanique', sku: 'KEY-MEC-002', categoryId: '1', purchasePrice: 45, salePrice: 79, quantity: 32, unit: 'unité', supplierId: '1', minStock: 10 },
  { id: '3', name: 'Bureau Réglable', sku: 'DESK-ADJ-003', categoryId: '2', purchasePrice: 280, salePrice: 450, quantity: 8, unit: 'unité', supplierId: '2', minStock: 3 },
  { id: '4', name: 'Chaise Ergonomique', sku: 'CHAIR-ERG-004', categoryId: '2', purchasePrice: 150, salePrice: 249, quantity: 12, unit: 'unité', supplierId: '2', minStock: 5 },
  { id: '5', name: 'Ramette Papier A4', sku: 'PAP-A4-005', categoryId: '3', purchasePrice: 3.5, salePrice: 6.99, quantity: 120, unit: 'ramette', supplierId: '3', minStock: 50 },
  { id: '6', name: 'Stylos Bille (Boîte)', sku: 'PEN-BOX-006', categoryId: '3', purchasePrice: 8, salePrice: 14.99, quantity: 45, unit: 'boîte', supplierId: '3', minStock: 20 },
  { id: '7', name: 'Écran 24 pouces', sku: 'MON-24-007', categoryId: '1', purchasePrice: 120, salePrice: 199, quantity: 3, unit: 'unité', supplierId: '1', minStock: 5 },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    supplierId: '1',
    date: '2025-01-15',
    status: 'received',
    lines: [
      { productId: '1', quantity: 10, unitPrice: 650 },
      { productId: '2', quantity: 20, unitPrice: 45 },
    ],
    total: 7400,
  },
  {
    id: '2',
    supplierId: '2',
    date: '2025-01-18',
    status: 'sent',
    lines: [
      { productId: '3', quantity: 5, unitPrice: 280 },
    ],
    total: 1400,
  },
];

const initialStockMovements: StockMovement[] = [
  { id: '1', productId: '1', type: 'in', quantity: 10, date: '2025-01-15', reference: 'PO-1', note: 'Réception commande' },
  { id: '2', productId: '2', type: 'in', quantity: 20, date: '2025-01-15', reference: 'PO-1', note: 'Réception commande' },
  { id: '3', productId: '5', type: 'out', quantity: 30, date: '2025-01-16', note: 'Vente client XYZ' },
  { id: '4', productId: '7', type: 'adjustment', quantity: -2, date: '2025-01-17', note: 'Correction inventaire' },
];

export const StockProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...product } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Date.now().toString() };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: string, category: Partial<Category>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...category } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Date.now().toString() };
    setSuppliers([...suppliers, newSupplier]);
  };

  const updateSupplier = (id: string, supplier: Partial<Supplier>) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...supplier } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const addPurchaseOrder = (order: Omit<PurchaseOrder, 'id'>) => {
    const newOrder = { ...order, id: Date.now().toString() };
    setPurchaseOrders([...purchaseOrders, newOrder]);
  };

  const updatePurchaseOrder = (id: string, order: Partial<PurchaseOrder>) => {
    setPurchaseOrders(purchaseOrders.map(po => po.id === id ? { ...po, ...order } : po));
  };

  const receivePurchaseOrder = (id: string) => {
    const order = purchaseOrders.find(po => po.id === id);
    if (!order) return;

    // Mise à jour du stock
    order.lines.forEach(line => {
      const product = products.find(p => p.id === line.productId);
      if (product) {
        updateProduct(product.id, { quantity: product.quantity + line.quantity });
        addStockMovement({
          productId: line.productId,
          type: 'in',
          quantity: line.quantity,
          date: new Date().toISOString().split('T')[0],
          reference: `PO-${id}`,
          note: 'Réception commande d\'achat',
        });
      }
    });

    updatePurchaseOrder(id, { status: 'received' });
  };

  const addStockMovement = (movement: Omit<StockMovement, 'id'>) => {
    const newMovement = { ...movement, id: Date.now().toString() };
    setStockMovements([...stockMovements, newMovement]);
  };

  const adjustStock = (productId: string, quantity: number, note?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const adjustment = quantity - product.quantity;
    updateProduct(productId, { quantity });
    addStockMovement({
      productId,
      type: 'adjustment',
      quantity: adjustment,
      date: new Date().toISOString().split('T')[0],
      note: note || 'Ajustement manuel',
    });
  };

  return (
    <StockContext.Provider
      value={{
        products,
        categories,
        suppliers,
        purchaseOrders,
        stockMovements,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchaseOrder,
        updatePurchaseOrder,
        receivePurchaseOrder,
        addStockMovement,
        adjustStock,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within StockProvider');
  }
  return context;
};
