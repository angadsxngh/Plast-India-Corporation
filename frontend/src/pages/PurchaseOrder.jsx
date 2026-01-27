import React from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/src/context/UserContext";

function PurchaseOrder() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const { products, refreshProducts } = useUser();
  
  // Initialize with one empty item
  const [orderItems, setOrderItems] = React.useState([
    { productId: "", quantity: 1 }
  ]);

  // Load products on component mount
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        await refreshProducts();
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = field === "quantity" ? Number(value) : value;
    setOrderItems(updatedItems);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length > 1) {
      const updatedItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(updatedItems);
    } else {
      toast.error("At least one item is required");
    }
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

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/create-purchase-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: orderItems }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create purchase order");
      }

      const data = await response.json();
      toast.success("Purchase order created successfully");
      
      // Reset form
      setOrderItems([{ productId: "", quantity: 1 }]);
      
      // Optionally navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      
    } catch (err) {
      console.error("Error creating purchase order:", err);
      toast.error("Failed to create purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const getProductName = (productId) => {
    const product = Array.isArray(products) 
      ? products.find(p => p.id === productId) 
      : null;
    return product ? product.name : "";
  };

  // Get available products for a specific row (excluding already selected products from other rows)
  const getAvailableProducts = (currentIndex) => {
    if (!Array.isArray(products)) return [];
    
    const selectedProductIds = orderItems
      .map((item, index) => index !== currentIndex ? item.productId : null)
      .filter(id => id); // Remove nulls and empty strings
    
    return products.filter(product => !selectedProductIds.includes(product.id));
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
                Create Purchase Order
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Add items to your purchase order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 md:p-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:mb-6 sm:text-xl">
              <ShoppingCart className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              <span>Order Items</span>
            </h2>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-sm text-gray-500">Loading products...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* No Products Message */}
                {!loadingProducts && (!products || products.length === 0) ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                    <p className="text-sm text-yellow-800">
                      No products available. Please add products first.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/add-product")}
                      className="mt-3"
                    >
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <>
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
                                  {item.productId && !getAvailableProducts(index).find(p => p.id === item.productId) && (
                                    <option value={item.productId}>
                                      {getProductName(item.productId)}
                                    </option>
                                  )}
                                  {getAvailableProducts(index).map((product) => (
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

                    {/* Mobile view - stacked cards */}
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
                                {item.productId && !getAvailableProducts(index).find(p => p.id === item.productId) && (
                                  <option value={item.productId}>
                                    {getProductName(item.productId)}
                                  </option>
                                )}
                                {getAvailableProducts(index).map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name}
                                  </option>
                                ))}
                              </select>
                            </div>
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
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Button */}
                    <Button
                    onClick={handleAddItem}
                    className="bg-transparent text-gray-400 text-xs cursor-pointer hover:bg-transparent hover:text-gray-600"
                    >
                        <Plus className="h-1 mr-[-5px]" />
                        Add item
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 py-2 hover:bg-blue-700"
                size="lg"
                disabled={isLoading || loadingProducts || !products || products.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Submit Order</span>
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
            <div className="mt-4 rounded-lg bg-blue-50 p-3 sm:mt-6 sm:p-4">
              <p className="text-xs leading-relaxed text-blue-900 sm:text-sm">
                <strong>Note:</strong> All items must have a product selected and a quantity greater than 0. 
                You can add multiple items by clicking the "Add Another Item" button.
              </p>
            </div>

            {/* Order Summary */}
            {orderItems.length > 0 && orderItems.every(item => item.productId) && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 sm:mt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Order Summary</h3>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    item.productId && (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {getProductName(item.productId)}
                        </span>
                        <span className="font-medium text-gray-900">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    )
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Items:</span>
                      <span>{orderItems.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default PurchaseOrder;

