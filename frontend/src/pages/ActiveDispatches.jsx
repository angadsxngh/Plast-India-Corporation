import React from "react";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft, Loader2, Package, FileText, Calendar, CheckCircle, Download, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function ActiveDispatches() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dispatchOrders, setDispatchOrders] = React.useState([]);
  const [completingId, setCompletingId] = React.useState(null);

  React.useEffect(() => {
    fetchDispatchOrders();
  }, []);

  const fetchDispatchOrders = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/get-dispatch-orders`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dispatch orders");
      }

      const result = await response.json();
      setDispatchOrders(result.data || []);
    } catch (error) {
      console.error("Error fetching dispatch orders:", error);
      toast.error("Failed to load dispatch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalQuantity = (order) => {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const handleMarkAsDispatched = async (dispatchOrderId) => {
    setCompletingId(dispatchOrderId);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/complete-dispatch-order/${dispatchOrderId}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark dispatch as completed");
      }

      const result = await response.json();
      toast.success("Dispatch marked as completed!");
      
      // Generate and download receipt
      generateReceipt(result.data);
      
      // Refresh the dispatch orders list
      fetchDispatchOrders();
    } catch (error) {
      console.error("Error completing dispatch order:", error);
      toast.error(error.message || "Failed to complete dispatch order");
    } finally {
      setCompletingId(null);
    }
  };

  const generateReceipt = (dispatchData) => {
    const formatSimpleDate = (date) => new Date(date).toLocaleDateString('en-GB');
    
    const receiptWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dispatch Receipt #${dispatchData.receiptId || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.3;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
            margin-bottom: 8px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
          }
          .header-right {
            text-align: right;
            font-size: 10px;
            line-height: 1.2;
          }
          .header-right div {
            margin-bottom: 2px;
          }
          .title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
            text-transform: uppercase;
          }
          .receipt-id {
            text-align: center;
            font-size: 10px;
            margin-bottom: 5px;
            color: #666;
          }
          .info-row {
            padding: 2px 0;
            font-size: 10px;
          }
          .info-label {
            font-weight: 600;
            margin-right: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0 0 0;
          }
          th {
            background-color: #f0f0f0;
            padding: 5px 6px;
            text-align: left;
            font-size: 10px;
            font-weight: 600;
            border: 1px solid #ddd;
          }
          td {
            padding: 4px 6px;
            border: 1px solid #ddd;
            font-size: 10px;
          }
          .total-row {
            background-color: #f8f8f8;
            font-weight: bold;
          }
          .print-btn {
            background: #000;
            color: white;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            margin-top: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
            font-size: 11px;
          }
          @media print {
            .no-print { display: none; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">PLAST INDIA CORPORATION</div>
          </div>
          <div class="header-right">
            ${dispatchData.vehicleNumber ? `<div><strong>Vehicle:</strong> ${dispatchData.vehicleNumber}</div>` : ''}
            <div><strong>Date:</strong> ${formatSimpleDate(new Date())}</div>
          </div>
        </div>

        <div class="title">Dispatch Receipt</div>
        <div class="receipt-id">Receipt #${dispatchData.receiptId || 'N/A'}</div>

        <div class="info-row">
          <span class="info-label">Party Name:</span>
          <span>${dispatchData.salesOrder?.party?.name || 'N/A'}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Product Name</th>
              <th style="width: 100px; text-align: center;">Quantity (pcs)</th>
            </tr>
          </thead>
          <tbody>
            ${dispatchData.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productName}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">TOTAL</td>
              <td style="text-align: center;">${dispatchData.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            </tr>
          </tbody>
        </table>

        <button class="print-btn no-print" onclick="window.print()">Print</button>
      </body>
      </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex min-h-[56px] items-center gap-2 sm:h-16 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold sm:text-lg md:text-xl lg:text-2xl">
                Active Dispatches
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                View all active dispatch orders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <span className="ml-3 text-sm text-gray-500">
              Loading dispatch orders...
            </span>
          </div>
        ) : dispatchOrders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Dispatch Orders
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You haven't created any dispatch orders yet.
            </p>
            <Button
              onClick={() => navigate("/dispatches")}
              className="mt-4 bg-orange-600 hover:bg-orange-700"
            >
              <Truck className="mr-2 h-4 w-4" />
              Create Dispatch Order
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dispatchOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                {/* Header Section */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        DO #{order.id.slice(-8).toUpperCase()}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    {/* Party Information */}
                    {order.salesOrder?.party && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{order.salesOrder.party.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{order.salesOrder.party.contactNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Sales Order Reference */}
                  {order.salesOrder && (
                    <div className="rounded-lg bg-green-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div className="text-sm">
                          <p className="font-medium text-green-900">
                            SO #{order.salesOrder.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Dispatched Items
                  </h4>
                  
                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                            #
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                            Product
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.items?.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                {item.productName || "Unknown Product"}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50">
                        <tr>
                          <td colSpan="2" className="px-3 py-2 text-sm font-semibold text-gray-900">
                            Total Quantity
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-semibold text-orange-900">
                            {getTotalQuantity(order)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="space-y-2 sm:hidden">
                    {order.items?.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            Item #{index + 1}
                          </span>
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">
                            {item.productName || "Unknown Product"}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Mobile Total */}
                    <div className="rounded-lg bg-orange-100 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-900">
                          Total Quantity
                        </span>
                        <span className="text-sm font-bold text-orange-900">
                          {getTotalQuantity(order)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {order.items?.length || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Quantity</p>
                    <p className="mt-1 text-lg font-semibold text-orange-600">
                      {getTotalQuantity(order)}
                    </p>
                  </div>
                  <div className="col-span-2 text-center sm:col-span-1">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="mt-1">
                      {order.isCompleted ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          Pending
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {!order.isCompleted && (
                    <Button
                      onClick={() => handleMarkAsDispatched(order.id)}
                      disabled={completingId === order.id}
                      className="cursor-pointer bg-green-600 hover:bg-green-700"
                    >
                      {completingId === order.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Mark as Dispatched</span>
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => generateReceipt(order)}
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span>Print Receipt</span>
                  </Button>
                </div>

                {/* Show receipt button for completed orders */}
                {order.isCompleted && (
                  <div className="mt-4 rounded-lg bg-green-50 p-3">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      This dispatch order has been completed and marked as dispatched.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveDispatches;

