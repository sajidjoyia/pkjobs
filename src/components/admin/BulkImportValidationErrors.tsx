import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  GraduationCap,
  AlertTriangle,
  XCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface MissingEducationField {
  name: string;
  suggestedLevel: string;
}

interface SkippedJob {
  title: string;
  reasons: string[];
}

interface BulkImportValidationErrorsProps {
  errors: string[];
  skippedJobs: SkippedJob[];
  missingEducationFields: MissingEducationField[];
  validJobsCount: number;
  educationLevels: { value: string; label: string }[];
  onOpenEducationManager: () => void;
}

const CopyableField = ({ value, className = "" }: { value: string; className?: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`Copied "${value}" to clipboard`);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-muted hover:bg-muted/80 rounded text-xs font-mono cursor-pointer transition-colors group ${className}`}
      title="Click to copy"
    >
      <span>{value}</span>
      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
    </button>
  );
};

export const BulkImportValidationErrors = ({
  errors,
  skippedJobs,
  missingEducationFields,
  validJobsCount,
  educationLevels,
  onOpenEducationManager,
}: BulkImportValidationErrorsProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    skipped: true,
    missing: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyAllMissingFields = () => {
    const fieldNames = missingEducationFields.map(f => f.name).join("\n");
    navigator.clipboard.writeText(fieldNames);
    toast.success(`Copied ${missingEducationFields.length} field names to clipboard`);
  };

  const hasErrors = errors.length > 0;
  const hasSkipped = skippedJobs.length > 0;
  const hasMissing = missingEducationFields.length > 0;
  const hasAnyIssues = hasErrors || hasSkipped || hasMissing;

  if (!hasAnyIssues && validJobsCount === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Jobs Found</AlertTitle>
        <AlertDescription>
          No valid jobs were found in the text. Make sure each job starts with "Title:" on a new line.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center gap-4 text-sm">
        {validJobsCount > 0 && (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle className="h-4 w-4" />
            <span>{validJobsCount} valid</span>
          </div>
        )}
        {hasSkipped && (
          <div className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>{skippedJobs.length} skipped</span>
          </div>
        )}
        {hasErrors && (
          <div className="flex items-center gap-1.5 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{errors.length} errors</span>
          </div>
        )}
        {hasMissing && (
          <div className="flex items-center gap-1.5 text-destructive">
            <GraduationCap className="h-4 w-4" />
            <span>{missingEducationFields.length} missing fields</span>
          </div>
        )}
      </div>

      {/* Missing Education Fields Section */}
      {hasMissing && (
        <Alert variant="destructive" className="border-destructive/50">
          <Collapsible 
            open={expandedSections.missing} 
            onOpenChange={() => toggleSection("missing")}
          >
            <div className="flex items-start gap-2">
              <GraduationCap className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <AlertTitle className="flex-1">
                    {missingEducationFields.length} Missing Education Field{missingEducationFields.length > 1 ? 's' : ''}
                  </AlertTitle>
                  {expandedSections.missing ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <AlertDescription className="mt-1">
                  These education fields are not in the system. Add them via "Manage Education" before importing.
                </AlertDescription>
                
                <CollapsibleContent className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Click any field name to copy</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyAllMissingFields}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy All
                    </Button>
                  </div>
                  
                  <div className="rounded-md border border-destructive/30 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-destructive/10">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Field Name</th>
                          <th className="text-left px-3 py-2 font-medium">Suggested Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {missingEducationFields.map((field, i) => (
                          <tr key={i} className="bg-background/50">
                            <td className="px-3 py-2">
                              <CopyableField value={field.name} />
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {educationLevels.find(l => l.value === field.suggestedLevel)?.label || field.suggestedLevel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onOpenEducationManager}
                    className="gap-2"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Open Education Manager
                  </Button>
                </CollapsibleContent>
              </div>
            </div>
          </Collapsible>
        </Alert>
      )}

      {/* Parse Errors Section */}
      {hasErrors && (
        <Alert variant="destructive">
          <Collapsible 
            open={expandedSections.errors} 
            onOpenChange={() => toggleSection("errors")}
          >
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <AlertTitle className="flex-1">
                    {errors.length} Parse Error{errors.length > 1 ? 's' : ''}
                  </AlertTitle>
                  {expandedSections.errors ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <AlertDescription className="mt-1">
                  These jobs could not be parsed due to missing required fields.
                </AlertDescription>
                
                <CollapsibleContent className="mt-3">
                  <ul className="space-y-1 text-sm">
                    {errors.map((error, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </div>
            </div>
          </Collapsible>
        </Alert>
      )}

      {/* Skipped Jobs Section */}
      {hasSkipped && (
        <Alert className="border-warning/50 bg-warning/5">
          <Collapsible 
            open={expandedSections.skipped} 
            onOpenChange={() => toggleSection("skipped")}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
              <div className="flex-1">
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <AlertTitle className="flex-1 text-warning">
                    {skippedJobs.length} Job{skippedJobs.length > 1 ? 's' : ''} Skipped
                  </AlertTitle>
                  {expandedSections.skipped ? (
                    <ChevronDown className="h-4 w-4 text-warning" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-warning" />
                  )}
                </CollapsibleTrigger>
                <AlertDescription className="mt-1 text-muted-foreground">
                  These jobs have validation errors and will not be imported.
                </AlertDescription>
                
                <CollapsibleContent className="mt-3 space-y-2">
                  {skippedJobs.map((job, i) => (
                    <div 
                      key={i} 
                      className="p-3 bg-background border border-warning/30 rounded-md"
                    >
                      <p className="font-medium text-sm mb-1">{job.title}</p>
                      <ul className="space-y-0.5">
                        {job.reasons.map((reason, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-warning">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CollapsibleContent>
              </div>
            </div>
          </Collapsible>
        </Alert>
      )}
    </div>
  );
};

export default BulkImportValidationErrors;
