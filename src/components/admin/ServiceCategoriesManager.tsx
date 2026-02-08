import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import {
  useAllServiceCategories,
  useCreateServiceCategory,
  useDeleteServiceCategory,
  useToggleServiceCategory,
} from "@/hooks/useServiceCategories";

const ServiceCategoriesManager = () => {
  const { data: categories = [], isLoading } = useAllServiceCategories();
  const createCategory = useCreateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();
  const toggleCategory = useToggleServiceCategory();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
    default_fee: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name.trim()) return;

    try {
      await createCategory.mutateAsync({
        name: formData.display_name.toLowerCase().replace(/\s+/g, "_"),
        display_name: formData.display_name.trim(),
        description: formData.description.trim() || undefined,
        default_fee: parseInt(formData.default_fee) || 0,
      });

      setFormData({ display_name: "", description: "", default_fee: "" });
      setShowAddForm(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleCategory.mutateAsync({ id, is_active: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage the service options available in "Request Work"
          </p>
        </div>
        <Button
          size="sm"
          variant={showAddForm ? "outline" : "default"}
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2"
        >
          {showAddForm ? (
            "Cancel"
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Category
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                placeholder="e.g. Visa Application"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Default Fee (Rs.)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.default_fee}
                onChange={(e) => setFormData({ ...formData, default_fee: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of this service..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <Button type="submit" disabled={createCategory.isPending} className="gap-2">
            {createCategory.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Category
          </Button>
        </form>
      )}

      <Separator />

      {categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No service categories yet.</p>
          <p className="text-sm">Add your first category to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.display_name}</span>
                  {!category.is_active && (
                    <Badge variant="outline" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  {category.default_fee > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Rs. {category.default_fee.toLocaleString()}
                    </Badge>
                  )}
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={() => handleToggle(category.id, category.is_active)}
                    disabled={toggleCategory.isPending}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(category.id, category.display_name)}
                  disabled={deleteCategory.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceCategoriesManager;
