import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import Layout from "@/components/Layout";
import DashboardLayout from "@/components/DashboardLayout";
import Home from "@/src/pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import AddCategory from "./pages/AddCategory";
import ProductsByCategory from "./pages/ProductsByCategory";
import PurchaseOrder from "./pages/PurchaseOrder";
import SalesOrder from "./pages/SalesOrder";
import ViewPurchaseOrders from "./pages/ViewPurchaseOrders";
import ViewSalesOrders from "./pages/ViewSalesOrders";
import ViewDispatches from "./pages/ViewDispatches";
import EditDispatch from "./pages/EditDispatch";
import ActiveDispatches from "./pages/ActiveDispatches";
import AddParty from "./pages/AddParty";
import ViewParties from "./pages/ViewParties";
import { UserProvider } from "./context/UserContext";
import PrivateRoute from "@/components/PrivateRoute";
import { Toaster } from "sonner";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Route>
      
      <Route element={<DashboardLayout />}>
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/add-category" element={<AddCategory />} />
          <Route path="/add-party" element={<AddParty />} />
          <Route path="/products" element={<ProductsByCategory />} />
          <Route path="/purchase-order" element={<PurchaseOrder />} />
          <Route path="/sales-order" element={<SalesOrder />} />
          <Route path="/view-purchase-orders" element={<ViewPurchaseOrders />} />
          <Route path="/view-sales-orders" element={<ViewSalesOrders />} />
          <Route path="/view-parties" element={<ViewParties />} />
          <Route path="/dispatches" element={<ViewDispatches />} />
          <Route path="/edit-dispatch/:id" element={<EditDispatch />} />
          <Route path="/active-dispatches" element={<ActiveDispatches />} />
        </Route>
      </Route>
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </UserProvider>
  </StrictMode>
);
