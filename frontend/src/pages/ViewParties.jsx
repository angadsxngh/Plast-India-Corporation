import React from "react";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Loader2, UserPlus, Phone, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function ViewParties() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [parties, setParties] = React.useState([]);

  React.useEffect(() => {
    const fetchParties = async () => {
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
        console.error("Error fetching parties:", error);
        toast.error("Failed to load parties");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParties();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
                Parties
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                View all parties/clients
              </p>
            </div>
            <Button
              onClick={() => navigate("/add-party")}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Party</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-sm text-gray-500">
              Loading parties...
            </span>
          </div>
        ) : parties.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Parties
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You haven't created any parties yet.
            </p>
            <Button
              onClick={() => navigate("/add-party")}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Party
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parties.map((party) => (
              <div
                key={party.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {party.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                          {party.contactNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Orders Info */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <ShoppingCart className="h-4 w-4" />
                      Sales Orders
                    </span>
                    <span className="font-semibold text-gray-900">
                      {party.salesOrders?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900">
                      {formatDate(party.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // View details functionality can be added later
                      toast.info("View details coming soon");
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewParties;

