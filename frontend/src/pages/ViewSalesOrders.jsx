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
        <title>Sales Order - SO #${orderData.id.slice(-8).toUpperCase()}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            line-height: 1.6;
            color: #333;
          }
          .document-header {
            border-bottom: 3px solid #1e293b;
            padding-bottom: 25px;
            margin-bottom: 30px;
          }
          .company-info {
            text-align: left;
          }
          .company-name {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
            margin-bottom: 5px;
          }
          .company-subtitle {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .document-title {
            text-align: center;
            margin: 25px 0;
          }
          .document-title h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          .document-number {
            font-size: 16px;
            color: #64748b;
            font-weight: 500;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
          }
          .info-section {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 4px;
            border-left: 4px solid #1e293b;
          }
          .info-section h3 {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }
          .info-value {
            font-size: 13px;
            color: #1e293b;
            font-weight: 600;
            text-align: right;
          }
          .items-section {
            margin: 40px 0;
          }
          .section-title {
            font-size: 14px;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
          }
          thead {
            background-color: #1e293b;
            color: white;
          }
          th {
            padding: 14px 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          tbody tr:hover {
            background-color: #f8fafc;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .total-row {
            background-color: #f1f5f9;
            font-weight: 700;
            border-top: 2px solid #1e293b;
          }
          .total-row td {
            color: #1e293b;
            font-size: 14px;
          }
          .status-section {
            margin: 30px 0;
            padding: 20px;
            ${orderData.isDispatched 
              ? 'background-color: #fff7ed; border-left: 4px solid #f97316;' 
              : 'background-color: #f0fdf4; border-left: 4px solid #10b981;'}
            border-radius: 4px;
          }
          .status-label {
            font-size: 12px;
            ${orderData.isDispatched 
              ? 'color: #9a3412;' 
              : 'color: #166534;'}
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .footer {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
          }
          .footer p {
            font-size: 12px;
            color: #64748b;
            margin: 8px 0;
          }
          .print-button {
            background-color: #1e293b;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: background-color 0.2s;
          }
          .print-button:hover {
            background-color: #334155;
          }
          @media print {
            body {
              margin: 0;
              padding: 30px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-header">
          <div class="company-info">
            <div class="company-name">PLAST INDIA CORPORATION</div> 
          </div>
        </div>

        <div class="document-title">
          <h1>Sales Order</h1>
          <div class="document-number">SO #${orderData.id.slice(-8).toUpperCase()}</div>
        </div>

        <div class="status-section">
          <div class="status-label">Status: ${orderData.isDispatched ? 'Dispatched' : 'Pending Dispatch'}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>Order Information</h3>
            <div class="info-row">
              <span class="info-label">Sales Order ID</span>
              <span class="info-value">${orderData.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date Created</span>
              <span class="info-value">${formatDate(orderData.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Status</span>
              <span class="info-value">${orderData.isDispatched ? 'Dispatched' : 'Pending'}</span>
            </div>
          </div>
          ${orderData.party ? `
          <div class="info-section">
            <h3>Client Information</h3>
            <div class="info-row">
              <span class="info-label">Client Name</span>
              <span class="info-value">${orderData.party.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Number</span>
              <span class="info-value">${orderData.party.contactNumber}</span>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="items-section">
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Product Name</th>
                <th style="text-align: center; width: 150px;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product?.name || 'Unknown Product'}</td>
                  <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">TOTAL ITEMS</td>
                <td style="text-align: center;">${orderData.items.length}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">TOTAL QUANTITY</td>
                <td style="text-align: center;">${orderData.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This is a warehouse document for order fulfillment and tracking.</p>
          <p>For any queries, please contact Plast India Corporation.</p>
          <button class="print-button no-print" onclick="window.print()">Print Document</button>
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

