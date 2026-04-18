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
import { Plus, X, GraduationCap, Loader2, Info, ChevronRight, Check } from "lucide-react";
import { useEducationFields } from "@/hooks/useEducationFields";
import { useAllEducationLevels } from "@/hooks/useEducationLevels";

// Recommended order for adding education (lowest to highest)
const EDUCATION_ORDER = ["middle", "matric", "intermediate", "dae", "dit", "associate_degree", "bachelor", "postgrad_diploma", "master", "phd"];

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

  // Build ordered swipeable strip from defined order + any extra custom levels
  const addedLevels = new Set(value.map((v) => v.education_level));
  const orderedLevels = [
    ...EDUCATION_ORDER.filter((lv) => allLevels.some((l) => l.value === lv)),
    ...allLevels.map((l) => l.value).filter((v) => !EDUCATION_ORDER.includes(v)),
  ];
  const nextSuggested = orderedLevels.find((lv) => !addedLevels.has(lv));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Helpful description */}
      <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/80 space-y-1">
          <p className="font-medium text-foreground">Add all your qualifications, one by one.</p>
          <p className="text-muted-foreground">
            Start from the lowest (e.g. Matric), then add Intermediate, Bachelor's, and so on. This helps us match you with the right jobs.
          </p>
        </div>
      </div>

      {/* Swipeable level progress strip */}
      <div className="-mx-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 px-1 pb-2 min-w-max">
          {orderedLevels.map((lv, idx) => {
            const label = allLevels.find((l) => l.value === lv)?.label || lv;
            const isAdded = addedLevels.has(lv);
            const isNext = lv === nextSuggested;
            return (
              <div key={lv} className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => !isAdded && setSelectedLevel(lv)}
                  disabled={isAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isAdded
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : isNext
                      ? "bg-primary text-primary-foreground border-primary animate-pulse"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {isAdded ? <Check className="h-3 w-3" /> : <span className="text-[10px] opacity-70">{idx + 1}</span>}
                  <span className="whitespace-nowrap">{label}</span>
                </button>
                {idx < orderedLevels.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

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
