import React from "react";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "../utils/api";

function AddParty() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    contactNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/create-party`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add party");
      }

      const data = await response.json();
      // Reset form
      setFormData({ name: "", contactNumber: "" });
      toast.success("Party added successfully");      
      
    } catch (err) {
      toast.error("Failed to add party");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
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
                Add New Party
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
                Create a new party/client
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6 md:p-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold sm:mb-6 sm:text-xl">
              <UserPlus className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              <span>Party Information</span>
            </h2>

            <div className="space-y-4 sm:space-y-6">
              {/* Party Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium sm:mb-2"
                >
                  Party Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:py-3"
                  placeholder="Enter party/client name"
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="contactNumber"
                  className="mb-1.5 block text-sm font-medium sm:mb-2"
                >
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:py-3"
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Button
                type="submit"
                className="w-full py-2 flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="text-sm sm:text-base">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Save Party</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex-1 py-2"
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
                <strong>Note:</strong> Party name and contact number are required. Parties are clients for whom sales orders are created.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddParty;

