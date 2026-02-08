import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileQuestion, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useCreateWorkRequest } from "@/hooks/useWorkRequests";

const RequestWorkDropdown = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const createWorkRequest = useCreateWorkRequest();

  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customDescription, setCustomDescription] = useState("");

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  const handleSubmit = async () => {
    if (!customDescription.trim()) return;

    try {
      await createWorkRequest.mutateAsync({
        category_id: selectedCategory || undefined,
        custom_description: customDescription.trim(),
        payment_amount: selectedCategoryData?.default_fee || undefined,
      });

      setOpen(false);
      setSelectedCategory("");
      setCustomDescription("");
      navigate("/dashboard");
    } catch (error) {
      // Error handled in mutation
    }
  };

  // If not logged in, redirect to auth on click
  const handleTriggerClick = () => {
    if (!user) {
      navigate("/auth?redirect=/dashboard");
      return;
    }
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" onClick={handleTriggerClick}>
          <FileQuestion className="h-4 w-4" />
          Request Work
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Custom Service</DialogTitle>
          <DialogDescription>
            Select a service category or describe your custom requirements. We'll get back to you shortly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Service Category</Label>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex flex-col">
                        <span>{category.display_name}</span>
                        {category.description && (
                          <span className="text-xs text-muted-foreground">
                            {category.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedCategoryData && selectedCategoryData.default_fee > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Estimated Fee: </span>
              <span className="font-semibold">Rs. {selectedCategoryData.default_fee.toLocaleString()}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Describe Your Requirements <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Please describe what you need help with. For example: I need help applying for a UK study visa, or I need someone to fill out my university admission form..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be as specific as possible so we can assist you better.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!customDescription.trim() || createWorkRequest.isPending}
          >
            {createWorkRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestWorkDropdown;
