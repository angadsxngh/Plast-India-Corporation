import React from "react";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft, Loader2, Package, FileText, AlertCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function ViewDispatches() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [salesOrders, setSalesOrders] = React.useState([]);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [showDialog, setShowDialog] = React.useState(false);
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);
  const [errorDetails, setErrorDetails] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [dispatchOrders, setDispatchOrders] = React.useState([]);

  React.useEffect(() => {
    fetchSalesOrders();
    fetchProducts();
    fetchDispatchOrders();
  }, []);

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
    }
  };

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/get-products`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();
      setProducts(result.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
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

  const handleDispatchClick = (order) => {
    setSelectedOrder(order);
    setShowDialog(true);
  };

  const validateInventory = (items) => {
    const errors = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        errors.push({
          productName: item.productName,
          requested: item.quantity,
          available: 0,
          message: "Product not found in inventory"
        });
      } else if (product.quantity < item.quantity) {
        errors.push({
          productName: item.productName,
          requested: item.quantity,
          available: product.quantity,
          message: `Insufficient quantity`
        });
      }
    }
    
    return errors;
  };

  const handleProceedWithoutEdit = async () => {
    // Create dispatch order with original SO items
    const items = selectedOrder.items.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity
    }));

    // Validate inventory before proceeding
    const inventoryErrors = validateInventory(items);
    
    if (inventoryErrors.length > 0) {
      setShowDialog(false);
      setErrorDetails(inventoryErrors);
      setShowErrorDialog(true);
      return;
    }

    setShowDialog(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/create-dispatch-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            salesOrderId: selectedOrder.id,
            items: items
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create dispatch order");
      }

      toast.success("Dispatch order created successfully");
      // Refresh the lists and products
      fetchSalesOrders();
      fetchDispatchOrders();
      fetchProducts();
    } catch (error) {
      console.error("Error creating dispatch order:", error);
      
      // Check if error message contains inventory information
      if (error.message.includes("Insufficient quantity")) {
        toast.error(error.text, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to create dispatch order");
      }
    }
  };

  const handleEditBeforeDispatch = () => {
    setShowDialog(false);
    // Navigate to edit page with the selected order
    navigate(`/edit-dispatch/${selectedOrder.id}`, { state: { order: selectedOrder } });
  };

  // Filter out sales orders that already have dispatch orders or are marked as dispatched
  const availableSalesOrders = salesOrders.filter(order => {
    // Check if order is already marked as dispatched
    if (order.isDispatched) return false;
    
    // Check if a dispatch order already exists for this sales order
    const hasDispatchOrder = dispatchOrders.some(
      dispatchOrder => dispatchOrder.salesOrderId === order.id
    );
    
    return !hasDispatchOrder;
  });

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
                Dispatch Orders
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Manage and create dispatch orders from sales orders
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
              Loading sales orders...
            </span>
          </div>
        ) : availableSalesOrders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Sales Orders Available
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {salesOrders.length > 0 
                ? "All sales orders have been dispatched or have pending dispatch orders."
                : "Create sales orders first before dispatching."}
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
            {availableSalesOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        SO #{order.id.slice(-8).toUpperCase()}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                    {/* Party Information */}
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
                    onClick={() => handleDispatchClick(order)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Dispatch
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
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog/Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Dispatch Order
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Would you like to proceed with the dispatch as is, or edit the quantities/items first?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleProceedWithoutEdit}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Proceed Without Editing
              </Button>
              <Button
                onClick={handleEditBeforeDispatch}
                variant="outline"
                className="flex-1"
              >
                Edit First
              </Button>
            </div>
            <Button
              onClick={() => setShowDialog(false)}
              variant="ghost"
              className="mt-3 w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error Dialog/Modal */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Insufficient Inventory
              </h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              The following items have insufficient quantity in inventory:
            </p>
            
            {/* Error Details Table */}
            <div className="mb-6 overflow-hidden rounded-lg border border-red-200 bg-red-50">
              <table className="w-full">
                <thead className="bg-red-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-red-900">
                      Product
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-red-900">
                      Requested
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-red-900">
                      Available
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200">
                  {errorDetails.map((error, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {error.productName}
                      </td>
                      <td className="px-3 py-2 text-center text-sm font-medium text-red-700">
                        {error.requested}
                      </td>
                      <td className="px-3 py-2 text-center text-sm font-medium text-gray-900">
                        {error.available}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>Suggestion:</strong> Click "Edit Dispatch" to adjust quantities or remove items before creating the dispatch.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  setShowErrorDialog(false);
                  handleEditBeforeDispatch();
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Edit Dispatch
              </Button>
              <Button
                onClick={() => {
                  setShowErrorDialog(false);
                  setSelectedOrder(null);
                  setErrorDetails([]);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewDispatches;

