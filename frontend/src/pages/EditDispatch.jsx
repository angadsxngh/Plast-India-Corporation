import React from "react";
import { Button } from "@/components/ui/button";
import {
  Truck,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Send,
  AlertCircle,
  Users,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/src/context/UserContext";

function EditDispatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);
  const [errorDetails, setErrorDetails] = React.useState([]);
  const { products, refreshProducts } = useUser();
  
  // Initialize with the original SO items
  const originalOrder = location.state?.order;
  const [orderItems, setOrderItems] = React.useState(() => {
    if (originalOrder?.items) {
      return originalOrder.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name || "",
        quantity: item.quantity
      }));
    }
    return [{ productId: "", productName: "", quantity: 1 }];
  });

  React.useEffect(() => {
    refreshProducts();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    
    if (field === "productId") {
      updatedItems[index][field] = value;
      // Also update the product name
      const product = Array.isArray(products) 
        ? products.find(p => p.id === value)
        : null;
      updatedItems[index].productName = product ? product.name : "";
    } else if (field === "quantity") {
      updatedItems[index][field] = Number(value);
    } else {
      updatedItems[index][field] = value;
    }
    
    setOrderItems(updatedItems);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: "", productName: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length > 1) {
      const updatedItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(updatedItems);
    } else {
      toast.error("At least one item is required");
    }
  };

  const getProductQuantity = (productId) => {
    const product = Array.isArray(products) 
      ? products.find(p => p.id === productId) 
      : null;
    return product ? product.quantity : 0;
  };

  const validateInventory = (items) => {
    const errors = [];
    
    for (const item of items) {
      const product = Array.isArray(products)
        ? products.find(p => p.id === item.productId)
        : null;
      
      if (!product) {
        errors.push({
          productName: item.productName || "Unknown Product",
          requested: item.quantity,
          available: 0,
          message: "Product not found in inventory"
        });
      } else if (product.quantity < item.quantity) {
        errors.push({
          productName: item.productName || product.name,
          requested: item.quantity,
          available: product.quantity,
          message: "Insufficient quantity"
        });
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all items have a product selected
    const hasEmptyProduct = orderItems.some(item => !item.productId);
    if (hasEmptyProduct) {
      toast.error("Please select a product for all items");
      return;
    }

    // Validate quantities
    const hasInvalidQuantity = orderItems.some(item => item.quantity <= 0);
    if (hasInvalidQuantity) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // Validate inventory before proceeding
    const inventoryErrors = validateInventory(orderItems);
    
    if (inventoryErrors.length > 0) {
      setErrorDetails(inventoryErrors);
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/create-dispatch-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            salesOrderId: id,
            items: orderItems,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create dispatch order");
      }

      toast.success("Dispatch order created successfully");
      
      // Refresh products to update inventory counts
      await refreshProducts();
      
      // Navigate back to dispatches page after a short delay
      setTimeout(() => {
        navigate("/dispatches");
      }, 1500);
      
    } catch (err) {
      console.error("Error creating dispatch order:", err);
      
      // Check if error message contains inventory information
      if (err.message && (err.message.toLowerCase().includes("insufficient") || err.message.toLowerCase().includes("stock"))) {
        toast.error(err.message, { duration: 5000 });
      } else {
        toast.error(err.message || "Failed to create dispatch order");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dispatches");
  };

  if (!originalOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No order data found</p>
          <Button onClick={() => navigate("/dispatches")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex min-h-[56px] items-center gap-2 sm:h-16 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold sm:text-lg md:text-xl lg:text-2xl">
                Edit Dispatch - SO #{id?.slice(-8).toUpperCase()}
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Modify quantities and items before dispatching
              </p>
              {/* Party Information */}
              {originalOrder?.party && (
                <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-gray-700">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="font-medium">{originalOrder.party.name}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{originalOrder.party.contactNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 md:p-8">
            {/* Party Info Card */}
            {originalOrder?.party && (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">Party/Client</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Name:</span>
                    <span className="ml-2 text-blue-900">{originalOrder.party.name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Contact:</span>
                    <span className="ml-2 text-blue-900">{originalOrder.party.contactNumber}</span>
                  </div>
                </div>
              </div>
            )}
            
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:mb-6 sm:text-xl">
              <Truck className="h-5 w-5 text-orange-600 sm:h-6 sm:w-6" />
              <span>Dispatch Items</span>
            </h2>

            <div className="space-y-4">
              {/* Table for larger screens */}
              <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                        Product <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                        Quantity <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                        Available
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {orderItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            id={`product-${index}`}
                            value={item.productId}
                            onChange={(e) =>
                              handleItemChange(index, "productId", e.target.value)
                            }
                            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          >
                            <option value="">Select a product</option>
                            {Array.isArray(products) &&
                              products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            id={`quantity-${index}`}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            className="w-full max-w-[120px] rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Qty"
                            min={1}
                            required
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {item.productId ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {getProductQuantity(item.productId)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {orderItems.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="space-y-3 sm:hidden">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Item #{index + 1}
                      </span>
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleItemChange(index, "productId", e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Select a product</option>
                          {Array.isArray(products) &&
                            products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            placeholder="Qty"
                            min={1}
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Available
                          </label>
                          <div className="flex h-[38px] items-center justify-center rounded-md bg-blue-50 px-3 py-2">
                            {item.productId ? (
                              <span className="text-sm font-medium text-blue-800">
                                {getProductQuantity(item.productId)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <Button
                type="button"
                onClick={handleAddItem}
                className="bg-transparent text-gray-400 text-xs cursor-pointer hover:bg-transparent hover:text-gray-600"
              >
                <Plus className="h-1 mr-[-5px]" />
                Add item
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Button
                type="submit"
                className="flex-1 bg-orange-600 py-2 hover:bg-orange-700"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Creating...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Create Dispatch</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-2"
                size="lg"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <span className="text-sm sm:text-base">Cancel</span>
              </Button>
            </div>

            {/* Info Card */}
            <div className="mt-4 rounded-lg bg-orange-50 p-3 sm:mt-6 sm:p-4">
              <p className="text-xs leading-relaxed text-orange-900 sm:text-sm">
                <strong>Note:</strong> You can modify quantities, add, or remove items from the original sales order. 
                The dispatch will deduct the specified quantities from your inventory.
              </p>
            </div>
          </div>
        </form>
      </div>

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
                <strong>Suggestion:</strong> Please adjust the quantities or remove items with insufficient stock before creating the dispatch.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  setShowErrorDialog(false);
                  setErrorDetails([]);
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Got It
              </Button>
              <Button
                onClick={handleCancel}
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

export default EditDispatch;

