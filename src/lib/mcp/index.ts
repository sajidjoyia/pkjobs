import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchJobsTool from "./tools/search-jobs";
import getJobTool from "./tools/get-job";
import listMyApplicationsTool from "./tools/list-my-applications";
import getMyProfileTool from "./tools/get-my-profile";
import applyToJobTool from "./tools/apply-to-job";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "career-companion",
  title: "Career Companion",
  version: "0.1.0",
  instructions:
    "Tools for PakJobs, a Pakistani government job platform. Use `search_jobs` and `get_job` to browse listings, `get_my_profile` to check the signed-in user's education and eligibility details, `list_my_applications` to review application status, and `apply_to_job` to submit a new application.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchJobsTool, getJobTool, getMyProfileTool, listMyApplicationsTool, applyToJobTool],
});
