import React from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Send,
  Users,
  Package,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/src/context/UserContext";

function SalesOrder() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [loadingParties, setLoadingParties] = React.useState(true);
  const { products, refreshProducts } = useUser();
  const [parties, setParties] = React.useState([]);
  const [selectedPartyId, setSelectedPartyId] = React.useState("");
  
  // Initialize with one empty item
  const [orderItems, setOrderItems] = React.useState([
    { productId: "", quantity: 1 }
  ]);
  const [productSearchTerms, setProductSearchTerms] = React.useState({});
  const [showProductDropdowns, setShowProductDropdowns] = React.useState({});

  // Initialize search terms when products are loaded or items change
  React.useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const newSearchTerms = {};
      orderItems.forEach((item, index) => {
        if (item.productId) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            newSearchTerms[index] = product.name;
          }
        }
      });
      setProductSearchTerms(prev => ({ ...prev, ...newSearchTerms }));
    }
  }, [products, orderItems.length]);

  // Load products and parties on component mount
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

    const loadParties = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/get-parties`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch parties");
        }

        const result = await response.json();
        setParties(result.data || []);
      } catch (error) {
        console.error("Failed to fetch parties:", error);
        toast.error("Failed to load parties");
      } finally {
        setLoadingParties(false);
      }
    };

    loadProducts();
    loadParties();
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
      // Clean up search terms for removed item and reindex remaining items
      setProductSearchTerms(prev => {
        const updated = {};
        updatedItems.forEach((item, newIndex) => {
          const oldIndex = newIndex < index ? newIndex : newIndex + 1;
          if (prev[oldIndex]) {
            updated[newIndex] = prev[oldIndex];
          }
        });
        return updated;
      });
      setShowProductDropdowns(prev => {
        const updated = {};
        updatedItems.forEach((item, newIndex) => {
          const oldIndex = newIndex < index ? newIndex : newIndex + 1;
          if (prev[oldIndex]) {
            updated[newIndex] = prev[oldIndex];
          }
        });
        return updated;
      });
    } else {
      toast.error("At least one item is required");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate party selection
    if (!selectedPartyId) {
      toast.error("Please select a party for this sales order");
      return;
    }
    
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
        `${import.meta.env.VITE_BASE_URL}/create-sales-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            partyId: selectedPartyId,
            items: orderItems 
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create sales order");
      }

      const data = await response.json();
      toast.success("Sales order created successfully");
      
      // Reset form
      setSelectedPartyId("");
      setOrderItems([{ productId: "", quantity: 1 }]);
      setProductSearchTerms({});
      setShowProductDropdowns({});
      
      // Optionally navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      
    } catch (err) {
      console.error("Error creating sales order:", err);
      toast.error("Failed to create sales order");
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

  const getProductQuantity = (productId) => {
    const product = Array.isArray(products) 
      ? products.find(p => p.id === productId) 
      : null;
    return product ? product.quantity : 0;
  };

  const getPartyName = (partyId) => {
    const party = Array.isArray(parties) 
      ? parties.find(p => p.id === partyId) 
      : null;
    return party ? party.name : "";
  };

  // Get available products for a specific row (excluding already selected products from other rows)
  const getAvailableProducts = (currentIndex) => {
    if (!Array.isArray(products)) return [];
    
    const selectedProductIds = orderItems
      .map((item, index) => index !== currentIndex ? item.productId : null)
      .filter(id => id); // Remove nulls and empty strings
    
    return products.filter(product => !selectedProductIds.includes(product.id));
  };

  // Filter products based on search term (case-insensitive)
  const getFilteredProducts = (currentIndex, searchTerm) => {
    const available = getAvailableProducts(currentIndex);
    if (!searchTerm || searchTerm.trim() === "") {
      return available;
    }
    const term = searchTerm.toLowerCase().trim();
    return available.filter(product => 
      product.name.toLowerCase().includes(term)
    );
  };

  // Handle product search input change
  const handleProductSearchChange = (index, value) => {
    setProductSearchTerms(prev => ({
      ...prev,
      [index]: value
    }));
    setShowProductDropdowns(prev => ({
      ...prev,
      [index]: true
    }));
  };

  // Handle product selection
  const handleProductSelect = (index, productId, productName) => {
    handleItemChange(index, "productId", productId);
    setProductSearchTerms(prev => ({
      ...prev,
      [index]: productName
    }));
    setShowProductDropdowns(prev => ({
      ...prev,
      [index]: false
    }));
  };

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.product-search-container')) {
        setShowProductDropdowns({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                Create Sales Order
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Add items to your sales order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 md:p-8">
            {/* Party Selection Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:text-xl">
                <Users className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                <span>Party Details</span>
              </h2>
              
              {loadingParties ? (
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading parties...</span>
                </div>
              ) : !parties || parties.length === 0 ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    No parties available. Please add a party first.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/add-party")}
                    className="mt-3"
                  >
                    Add Party
                  </Button>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="party"
                    className="mb-1.5 block text-sm font-medium sm:mb-2"
                  >
                    Select Party/Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="party"
                    value={selectedPartyId}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:py-3"
                    required
                  >
                    <option value="">Select a party</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:mb-6 sm:text-xl">
              <Package className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
              <span>Order Items</span>
            </h2>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
                                <div className="product-search-container relative">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                      type="text"
                                      id={`product-${index}`}
                                      value={productSearchTerms[index] || (item.productId ? getProductName(item.productId) : "")}
                                      onChange={(e) => handleProductSearchChange(index, e.target.value)}
                                      onFocus={() => setShowProductDropdowns(prev => ({ ...prev, [index]: true }))}
                                      placeholder="Search and select a product..."
                                      className="w-full rounded-md border border-input bg-white pl-10 pr-10 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      required={!item.productId}
                                    />
                                    {productSearchTerms[index] && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setProductSearchTerms(prev => ({ ...prev, [index]: "" }));
                                          handleItemChange(index, "productId", "");
                                          setShowProductDropdowns(prev => ({ ...prev, [index]: false }));
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                  {showProductDropdowns[index] && (
                                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                      {getFilteredProducts(index, productSearchTerms[index] || "").length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                          No products found
                                        </div>
                                      ) : (
                                        getFilteredProducts(index, productSearchTerms[index] || "").map((product) => (
                                          <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleProductSelect(index, product.id, product.name)}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                          >
                                            {product.name}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
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
                              <div className="product-search-container relative">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={productSearchTerms[index] || (item.productId ? getProductName(item.productId) : "")}
                                    onChange={(e) => handleProductSearchChange(index, e.target.value)}
                                    onFocus={() => setShowProductDropdowns(prev => ({ ...prev, [index]: true }))}
                                    placeholder="Search and select a product..."
                                    className="w-full rounded-md border border-input bg-white pl-10 pr-10 py-2 text-sm"
                                    required={!item.productId}
                                  />
                                  {productSearchTerms[index] && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductSearchTerms(prev => ({ ...prev, [index]: "" }));
                                        handleItemChange(index, "productId", "");
                                        setShowProductDropdowns(prev => ({ ...prev, [index]: false }));
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                                {showProductDropdowns[index] && (
                                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                    {getFilteredProducts(index, productSearchTerms[index] || "").length === 0 ? (
                                      <div className="px-3 py-2 text-sm text-gray-500">
                                        No products found
                                      </div>
                                    ) : (
                                      getFilteredProducts(index, productSearchTerms[index] || "").map((product) => (
                                        <button
                                          key={product.id}
                                          type="button"
                                          onClick={() => handleProductSelect(index, product.id, product.name)}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        >
                                          {product.name}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
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
                className="flex-1 bg-green-600 py-2 hover:bg-green-700"
                size="lg"
                disabled={
                  isLoading || 
                  loadingProducts || 
                  loadingParties || 
                  !products || 
                  products.length === 0 || 
                  !parties || 
                  parties.length === 0
                }
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
            <div className="mt-4 rounded-lg bg-green-50 p-3 sm:mt-6 sm:p-4">
              <p className="text-xs leading-relaxed text-green-900 sm:text-sm">
                <strong>Note:</strong> You must select a party/client for this sales order. All items must have a product selected and a quantity greater than 0. 
                You can add multiple items by clicking the "Add item" button.
              </p>
            </div>

            {/* Order Summary */}
            {selectedPartyId && orderItems.length > 0 && orderItems.every(item => item.productId) && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 sm:mt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm pb-2 border-b">
                    <span className="text-gray-600">Party:</span>
                    <span className="font-medium text-gray-900">
                      {getPartyName(selectedPartyId)}
                    </span>
                  </div>
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

export default SalesOrder;

