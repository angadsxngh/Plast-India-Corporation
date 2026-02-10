import React from "react";
import { Button } from "@/components/ui/button";
import {
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
  LogOut,
  Bell,
  Settings,
  BarChart3,
  FileText,
  Box,
  Tag,
  List,
  ClipboardList,
  Truck,
  UserPlus,
  ChevronDown,
  Plus,
  Eye,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "../context/UserContext";

function Dashboard() {
  const navigate = useNavigate();
  const { 
    user, 
    categories, 
    products, 
    purchaseOrders, 
    salesOrders,
    refreshCategories,
    refreshProducts,
    refreshPurchaseOrders,
    refreshSalesOrders,
    logout
  } = useUser();

  // Auto-refresh all data when dashboard loads
  useEffect(() => {
    const refreshAllData = async () => {
      try {
        await Promise.all([
          refreshCategories(),
          refreshProducts(),
          refreshPurchaseOrders(),
          refreshSalesOrders()
        ]);
      } catch (error) {
        console.error("Error refreshing dashboard data:", error);
      }
    };

    refreshAllData();
  }, []);

  // Prevent back button from taking user to login page
  useEffect(() => {
    // Add a hash to the URL to create a barrier
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (e) => {
      // Prevent default back navigation
      window.history.pushState(null, '', window.location.pathname);
      
      // If user tries to go back, keep them on dashboard
      if (window.location.pathname !== '/dashboard') {
        navigate('/dashboard', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/logout`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      
      // Clear user state and localStorage regardless of response
      logout();
      
      // Navigate to login page
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear state and navigate
      logout();
      navigate("/login", { replace: true });
    }
  };

  const stats = [
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Categories",
      value: categories.length,
      icon: Tag,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Purchase Orders",
      value: purchaseOrders.length,
      icon: ShoppingCart,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Sales Orders",
      value: salesOrders.length,
      icon: TrendingUp,
      color: "bg-yellow-100 text-yellow-600",
    },
    // {
    //   title: "Dispatch Orders",
    //   value: "₹45.2Cr",
    //   icon: TrendingUp,
    //   color: "bg-yellow-100 text-yellow-600",
    // },
  ];

  const recentActivities = [
    { action: "New order placed", time: "5 minutes ago", type: "order" },
    { action: "Product inventory updated", time: "1 hour ago", type: "product" },
    { action: "New user registered", time: "2 hours ago", type: "user" },
    { action: "Payment received", time: "3 hours ago", type: "payment" },
    { action: "Report generated", time: "5 hours ago", type: "report" },
  ];

  const actionCategories = [
    {
      title: "Inventory",
      icon: Package,
      color: "bg-white hover:bg-gray-50 border-2 border-gray-200",
      iconColor: "text-slate-600",
      items: [
        { name: "Add Product", icon: Plus, href: "/add-product" },
        { name: "Add Category", icon: Tag, href: "/add-category" },
        { name: "View Inventory", icon: Eye, href: "/products" },
        { name: "Pendency", icon: Layers, href: "/pendency" },
      ],
    },
    {
      title: "Orders",
      icon: ShoppingCart,
      color: "bg-white hover:bg-gray-50 border-2 border-gray-200",
      iconColor: "text-slate-600",
      items: [
        { name: "New Purchase Order", icon: Plus, href: "/purchase-order" },
        { name: "New Sales Order", icon: FileText, href: "/sales-order" },
        { name: "View Purchase Orders", icon: List, href: "/view-purchase-orders" },
        { name: "View Sales Orders", icon: ClipboardList, href: "/view-sales-orders" },
      ],
    },
    {
      title: "Parties",
      icon: Users,
      color: "bg-white hover:bg-gray-50 border-2 border-gray-200",
      iconColor: "text-slate-600",
      items: [
        { name: "Add Party", icon: UserPlus, href: "/add-party" },
        { name: "View All Parties", icon: Eye, href: "/view-parties" },
      ],
    },
    {
      title: "Dispatch",
      icon: Truck,
      color: "bg-white hover:bg-gray-50 border-2 border-gray-200",
      iconColor: "text-slate-600",
      items: [
        { name: "Create Dispatch", icon: Plus, href: "/dispatches" },
        { name: "Active Dispatches", icon: Layers, href: "/active-dispatches" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold sm:text-xl">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold sm:text-3xl">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
              Quick Actions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {actionCategories.map((category, index) => (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className={`${category.color} h-auto flex-col gap-3 py-6 shadow-sm transition-all hover:shadow-md`}
                    >
                      <category.icon className={`h-7 w-7 ${category.iconColor}`} />
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-700">{category.title}</span>
                        <ChevronDown className={`h-3.5 w-3.5 ${category.iconColor}`} />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel className="text-slate-700">{category.title} Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {category.items.map((item, itemIndex) => (
                      <DropdownMenuItem
                        key={itemIndex}
                        onClick={() => navigate(item.href)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <item.icon className="mr-2 h-4 w-4 text-slate-600" />
                        <span className="text-slate-700">{item.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>

            {/* Chart Placeholder */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                Sales Overview
              </h2>
              <div className="flex h-64 items-center justify-center rounded-lg bg-white shadow sm:h-80">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Chart visualization coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
              Recent Activity
            </h2>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="border-b pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* User Info Card */}
            <div className="mt-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">{user.name}</h3>
              <p className="mb-2 text-sm opacity-90">{user.email}</p>
              <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

