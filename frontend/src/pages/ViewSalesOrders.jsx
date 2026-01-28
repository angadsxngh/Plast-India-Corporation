import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Loader2, Package, Users, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function ViewSalesOrders() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [salesOrders, setSalesOrders] = React.useState([]);

  React.useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/get-sales-orders`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sales orders");
        }

        const result = await response.json();
        setSalesOrders(result.data || []);
      } catch (error) {
        console.error("Error fetching sales orders:", error);
        toast.error("Failed to load sales orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalItems = (order) => {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const generateReceipt = (orderData) => {
    const formatSimpleDate = (date) => new Date(date).toLocaleDateString('en-GB');
    
    const receiptWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Order Receipt #${orderData.receiptId || 'N/A'}</title>
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
            <div><strong>Date:</strong> ${formatSimpleDate(new Date())}</div>
          </div>
        </div>

        <div class="title">Sales Order Receipt</div>
        <div class="receipt-id">Receipt #${orderData.receiptId || 'N/A'}</div>

        <div class="info-row">
          <span class="info-label">Party Name:</span>
          <span>${orderData.party?.name || 'N/A'}</span>
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
            ${orderData.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product?.name || 'Unknown Product'}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">TOTAL</td>
              <td style="text-align: center;">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
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
                Sales Orders
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                View all sales orders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 text-sm text-gray-500">
              Loading sales orders...
            </span>
          </div>
        ) : salesOrders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Sales Orders
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You haven't created any sales orders yet.
            </p>
            <Button
              onClick={() => navigate("/sales-order")}
              className="mt-4 bg-green-600 hover:bg-green-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Sales Order
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {salesOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        SO #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      {order.isDispatched && (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                          Dispatched
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                    {order.party && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{order.party.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{order.party.contactNumber}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => generateReceipt(order)}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                          Product
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              {item.product?.name || "Unknown Product"}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                          Total Items
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">
                          {order.items?.length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewSalesOrders;

