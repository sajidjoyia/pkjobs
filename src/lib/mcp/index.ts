import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchJobsTool from "./tools/search-jobs";
import getJobTool from "./tools/get-job";
import listMyApplicationsTool from "./tools/list-my-applications";
import getMyProfileTool from "./tools/get-my-profile";
import applyToJobTool from "./tools/apply-to-job";
import createJobTool from "./tools/create-job";
import checkEligibilityTool from "./tools/check-eligibility";
import trackMyApplicationsTool from "./tools/track-my-applications";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "career-companion",
  title: "Career Companion",
  version: "0.1.0",
  instructions:
    "Tools for PakJobs, a Pakistani government job platform. Use `search_jobs` and `get_job` to browse listings, `get_my_profile` for the signed-in user's details, `check_my_eligibility` for a per-criterion eligibility verdict on a job, `list_my_applications` and `track_my_applications` to review application status and milestones, `apply_to_job` to submit an application, and `create_job` (admins only) to publish a new listing.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchJobsTool,
    getJobTool,
    getMyProfileTool,
    checkEligibilityTool,
    listMyApplicationsTool,
    trackMyApplicationsTool,
    applyToJobTool,
    createJobTool,
  ],
});
