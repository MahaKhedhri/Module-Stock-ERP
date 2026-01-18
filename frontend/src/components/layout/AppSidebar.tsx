import { LayoutDashboard, Package, FolderKanban, Users, ShoppingCart, LogOut, Warehouse, TrendingUp, AlertTriangle, Archive, BarChart3 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Tableau de bord', url: '/', icon: LayoutDashboard },
  { title: 'Fournisseurs', url: '/suppliers', icon: Users },
  { title: 'Catégories', url: '/categories', icon: FolderKanban },
  { title: 'Produits', url: '/products', icon: Package },
  { title: 'Commandes d\'achat', url: '/purchase-orders', icon: ShoppingCart },
  { title: 'Commandes de sortie', url: '/exit-orders', icon: LogOut },
  { title: 'Entrepôts', url: '/warehouses', icon: Warehouse },
  { title: 'Mouvements', url: '/stock-movements', icon: TrendingUp },
  { title: 'Alertes', url: '/alerts', icon: AlertTriangle },
  { title: 'Archives', url: '/archive', icon: Archive },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-semibold text-base px-4 py-6">
            {!isCollapsed && 'StockERP'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
