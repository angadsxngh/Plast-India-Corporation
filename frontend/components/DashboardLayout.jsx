import * as React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

function DashboardLayout() {
  return (
    <>
      <Toaster />
      <Outlet />
    </>
  );
}

export default DashboardLayout;

