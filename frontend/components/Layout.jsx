import * as React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

function Layout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <Toaster />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Layout;

