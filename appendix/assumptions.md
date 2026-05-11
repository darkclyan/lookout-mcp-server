# Assumptions

1. Pagination is page-based (`page_number`, `page_size`) across all list/search tools.
2. `workbook` is the canonical container term.
3. Query inputs are structured JSON objects; raw SQL is not accepted.
4. Seeded runtime behavior is deterministic, including status and freshness states.
5. Seed clock is `2026-04-30T00:00:00Z` unless overridden by runtime config.
6. Empty results are valid success responses.
7. Inline query output is capped at 200 rows.
8. Artifact generation is idempotent by normalized request hash.
9. Auth, tenancy, and row-level security are out of scope.
10. Tool responses return artifact metadata and paths, not binary payloads.
