import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Package,
  Filter,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function ProductsByCategory() {
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [loadingProducts, setLoadingProducts] = React.useState(false);

  // Fetch categories on component mount
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/get-categories`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          setCategories(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products when category is selected
  const fetchProducts = async (categoryId) => {
    setLoadingProducts(true);
    setProducts([]);

    try {
      // Fetch all products first
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/get-products`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        const allProducts = result.data || [];
        
        // Filter products based on category selection
        let filteredProducts;
        
        if (categoryId === "no-category") {
          // Show products without a category (categoryId is null, undefined, or empty)
          filteredProducts = allProducts.filter(
            product => !product.categoryId || product.categoryId === null || product.categoryId === ""
          );
        } else {
          // Show products matching the selected category
          filteredProducts = allProducts.filter(
            product => product.categoryId === categoryId
          );
        }
        
        setProducts(filteredProducts);
      } else {
        throw new Error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    
    if (categoryId) {
      fetchProducts(categoryId);
    } else {
      setProducts([]);
    }
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
                Products by Category
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                View and filter products by category
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Category Filter Card */}
          <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 md:p-8 mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:mb-6 sm:text-xl">
              <Filter className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              <span>Filter by Category</span>
            </h2>

            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-medium sm:mb-2"
              >
                Select Category
              </label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading categories...</span>
                </div>
              ) : (
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:py-3"
                >
                  <option value="">-- Select a category --</option>
                  <option value="no-category">No Category Assigned</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Products Table */}
          {selectedCategory && (
            <div className="rounded-lg bg-white shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                  <Package className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                  <span>Products</span>
                  {!loadingProducts && products.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({products.length} {products.length === 1 ? 'product' : 'products'})
                    </span>
                  )}
                </h2>
              </div>

              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-sm sm:text-base text-gray-600">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <Search className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    No Products Found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    {selectedCategory === "no-category" 
                      ? "No products without a category assignment."
                      : "No products found in this category."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product, index) => (
                        <tr 
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Initial State - No Category Selected */}
          {!selectedCategory && !loadingCategories && (
            <div className="rounded-lg bg-white shadow-lg p-8 sm:p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-blue-100 p-6 mb-6">
                  <Filter className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Select a Category
                </h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md">
                  Choose a category from the dropdown above to view all products in that category.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsByCategory;

