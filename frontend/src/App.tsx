import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StockProvider } from "./contexts/StockContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/categories";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import ExitOrders from "./pages/ExitOrders";
import Warehouses from "./pages/Warehouses";
import StockMovements from "./pages/StockMovements";
import Alerts from "./pages/Alerts";
import Archive from "./pages/Archive";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <StockProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/exit-orders" element={<ExitOrders />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/stock-movements" element={<StockMovements />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </StockProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;