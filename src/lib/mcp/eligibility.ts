/** Standalone copy of the app's eligibility rules for MCP tools (no React deps). */

export const LEVEL_RANK: Record<string, number> = {
  matric: 1,
  intermediate: 2,
  bachelor: 3,
  master: 4,
  phd: 5,
};

export function educationRank(level: string | null | undefined): number {
  return (level && LEVEL_RANK[level]) || 0;
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export type EligibilityProfile = {
  date_of_birth: string | null;
  gender: string | null;
  education: string | null;
  province: string | null;
  domicile: string | null;
};

export type EligibilityJob = {
  min_age: number;
  max_age: number;
  gender_requirement: string | null;
  required_education_levels: string[] | null;
  required_education_fields: string[] | null;
  provinces: string[] | null;
  domicile: string | null;
  last_date?: string | null;
  is_active?: boolean | null;
};

export type UserEducation = { education_level: string; education_field_id: string | null };
export type EducationField = { id: string; education_level: string; display_name?: string | null };

export type EligibilityCheck = {
  criterion: string;
  passed: boolean;
  requirement: string;
  your_value: string;
  reason: string;
};

export function evaluateEligibility(
  profile: EligibilityProfile,
  job: EligibilityJob,
  userEducations: UserEducation[] = [],
  allEducationFields: EducationField[] = []
): { eligible: boolean; checks: EligibilityCheck[]; passed_reasons: string[]; failed_reasons: string[] } {
  const checks: EligibilityCheck[] = [];
  const requiredLevels = job.required_education_levels || [];
  const requiredFields = job.required_education_fields || [];
  const jobProvinces = job.provinces || [];

  // Age
  if (profile.date_of_birth) {
    const age = calculateAge(profile.date_of_birth);
    const passed = age >= job.min_age && age <= job.max_age;
    checks.push({
      criterion: "age",
      passed,
      requirement: `${job.min_age}-${job.max_age} years`,
      your_value: `${age} years`,
      reason: passed
        ? `Your age (${age}) is within the allowed range ${job.min_age}-${job.max_age}.`
        : `Your age (${age}) is outside the allowed range ${job.min_age}-${job.max_age}.`,
    });
  } else {
    checks.push({
      criterion: "age",
      passed: true,
      requirement: `${job.min_age}-${job.max_age} years`,
      your_value: "unknown (date of birth missing)",
      reason: "Age could not be verified because your date of birth is missing from your profile.",
    });
  }

  // Gender
  if (job.gender_requirement) {
    const passed = !profile.gender || job.gender_requirement === profile.gender;
    checks.push({
      criterion: "gender",
      passed,
      requirement: `${job.gender_requirement} only`,
      your_value: profile.gender ?? "unknown",
      reason: passed
        ? `This post accepts ${job.gender_requirement} candidates and your profile matches.`
        : `This post is open to ${job.gender_requirement} candidates only.`,
    });
  }

  // Education level (hierarchical)
  if (requiredLevels.length > 0) {
    const minRequiredRank = Math.min(...requiredLevels.map(educationRank));
    const userMaxRank =
      userEducations.length > 0
        ? Math.max(...userEducations.map((ue) => educationRank(ue.education_level)))
        : educationRank(profile.education);
    const userLevelName =
      userEducations.length > 0
        ? (Object.keys(LEVEL_RANK).find((k) => LEVEL_RANK[k] === userMaxRank) ?? "none")
        : (profile.education ?? "none");
    const passed = userMaxRank >= minRequiredRank && userMaxRank > 0;
    checks.push({
      criterion: "education_level",
      passed,
      requirement: requiredLevels.join(", "),
      your_value: userLevelName,
      reason: passed
        ? `Your highest education (${userLevelName}) meets or exceeds the required level (${requiredLevels.join(", ")}).`
        : `Your highest education (${userLevelName}) is below the required level (${requiredLevels.join(", ")}).`,
    });
  }

  // Education specialization / field
  if (requiredFields.length > 0) {
    const fieldNames = requiredFields.map(
      (id) => allEducationFields.find((f) => f.id === id)?.display_name ?? id
    );
    let passed = false;
    let detail = "You do not have a matching field of study for this post.";

    if (userEducations.length > 0) {
      const match = userEducations.find(
        (ue) => ue.education_field_id && requiredFields.includes(ue.education_field_id)
      );
      if (match) {
        passed = true;
        detail = `Your field of study matches one of the required specializations (${fieldNames.join(", ")}).`;
      } else {
        let maxFieldLevel = 0;
        for (const id of requiredFields) {
          const f = allEducationFields.find((x) => x.id === id);
          if (f) maxFieldLevel = Math.max(maxFieldLevel, educationRank(f.education_level));
        }
        const userMaxRank = Math.max(...userEducations.map((ue) => educationRank(ue.education_level)));
        if (maxFieldLevel > 0 && userMaxRank > maxFieldLevel) {
          passed = true;
          detail = "Your education level is higher than the required specialization level, so the field requirement is waived.";
        }
      }
    } else {
      detail = "No education entries found in your profile, so the specialization could not be matched.";
    }

    checks.push({
      criterion: "education_field",
      passed,
      requirement: fieldNames.join(", "),
      your_value: userEducations
        .map((ue) => allEducationFields.find((f) => f.id === ue.education_field_id)?.display_name ?? ue.education_level)
        .join(", ") || "none",
      reason: detail,
    });
  }

  // Province / domicile
  if (jobProvinces.length > 0) {
    const userProvince = (profile.province || "").toLowerCase();
    const normalized = jobProvinces.map((p) => p.toLowerCase());
    const passed =
      !userProvince ||
      normalized.some((p) => p.includes("all") || p.includes(userProvince) || userProvince.includes(p));
    checks.push({
      criterion: "province",
      passed,
      requirement: jobProvinces.join(", "),
      your_value: profile.province ?? "unknown",
      reason: passed
        ? `Your province (${profile.province ?? "unspecified"}) is accepted for this post.`
        : `This post is open to ${jobProvinces.join(", ")} domicile holders only.`,
    });
  }

  // Deadline / active
  if (job.last_date) {
    const open = new Date(job.last_date) >= new Date(new Date().toDateString());
    checks.push({
      criterion: "deadline",
      passed: open && job.is_active !== false,
      requirement: `Apply by ${job.last_date}`,
      your_value: new Date().toISOString().slice(0, 10),
      reason: open && job.is_active !== false
        ? `The job is still open; the last date is ${job.last_date}.`
        : `The application deadline (${job.last_date}) has passed or the job is no longer active.`,
    });
  }

  const failed = checks.filter((c) => !c.passed);
  return {
    eligible: failed.length === 0,
    checks,
    passed_reasons: checks.filter((c) => c.passed).map((c) => c.reason),
    failed_reasons: failed.map((c) => c.reason),
  };
}
