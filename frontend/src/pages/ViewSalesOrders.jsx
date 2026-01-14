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
    // Create a printable receipt
    const receiptWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Order Receipt - SO #${orderData.id.slice(-8).toUpperCase()}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #16a34a;
            margin: 0;
          }
          .info-section {
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            gap: 20px;
          }
          .info-box {
            flex: 1;
          }
          .info-box h3 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .total-row {
            background-color: #dcfce7;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .status-badge {
            display: inline-block;
            background-color: ${orderData.isDispatched ? '#fb923c' : '#16a34a'};
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 SALES ORDER RECEIPT</h1>
          <p>Plast India Corporation</p>
          <p style="margin: 5px 0;">Sales Order #${orderData.id.slice(-8).toUpperCase()}</p>
          <span class="status-badge">${orderData.isDispatched ? '✓ DISPATCHED' : 'PENDING'}</span>
        </div>
        
        <div class="info-section">
          <div class="info-box">
            <h3>Order Information</h3>
            <p><strong>Sales Order ID:</strong> ${orderData.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date Created:</strong> ${formatDate(orderData.createdAt)}</p>
            <p><strong>Status:</strong> ${orderData.isDispatched ? 'Dispatched' : 'Pending'}</p>
          </div>
          ${orderData.party ? `
          <div class="info-box">
            <h3>Party/Client Information</h3>
            <p><strong>Name:</strong> ${orderData.party.name}</p>
            <p><strong>Contact:</strong> ${orderData.party.contactNumber}</p>
          </div>
          ` : ''}
        </div>

        <h3>Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th style="text-align: center;">Quantity</th>
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
              <td colspan="2" style="text-align: right;">Total Items:</td>
              <td style="text-align: center;">${orderData.items.length}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">Total Quantity:</td>
              <td style="text-align: center;">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>This is a warehouse document for order fulfillment.</p>
          <p>Plast India Corporation - Warehouse Copy</p>
          <button class="no-print" onclick="window.print()" style="
            background-color: #16a34a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
          ">Print Receipt</button>
        </div>
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

