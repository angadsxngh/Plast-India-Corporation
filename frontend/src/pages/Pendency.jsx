import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, AlertCircle, Search, X, FileText, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "../utils/api";

function Pendency() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [salesOrders, setSalesOrders] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [productSearchTerm, setProductSearchTerm] = React.useState("");
  const [salesOrderSearchTerm, setSalesOrderSearchTerm] = React.useState("");
  const [selectedSalesOrderId, setSelectedSalesOrderId] = React.useState("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sales orders and products in parallel
        const [salesOrdersResponse, productsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/get-sales-orders`, {
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/get-products`, {
            credentials: "include",
          }),
        ]);

        if (!salesOrdersResponse.ok) {
          throw new Error("Failed to fetch sales orders");
        }
        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }

        const salesOrdersResult = await salesOrdersResponse.json();
        const productsResult = await productsResponse.json();

        // Filter only non-dispatched sales orders
        const nonDispatchedOrders = (salesOrdersResult.data || []).filter(
          (order) => !order.isDispatched
        );
        setSalesOrders(nonDispatchedOrders);
        setProducts(productsResult.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate pendency for selected sales order
  const pendencyBySalesOrder = React.useMemo(() => {
    if (!selectedSalesOrderId) return [];

    const selectedOrder = salesOrders.find((order) => order.id === selectedSalesOrderId);
    if (!selectedOrder || !selectedOrder.items) return [];

    // Create a map of product quantities from the sales order
    const orderDemand = new Map();
    selectedOrder.items.forEach((item) => {
      const current = orderDemand.get(item.productId) || 0;
      orderDemand.set(item.productId, current + item.quantity);
    });

    // Calculate pendency for each product in the order
    const pendencyRows = [];
    orderDemand.forEach((requiredQty, productId) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const availableQty = product.quantity || 0;
      const deficitQty = requiredQty - availableQty;

      if (deficitQty > 0) {
        pendencyRows.push({
          id: `${selectedSalesOrderId}-${productId}`,
          productId,
          product: product,
          requiredQty,
          availableQty,
          deficitQty,
          salesOrderId: selectedSalesOrderId,
        });
      }
    });

    return pendencyRows;
  }, [selectedSalesOrderId, salesOrders, products]);

  // Get display text for selected order
  const selectedOrderDisplay = React.useMemo(() => {
    if (!selectedSalesOrderId) return "";
    const order = salesOrders.find((o) => o.id === selectedSalesOrderId);
    if (!order) return "";
    return `Order #${order.receiptId || order.id.slice(-6)} - ${order.party?.name || "Unknown Party"} (${new Date(order.createdAt).toLocaleDateString()})`;
  }, [selectedSalesOrderId, salesOrders]);

  // Filter and sort sales orders based on search term
  const filteredSalesOrders = React.useMemo(() => {
    if (!salesOrderSearchTerm.trim()) {
      // When no search, sort by receipt ID descending (newest first)
      return [...salesOrders].sort((a, b) => {
        const aId = a.receiptId || 0;
        const bId = b.receiptId || 0;
        return bId - aId;
      });
    }
    
    const term = salesOrderSearchTerm.toLowerCase().trim();
    const isNumeric = /^\d+$/.test(term);
    
    // Filter orders and add match priority
    const filtered = salesOrders
      .map((order) => {
        const receiptId = order.receiptId?.toString() || "";
        const partyName = order.party?.name?.toLowerCase() || "";
        let matches = false;
        let priority = 0; // Higher priority = appears first
        
        if (isNumeric) {
          // For numeric searches, prioritize receipt ID
          if (receiptId === term) {
            matches = true;
            priority = 100; // Exact match gets highest priority
          } else if (receiptId.startsWith(term)) {
            matches = true;
            priority = 50; // Starts with gets second priority
          } else if (receiptId.includes(term)) {
            matches = true;
            priority = 25; // Contains gets lower priority
          } else if (partyName.includes(term)) {
            matches = true;
            priority = 10; // Party name match gets lowest priority
          }
        } else {
          // For text searches, check all fields
          const dateStr = new Date(order.createdAt).toLocaleDateString().toLowerCase();
          if (receiptId.includes(term)) {
            matches = true;
            priority = 30;
          } else if (partyName.includes(term)) {
            matches = true;
            priority = 20;
          } else if (dateStr.includes(term)) {
            matches = true;
            priority = 10;
          }
        }
        
        return matches ? { order, priority } : null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => {
        // Sort by priority (descending), then by receipt ID (descending)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        const aId = a.order.receiptId || 0;
        const bId = b.order.receiptId || 0;
        return bId - aId;
      })
      .map((item) => item.order);
    
    return filtered;
  }, [salesOrders, salesOrderSearchTerm]);

  // Handle sales order selection
  const handleSelectOrder = (orderId) => {
    setSelectedSalesOrderId(orderId);
    setSalesOrderSearchTerm("");
    setIsDropdownOpen(false);
    setProductSearchTerm("");
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSalesOrderSearchTerm(value);
    setIsDropdownOpen(true);
    // Clear selection if user starts typing
    if (selectedSalesOrderId) {
      setSelectedSalesOrderId("");
    }
  };

  // Handle input click - reopen dropdown if closed
  const handleInputClick = () => {
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  // Filter pendency items based on product search
  const filteredPendency = React.useMemo(() => {
    if (!productSearchTerm.trim()) return pendencyBySalesOrder;
    const term = productSearchTerm.toLowerCase().trim();
    return pendencyBySalesOrder.filter((row) =>
      row.product?.name?.toLowerCase().includes(term)
    );
  }, [pendencyBySalesOrder, productSearchTerm]);

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
                Pendency by Sales Order
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                View products where sales order demand exceeds current inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {/* Sales Order Selection */}
        {!isLoading && (
          <div className="mb-6">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <label htmlFor="sales-order-select" className="text-sm font-medium text-gray-700">
                    Select Sales Order:
                  </label>
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                  {/* Autocomplete input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Type to search sales orders..."
                      value={selectedSalesOrderId ? selectedOrderDisplay : salesOrderSearchTerm}
                      onChange={handleInputChange}
                      onClick={handleInputClick}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() => {
                        // Delay closing to allow click events
                        setTimeout(() => setIsDropdownOpen(false), 200);
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {(salesOrderSearchTerm || selectedSalesOrderId) && (
                      <button
                        onClick={() => {
                          setSalesOrderSearchTerm("");
                          setSelectedSalesOrderId("");
                          setIsDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {!selectedSalesOrderId && (
                      <ChevronDown className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Dropdown list */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                      {filteredSalesOrders.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No sales orders found
                        </div>
                      ) : (
                        <ul className="py-1">
                          {filteredSalesOrders.map((order) => {
                            const orderText = `Order #${order.receiptId || order.id.slice(-6)} - ${order.party?.name || "Unknown Party"} (${new Date(order.createdAt).toLocaleDateString()})`;
                            return (
                              <li
                                key={order.id}
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent input blur
                                  handleSelectOrder(order.id);
                                }}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-orange-50 ${
                                  selectedSalesOrderId === order.id
                                    ? "bg-orange-100 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                {orderText}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {selectedSalesOrderId && (
                <p className="mt-2 text-xs text-gray-500">
                  Showing pendency for: <span className="font-medium">
                    {(() => {
                      const order = salesOrders.find((o) => o.id === selectedSalesOrderId);
                      return order
                        ? `Order #${order.receiptId || order.id.slice(-6)} - ${order.party?.name || "Unknown Party"}`
                        : "";
                    })()}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Package className="h-8 w-8 animate-pulse text-orange-600" />
            <span className="ml-3 text-sm text-gray-500">
              Loading sales orders...
            </span>
          </div>
        ) : !selectedSalesOrderId ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Select a Sales Order
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Please select a sales order from the dropdown above to view pendency details.
            </p>
            {salesOrders.length === 0 && (
              <div className="mt-4">
                <AlertCircle className="mx-auto h-10 w-10 text-green-500" />
                <p className="mt-2 text-sm text-gray-500">
                  No pending sales orders found. All orders have been dispatched.
                </p>
              </div>
            )}
          </div>
        ) : pendencyBySalesOrder.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Pendency for Selected Order
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              All products in this sales order have sufficient inventory available.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-700" />
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Pendency Items
                </h2>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                {filteredPendency.length} of {pendencyBySalesOrder.length} product{pendencyBySalesOrder.length !== 1 ? "s" : ""} in
                deficit
              </span>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {productSearchTerm && (
                  <button
                    onClick={() => setProductSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredPendency.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">
                  {productSearchTerm
                    ? `No products found matching "${productSearchTerm}"`
                    : "No products in deficit"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                        Required
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                        Available
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                        Deficit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPendency.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            {row.product?.name || "Unknown Product"}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-gray-900">
                          {row.requiredQty}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-gray-900">
                          {row.availableQty}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-red-600">
                          {row.deficitQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Pendency;


