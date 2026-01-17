import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { categoriesApi, suppliersApi, productsApi, purchaseOrdersApi, exitOrdersApi, stockMovementsApi } from '@/lib/api';

export interface ProductSupplier {
  id: string;
  supplierId: string;
  supplierName?: string;
  purchasePrice: number;
  salePrice: number;
}

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
  supplierId: string | null;
  minStock: number;
  suppliers?: ProductSupplier[];
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

export interface ExitOrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface ExitOrder {
  id: string;
  customerName?: string;
  date: string;
  status: 'draft' | 'confirmed' | 'closed';
  lines: ExitOrderLine[];
  total: number;
  note?: string;
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
  exitOrders: ExitOrder[];
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => Promise<void>;
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => Promise<void>;
  receivePurchaseOrder: (id: string) => Promise<void>;
  addExitOrder: (order: Omit<ExitOrder, 'id'>) => Promise<void>;
  updateExitOrder: (id: string, order: Partial<ExitOrder>) => Promise<void>;
  confirmExitOrder: (id: string) => Promise<void>;
  closeExitOrder: (id: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => Promise<void>;
  adjustStock: (productId: string, quantity: number, note?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [exitOrders, setExitOrders] = useState<ExitOrder[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, suppliersData, productsData, ordersData, exitOrdersData, movementsData] = await Promise.all([
        categoriesApi.getAll(),
        suppliersApi.getAll(),
        productsApi.getAll(),
        purchaseOrdersApi.getAll(),
        exitOrdersApi.getAll(),
        stockMovementsApi.getAll(),
      ]);

      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setPurchaseOrders(ordersData);
      setExitOrders(exitOrdersData);
      setStockMovements(movementsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = await productsApi.create(product);
      // Only update state if API call succeeds
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (err: any) {
      console.error('Error adding product:', err);
      // Re-throw error so calling code can handle it
      throw err;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      const updatedProduct = await productsApi.update(id, product);
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
    } catch (err: any) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productsApi.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoriesApi.create(category);
      // Only update state if API call succeeds
      setCategories([...categories, newCategory]);
      return newCategory;
    } catch (err: any) {
      console.error('Error adding category:', err);
      // Re-throw error so calling code can handle it
      throw err;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
      const updatedCategory = await categoriesApi.update(id, category);
      setCategories(categories.map(c => c.id === id ? updatedCategory : c));
    } catch (err: any) {
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const newSupplier = await suppliersApi.create(supplier);
      // Only update state if API call succeeds
      setSuppliers([...suppliers, newSupplier]);
      return newSupplier;
    } catch (err: any) {
      console.error('Error adding supplier:', err);
      // Re-throw error so calling code can handle it
      throw err;
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      const updatedSupplier = await suppliersApi.update(id, supplier);
      setSuppliers(suppliers.map(s => s.id === id ? updatedSupplier : s));
    } catch (err: any) {
      console.error('Error updating supplier:', err);
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await suppliersApi.delete(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      throw err;
    }
  };

  const addPurchaseOrder = async (order: Omit<PurchaseOrder, 'id'>) => {
    try {
      const newOrder = await purchaseOrdersApi.create(order);
      setPurchaseOrders([...purchaseOrders, newOrder]);
    } catch (err: any) {
      console.error('Error adding purchase order:', err);
      throw err;
    }
  };

  const updatePurchaseOrder = async (id: string, order: Partial<PurchaseOrder>) => {
    try {
      const updatedOrder = await purchaseOrdersApi.update(id, order);
      setPurchaseOrders(purchaseOrders.map(po => po.id === id ? updatedOrder : po));
    } catch (err: any) {
      console.error('Error updating purchase order:', err);
      throw err;
    }
  };

  const receivePurchaseOrder = async (id: string) => {
    try {
      const updatedOrder = await purchaseOrdersApi.receive(id);
      setPurchaseOrders(purchaseOrders.map(po => po.id === id ? updatedOrder : po));
      // Reload products to get updated quantities
      const productsData = await productsApi.getAll();
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error receiving purchase order:', err);
      throw err;
    }
  };

  const addExitOrder = async (order: Omit<ExitOrder, 'id'>) => {
    try {
      const newOrder = await exitOrdersApi.create(order);
      setExitOrders([...exitOrders, newOrder]);
    } catch (err: any) {
      console.error('Error adding exit order:', err);
      throw err;
    }
  };

  const updateExitOrder = async (id: string, order: Partial<ExitOrder>) => {
    try {
      const updatedOrder = await exitOrdersApi.update(id, order);
      setExitOrders(exitOrders.map(eo => eo.id === id ? updatedOrder : eo));
    } catch (err: any) {
      console.error('Error updating exit order:', err);
      throw err;
    }
  };

  const confirmExitOrder = async (id: string) => {
    try {
      const updatedOrder = await exitOrdersApi.confirm(id);
      setExitOrders(exitOrders.map(eo => eo.id === id ? updatedOrder : eo));
      // Reload products to get updated quantities
      const productsData = await productsApi.getAll();
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error confirming exit order:', err);
      throw err;
    }
  };

  const closeExitOrder = async (id: string) => {
    try {
      const updatedOrder = await exitOrdersApi.close(id);
      setExitOrders(exitOrders.map(eo => eo.id === id ? updatedOrder : eo));
    } catch (err: any) {
      console.error('Error closing exit order:', err);
      throw err;
    }
  };

  const addStockMovement = async (movement: Omit<StockMovement, 'id'>) => {
    try {
      const newMovement = await stockMovementsApi.create(movement);
      setStockMovements([...stockMovements, newMovement]);
      // Reload products to get updated quantities
      const productsData = await productsApi.getAll();
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error adding stock movement:', err);
      throw err;
    }
  };

  const adjustStock = async (productId: string, quantity: number, note?: string) => {
    try {
      await productsApi.adjustStock(productId, quantity, note);
      // Reload products to get updated quantity
      const productsData = await productsApi.getAll();
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      throw err;
    }
  };

  return (
    <StockContext.Provider
      value={{
        products,
        categories,
        suppliers,
        purchaseOrders,
        exitOrders,
        stockMovements,
        loading,
        error,
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
        addExitOrder,
        updateExitOrder,
        confirmExitOrder,
        closeExitOrder,
        addStockMovement,
        adjustStock,
        refresh: loadData,
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
