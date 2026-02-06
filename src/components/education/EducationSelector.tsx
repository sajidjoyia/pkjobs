import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GraduationCap, Loader2 } from "lucide-react";
import { useEducationFields } from "@/hooks/useEducationFields";
import { useAllEducationLevels } from "@/hooks/useEducationLevels";

export interface EducationEntry {
  education_level: string;
  education_field_id?: string | null;
}

interface EducationSelectorProps {
  value: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
  maxEntries?: number;
  showAddButton?: boolean;
  className?: string;
}

const EducationSelector = ({
  value = [],
  onChange,
  maxEntries = 5,
  showAddButton = true,
  className = "",
}: EducationSelectorProps) => {
  const { data: allLevels = [], isLoading: levelsLoading } = useAllEducationLevels();
  const { data: allFields = [], isLoading: fieldsLoading } = useEducationFields();

  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedField, setSelectedField] = useState("");

  // Get fields for selected level
  const fieldsForLevel = allFields.filter(
    (f) => f.education_level === selectedLevel
  );

  const handleAddEntry = () => {
    if (!selectedLevel) return;

    const newEntry: EducationEntry = {
      education_level: selectedLevel,
      education_field_id: selectedField || null,
    };

    // Check for duplicates
    const exists = value.some(
      (e) =>
        e.education_level === newEntry.education_level &&
        e.education_field_id === newEntry.education_field_id
    );

    if (!exists) {
      onChange([...value, newEntry]);
    }

    setSelectedLevel("");
    setSelectedField("");
  };

  const handleRemoveEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const getLevelLabel = (levelValue: string) => {
    const level = allLevels.find((l) => l.value === levelValue);
    return level?.label || levelValue;
  };

  const getFieldLabel = (fieldId: string) => {
    const field = allFields.find((f) => f.id === fieldId);
    return field?.display_name || fieldId;
  };

  // Reset field when level changes
  useEffect(() => {
    setSelectedField("");
  }, [selectedLevel]);

  if (levelsLoading || fieldsLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current entries */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((entry, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1.5"
            >
              <GraduationCap className="h-3 w-3" />
              <span>
                {getLevelLabel(entry.education_level)}
                {entry.education_field_id && (
                  <span className="text-muted-foreground">
                    {" "}
                    - {getFieldLabel(entry.education_field_id)}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new entry */}
      {showAddButton && value.length < maxEntries && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Education Level
            </Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {allLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Field / Specialization
            </Label>
            <Select
              value={selectedField}
              onValueChange={setSelectedField}
              disabled={!selectedLevel || fieldsForLevel.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedLevel
                      ? "Select level first"
                      : fieldsForLevel.length === 0
                      ? "No fields available"
                      : "Select field (optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {fieldsForLevel.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEntry}
              disabled={!selectedLevel}
              className="gap-2 w-full md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </Button>
          </div>
        </div>
      )}

      {value.length === 0 && !showAddButton && (
        <p className="text-sm text-muted-foreground">No education selected</p>
      )}
    </div>
  );
};

export default EducationSelector;
