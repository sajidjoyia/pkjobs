# Project rules

- Keep homepage content in the existing Index and lazily imported below-fold module, with homepage-scoped semantic editorial tokens; this preserves other screens and initial loading performance.
- Keep static site metadata in index.html and homepage runtime overrides in Layout's existing GlobalSeoHead; one runtime owner avoids competing homepage metadata effects.
- Publish only real public routes in the static sitemap and maintain a factual llms.txt resource; protected account pages and unverified job URLs must not be advertised to crawlers.
- Render Browse Jobs items through a dedicated JobListingCard presentation component; keep querying, filtering, pagination and eligibility decisions in the existing page and hooks.