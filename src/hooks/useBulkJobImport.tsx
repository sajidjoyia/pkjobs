import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ParsedJob {
  title: string;
  department: string;
  description?: string;
  required_education_levels: string[];
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
}

export const BULK_JOB_SAMPLE = `Title: Assistant Sub Inspector
Department: Punjab Police
Description: Assist in maintaining law and order
Education: matric, intermediate
Min Age: 18
Max Age: 30
Gender: male
Provinces: Punjab, Sindh
Domicile: Punjab
Total Seats: 500
Last Date: 2026-03-15
Bank Challan Fee: 500
Post Office Fee: 200
Photocopy Fee: 100
Expert Fee: 1000

---

Title: Junior Clerk
Department: Ministry of Finance
Description: Office administration and clerical work
Education: intermediate, bachelor
Min Age: 18
Max Age: 35
Gender: any
Provinces: Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad
Total Seats: 200
Last Date: 2026-04-01
Bank Challan Fee: 400
Post Office Fee: 150
Photocopy Fee: 50
Expert Fee: 800

---`;

export const parseJobsFromText = (text: string): { jobs: ParsedJob[]; errors: string[] } => {
  const jobs: ParsedJob[] = [];
  const errors: string[] = [];
  
  // Split by separator (---)
  const jobBlocks = text.split(/\n---\n/).filter(block => block.trim());
  
  jobBlocks.forEach((block, index) => {
    try {
      const lines = block.trim().split('\n');
      const jobData: Partial<ParsedJob> = {};
      
      lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;
        
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        
        switch (key) {
          case 'title':
            jobData.title = value;
            break;
          case 'department':
            jobData.department = value;
            break;
          case 'description':
            jobData.description = value;
            break;
          case 'education':
            jobData.required_education_levels = value.split(',').map(e => e.trim().toLowerCase().replace(/\s+/g, '_'));
            break;
          case 'min age':
            jobData.min_age = parseInt(value) || 18;
            break;
          case 'max age':
            jobData.max_age = parseInt(value) || 35;
            break;
          case 'gender':
            if (value.toLowerCase() === 'any' || value.toLowerCase() === 'both') {
              jobData.gender_requirement = null;
            } else if (['male', 'female', 'other'].includes(value.toLowerCase())) {
              jobData.gender_requirement = value.toLowerCase() as "male" | "female" | "other";
            }
            break;
          case 'provinces':
            jobData.provinces = value.split(',').map(p => p.trim());
            break;
          case 'domicile':
            jobData.domicile = value;
            break;
          case 'total seats':
            jobData.total_seats = parseInt(value) || 1;
            break;
          case 'last date':
            jobData.last_date = value;
            break;
          case 'bank challan fee':
            jobData.bank_challan_fee = parseInt(value) || 0;
            break;
          case 'post office fee':
            jobData.post_office_fee = parseInt(value) || 0;
            break;
          case 'photocopy fee':
            jobData.photocopy_fee = parseInt(value) || 0;
            break;
          case 'expert fee':
            jobData.expert_fee = parseInt(value) || 0;
            break;
        }
      });
      
      // Validate required fields
      if (!jobData.title) {
        errors.push(`Job ${index + 1}: Missing title`);
        return;
      }
      if (!jobData.department) {
        errors.push(`Job ${index + 1}: Missing department`);
        return;
      }
      if (!jobData.required_education_levels || jobData.required_education_levels.length === 0) {
        errors.push(`Job ${index + 1}: Missing education levels`);
        return;
      }
      if (!jobData.last_date) {
        errors.push(`Job ${index + 1}: Missing last date`);
        return;
      }
      
      jobs.push({
        title: jobData.title,
        department: jobData.department,
        description: jobData.description,
        required_education_levels: jobData.required_education_levels,
        min_age: jobData.min_age || 18,
        max_age: jobData.max_age || 35,
        gender_requirement: jobData.gender_requirement,
        provinces: jobData.provinces,
        domicile: jobData.domicile,
        total_seats: jobData.total_seats || 1,
        last_date: jobData.last_date,
        bank_challan_fee: jobData.bank_challan_fee || 0,
        post_office_fee: jobData.post_office_fee || 0,
        photocopy_fee: jobData.photocopy_fee || 0,
        expert_fee: jobData.expert_fee || 0,
      });
    } catch (e) {
      errors.push(`Job ${index + 1}: Failed to parse`);
    }
  });
  
  return { jobs, errors };
};

export const useBulkCreateJobs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobs: ParsedJob[]) => {
      const { data, error } = await supabase
        .from("jobs")
        .insert(jobs)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["all-jobs"] });
      toast.success(`Successfully created ${data.length} jobs!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
