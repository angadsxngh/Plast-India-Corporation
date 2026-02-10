import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, Package, AlertCircle, Search, X, Calendar, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function Pendency() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [pendency, setPendency] = React.useState([]);
  const [searchTerms, setSearchTerms] = React.useState({});
  const [selectedDate, setSelectedDate] = React.useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedCategory, setSelectedCategory] = React.useState("");

  React.useEffect(() => {
    const fetchPendency = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/get-pendency`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pendency");
        }

        const result = await response.json();
        setPendency(result.data || []);
      } catch (error) {
        console.error("Error fetching pendency:", error);
        toast.error("Failed to load pendency data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendency();
  }, []);

  // Filter pendency by selected date
  const filteredPendency = React.useMemo(() => {
    if (!selectedDate) return pendency;
    
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return pendency.filter((row) => {
      if (!row.updatedAt) return false;
      const rowDate = new Date(row.updatedAt);
      rowDate.setHours(0, 0, 0, 0);
      return rowDate >= selectedDateObj && rowDate < nextDay;
    });
  }, [pendency, selectedDate]);

  const groupedByCategory = React.useMemo(() => {
    const map = new Map();
    for (const row of filteredPendency) {
      const catName = row.category?.name || "Uncategorized";
      if (!map.has(catName)) {
        map.set(catName, []);
      }
      map.get(catName).push(row);
    }
    return Array.from(map.entries());
  }, [filteredPendency]);

  // Get list of available categories
  const availableCategories = React.useMemo(() => {
    return groupedByCategory.map(([categoryName]) => categoryName).sort();
  }, [groupedByCategory]);

  // Filter to show only selected category
  const selectedCategoryData = React.useMemo(() => {
    if (!selectedCategory) return null;
    return groupedByCategory.find(([categoryName]) => categoryName === selectedCategory);
  }, [groupedByCategory, selectedCategory]);

  const handleSearchChange = (categoryName, value) => {
    setSearchTerms((prev) => ({
      ...prev,
      [categoryName]: value,
    }));
  };

  const clearSearch = (categoryName) => {
    setSearchTerms((prev) => {
      const updated = { ...prev };
      delete updated[categoryName];
      return updated;
    });
  };

  const filterItems = (items, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
      return items;
    }
    const term = searchTerm.toLowerCase().trim();
    return items.filter((row) =>
      row.product?.name?.toLowerCase().includes(term)
    );
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
                Pendency
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Products where sales order demand exceeds current inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {/* Date and Category Selection */}
        {!isLoading && (
          <div className="mb-6 space-y-4">
            {/* Date Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <label htmlFor="date-select" className="text-sm font-medium text-gray-700">
                    Select Date:
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    id="date-select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setSelectedDate(today.toISOString().split('T')[0]);
                      }}
                      className="text-xs"
                    >
                      Today
                    </Button>
                  )}
                </div>
              </div>
              {selectedDate && (
                <p className="mt-2 text-xs text-gray-500">
                  Showing pendency records for: <span className="font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-orange-600" />
                  <label htmlFor="category-select" className="text-sm font-medium text-gray-700">
                    Select Category:
                  </label>
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      // Clear search when category changes
                      setSearchTerms({});
                    }}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">-- Select a Category --</option>
                    {availableCategories.map((categoryName) => (
                      <option key={categoryName} value={categoryName}>
                        {categoryName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              {selectedCategory && (
                <p className="mt-2 text-xs text-gray-500">
                  Showing pendency for category: <span className="font-medium">{selectedCategory}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Layers className="h-8 w-8 animate-pulse text-orange-600" />
            <span className="ml-3 text-sm text-gray-500">
              Calculating pendency...
            </span>
          </div>
        ) : !selectedCategory ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Layers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Select a Category
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Please select a category from the dropdown above to view pendency details.
            </p>
            {availableCategories.length === 0 && (
              <div className="mt-4">
                <AlertCircle className="mx-auto h-10 w-10 text-green-500" />
                <p className="mt-2 text-sm text-gray-500">
                  No pendency found for the selected date. All product inventory levels meet or exceed current sales order requirements.
                </p>
              </div>
            )}
          </div>
        ) : !selectedCategoryData ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Pendency for {selectedCategory}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              All products in this category meet or exceed current sales order requirements for the selected date.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            {(() => {
              const [categoryName, items] = selectedCategoryData;
              const searchTerm = searchTerms[categoryName] || "";
              const filteredItems = filterItems(items, searchTerm);
              
              return (
                <>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-slate-700" />
                      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                        {categoryName}
                      </h2>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      {filteredItems.length} of {items.length} product{items.length !== 1 ? "s" : ""} in
                      deficit
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search products in ${categoryName}...`}
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(categoryName, e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => clearSearch(categoryName)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        {searchTerm
                          ? `No products found matching "${searchTerm}"`
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
                          {filteredItems.map((row) => (
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
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default Pendency;


