import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, GraduationCap, BookOpen } from "lucide-react";
import {
  useEducationFields,
  useAddEducationField,
  useDeleteEducationField,
} from "@/hooks/useEducationFields";
import {
  useCustomEducationLevels,
  useAddEducationLevel,
  useDeleteEducationLevel,
  DEFAULT_EDUCATION_LEVELS,
} from "@/hooks/useEducationLevels";

const EducationFieldsManager = () => {
  const { data: educationFields = [], isLoading: fieldsLoading } = useEducationFields();
  const { data: customLevels = [] } = useCustomEducationLevels();
  const addEducationField = useAddEducationField();
  const deleteEducationField = useDeleteEducationField();
  const addEducationLevel = useAddEducationLevel();
  const deleteEducationLevel = useDeleteEducationLevel();

  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelDisplayName, setNewLevelDisplayName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldDisplayName, setNewFieldDisplayName] = useState("");

  // Combine default and custom education levels
  const allLevels = [
    ...DEFAULT_EDUCATION_LEVELS,
    ...customLevels.map((l) => ({ value: l.name, label: l.display_name })),
  ];

  // Group fields by level
  const fieldsByLevel = educationFields.reduce((acc, field) => {
    if (!acc[field.education_level]) {
      acc[field.education_level] = [];
    }
    acc[field.education_level].push(field);
    return acc;
  }, {} as Record<string, typeof educationFields>);

  const handleAddLevel = async () => {
    if (!newLevelName || !newLevelDisplayName) return;
    await addEducationLevel.mutateAsync({
      name: newLevelName.toLowerCase().replace(/\s+/g, "_"),
      displayName: newLevelDisplayName,
    });
    setNewLevelName("");
    setNewLevelDisplayName("");
  };

  const handleAddField = async () => {
    if (!selectedLevel || !newFieldName || !newFieldDisplayName) return;
    await addEducationField.mutateAsync({
      education_level: selectedLevel,
      name: newFieldName.toLowerCase().replace(/\s+/g, "_"),
      display_name: newFieldDisplayName,
    });
    setNewFieldName("");
    setNewFieldDisplayName("");
  };

  const getLevelLabel = (value: string) => {
    const level = allLevels.find((l) => l.value === value);
    return level?.label || value;
  };

  return (
    <div className="space-y-6">
      {/* Add New Education Level */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Education Levels</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Internal name (e.g., diploma)"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
          />
          <Input
            placeholder="Display name (e.g., Diploma / DAE)"
            value={newLevelDisplayName}
            onChange={(e) => setNewLevelDisplayName(e.target.value)}
          />
          <Button
            onClick={handleAddLevel}
            disabled={addEducationLevel.isPending || !newLevelName || !newLevelDisplayName}
            className="gap-2"
          >
            {addEducationLevel.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Level
          </Button>
        </div>

        {/* List custom levels */}
        {customLevels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customLevels.map((level) => (
              <Badge
                key={level.id}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
              >
                {level.display_name}
                <button
                  onClick={() => deleteEducationLevel.mutate(level.id)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border" />

      {/* Add New Education Field */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">
            Education Fields / Specializations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
          <Input
            placeholder="Internal name (e.g., bs_physics)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
          />
          <Input
            placeholder="Display name (e.g., BS Physics)"
            value={newFieldDisplayName}
            onChange={(e) => setNewFieldDisplayName(e.target.value)}
          />
          <Button
            onClick={handleAddField}
            disabled={
              addEducationField.isPending ||
              !selectedLevel ||
              !newFieldName ||
              !newFieldDisplayName
            }
            className="gap-2"
          >
            {addEducationField.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Field
          </Button>
        </div>
      </div>

      {/* Fields by Level */}
      {fieldsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {allLevels.map((level) => {
            const fields = fieldsByLevel[level.value] || [];
            return (
              <AccordionItem key={level.value} value={level.value}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{level.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {fields.length} fields
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No fields added yet. Add fields above.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-2 rounded bg-muted"
                        >
                          <span className="text-sm truncate">{field.display_name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => deleteEducationField.mutate(field.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default EducationFieldsManager;
