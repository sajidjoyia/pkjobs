import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  XCircle,
  CheckCircle,
  Edit,
  Link,
  Image,
} from "lucide-react";

export interface EditableJob {
  title: string;
  department: string;
  description?: string;
  required_education_levels: string[];
  required_education_fields?: string[];
  min_age: number;
  max_age: number;
  gender_requirement?: "male" | "female" | "other" | null;
  provinces?: string[];
  domicile?: string;
  total_seats: number;
  last_date: string;
  bank_challan_fee: number;
  post_office_fee: number;
  photocopy_fee: number;
  expert_fee: number;
  advertisement_link?: string;
  advertisement_image?: string;
}

interface BulkJobPreviewEditorProps {
  jobs: EditableJob[];
  errors: string[];
  educationLevels: { value: string; label: string }[];
  educationFields: { id: string; name: string; display_name: string; education_level: string }[];
  provinceOptions: { value: string; label: string }[];
  onJobsChange: (jobs: EditableJob[]) => void;
  onImport: () => void;
  isImporting: boolean;
}

const BulkJobPreviewEditor = ({
  jobs,
  errors,
  educationLevels,
  educationFields,
  provinceOptions,
  onJobsChange,
  onImport,
  isImporting,
}: BulkJobPreviewEditorProps) => {
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>(
    () => Object.fromEntries(jobs.map((_, i) => [i, true]))
  );

  const toggleJob = (index: number) => {
    setExpandedJobs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updateJob = (index: number, updates: Partial<EditableJob>) => {
    const updated = [...jobs];
    updated[index] = { ...updated[index], ...updates };
    onJobsChange(updated);
  };

  const removeJob = (index: number) => {
    onJobsChange(jobs.filter((_, i) => i !== index));
  };

  const getFieldOptionsForLevels = (levels: string[]) => {
    return educationFields
      .filter((f) => levels.includes(f.education_level))
      .map((f) => ({
        value: f.id,
        label: `${f.display_name} (${educationLevels.find((l) => l.value === f.education_level)?.label || f.education_level})`,
      }));
  };

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            {errors.length} issue(s) found
          </p>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{err}</p>
          ))}
        </div>
      )}

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className={errors.length > 0 ? "pt-2 border-t" : ""}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-success flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {jobs.length} job{jobs.length > 1 ? "s" : ""} ready — review & edit before importing
            </p>
            <Button onClick={onImport} disabled={isImporting || jobs.length === 0} size="sm">
              {isImporting ? "Importing..." : `Import ${jobs.length} Job${jobs.length > 1 ? "s" : ""}`}
            </Button>
          </div>

          <ScrollArea className="h-[55vh] rounded-lg border">
            <div className="p-3 space-y-3">
              {jobs.map((job, i) => (
                <Collapsible key={i} open={expandedJobs[i]} onOpenChange={() => toggleJob(i)}>
                  <div className="border rounded-lg bg-card">
                    <CollapsibleTrigger className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 rounded-t-lg transition-colors">
                      {expandedJobs[i] ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{job.title || "Untitled Job"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {job.department} • {job.total_seats} seat{job.total_seats > 1 ? "s" : ""} • {job.last_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(job.required_education_levels || []).map((level, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {educationLevels.find((l) => l.value === level)?.label || level}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeJob(i); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-4 pt-2 space-y-4 border-t">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={job.title}
                              onChange={(e) => updateJob(i, { title: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Department</Label>
                            <Input
                              value={job.department}
                              onChange={(e) => updateJob(i, { department: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={job.description || ""}
                            onChange={(e) => updateJob(i, { description: e.target.value })}
                            rows={2}
                            className="text-sm"
                          />
                        </div>

                        {/* Education - Focus area */}
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                          <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                            <Edit className="h-3.5 w-3.5" />
                            Education Requirements
                          </p>
                          <div className="space-y-1">
                            <Label className="text-xs">Education Levels *</Label>
                            <MultiSelect
                              options={educationLevels}
                              selected={job.required_education_levels}
                              onChange={(selected) => {
                                // Clear invalid fields when levels change
                                const validFields = (job.required_education_fields || []).filter((fid) => {
                                  const f = educationFields.find((ef) => ef.id === fid);
                                  return f && selected.includes(f.education_level);
                                });
                                updateJob(i, {
                                  required_education_levels: selected,
                                  required_education_fields: validFields.length > 0 ? validFields : undefined,
                                });
                              }}
                              placeholder="Select education levels..."
                            />
                          </div>
                          {getFieldOptionsForLevels(job.required_education_levels).length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs">Education Fields / Specializations</Label>
                              <MultiSelect
                                options={getFieldOptionsForLevels(job.required_education_levels)}
                                selected={job.required_education_fields || []}
                                onChange={(selected) =>
                                  updateJob(i, { required_education_fields: selected.length > 0 ? selected : undefined })
                                }
                                placeholder="Any field (leave empty for all)..."
                              />
                            </div>
                          )}
                        </div>

                        {/* Eligibility */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Min Age</Label>
                            <Input
                              type="number"
                              value={job.min_age}
                              onChange={(e) => updateJob(i, { min_age: parseInt(e.target.value) || 18 })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Age</Label>
                            <Input
                              type="number"
                              value={job.max_age}
                              onChange={(e) => updateJob(i, { max_age: parseInt(e.target.value) || 35 })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Gender</Label>
                            <Select
                              value={job.gender_requirement || "any"}
                              onValueChange={(v) => updateJob(i, { gender_requirement: v === "any" ? null : (v as any) })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Seats</Label>
                            <Input
                              type="number"
                              value={job.total_seats}
                              onChange={(e) => updateJob(i, { total_seats: parseInt(e.target.value) || 1 })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Provinces</Label>
                            <MultiSelect
                              options={provinceOptions}
                              selected={job.provinces || []}
                              onChange={(selected) => updateJob(i, { provinces: selected.length > 0 ? selected : undefined })}
                              placeholder="All Pakistan"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Last Date</Label>
                            <Input
                              type="date"
                              value={job.last_date}
                              onChange={(e) => updateJob(i, { last_date: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        {/* Fees */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Challan Fee</Label>
                            <Input
                              type="number"
                              value={job.bank_challan_fee}
                              onChange={(e) => updateJob(i, { bank_challan_fee: parseInt(e.target.value) || 0 })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">PO Fee</Label>
                            <Input
                              type="number"
                              value={job.post_office_fee}
                              onChange={(e) => updateJob(i, { post_office_fee: parseInt(e.target.value) || 0 })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Photocopy</Label>
                            <Input
                              type="number"
                              value={job.photocopy_fee}
                              onChange={(e) => updateJob(i, { photocopy_fee: parseInt(e.target.value) || 0 })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Expert Fee</Label>
                            <Input
                              type="number"
                              value={job.expert_fee}
                              onChange={(e) => updateJob(i, { expert_fee: parseInt(e.target.value) || 0 })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        {/* Advertisement Link & Image */}
                        <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Link className="h-3.5 w-3.5" />
                            Advertisement Details
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Ad Link (URL)</Label>
                              <Input
                                value={job.advertisement_link || ""}
                                onChange={(e) => updateJob(i, { advertisement_link: e.target.value || undefined })}
                                placeholder="https://..."
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Ad Image URL</Label>
                              <Input
                                value={job.advertisement_image || ""}
                                onChange={(e) => updateJob(i, { advertisement_image: e.target.value || undefined })}
                                placeholder="https://..."
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          {job.advertisement_image && (
                            <img
                              src={job.advertisement_image}
                              alt="Ad preview"
                              className="h-20 rounded border object-cover"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {jobs.length === 0 && errors.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No jobs found in the pasted text.</p>
      )}
    </div>
  );
};

export default BulkJobPreviewEditor;
