import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import InventorySetup from "./pages/InventorySetup";
import Recipes from "./pages/Recipes";
import GroceryList from "./pages/GroceryList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const InventoryGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkInventory = () => {
      const inventory = localStorage.getItem("inventory");
      const hasInventory = inventory && JSON.parse(inventory);
      const totalItems =
        (hasInventory?.fridge?.length || 0) +
        (hasInventory?.freezer?.length || 0) +
        (hasInventory?.pantry?.length || 0);

      if (totalItems === 0 && location.pathname === "/home") {
        navigate("/inventory-setup", { replace: true });
      }
      setIsChecking(false);
    };

    checkInventory();
  }, [navigate, location]);

  if (isChecking) return null;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <InventoryGuard>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/home" element={<Home />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory-setup" element={<InventorySetup />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/grocery-list" element={<GroceryList />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </InventoryGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
