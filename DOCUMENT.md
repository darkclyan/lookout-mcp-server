# Lookout MCP Deliverable Document

This project delivers a technical specification for a Tableau-like MCP server ("Lookout") that an AI analyst can use end-to-end **without internet access**.

## Deliverable Coverage

The deliverable includes:

1. **Data model and schema**
   - Catalog entities: datasource, datasource fields, workbooks, views, allowed filters, query runs, artifacts, and search index.
   - Business entities: date, region, store, department, product, and fact tables for sales, budget, inventory, and pipeline.
   - ID formats with strict prefixes (`ds_`, `fld_`, `wb_`, `vw_`, `qr_`, `art_`).

2. **Complete MCP tool surface (12 tools)**
   - Discovery: `search_content`, `list_datasources`, `get_datasource`, `list_workbooks`, `get_workbook`, `list_views`, `get_view`
   - Execution: `run_view`, `query_datasource`
   - Export/render: `export_query_result`, `render_view`, `export_view_data`
   - Each tool has input/output contracts, deterministic errors, and usage intent in the spec/docs.

3. **Workflow-to-tool mapping**
   - W1-W8 are mapped to single tools or tool chains in `appendix/workflow-map.md`.

4. **Pagination and filter semantics**
   - Unified page-number model across list/search tools.
   - Structured filters with operator validation by field type.
   - Stable ordering, stable paging, and bounded limits.

5. **Assumptions, trade-offs, seed strategy, testing strategy**
   - Assumptions: `appendix/assumptions.md`
   - Trade-offs: `appendix/trade-offs.md`
   - Seed data strategy: `appendix/seed-data.md`
   - Error taxonomy: `appendix/error-catalog.md`
   - Contract validation tooling and tests: `sandbox/`

## Offline + AI Compatibility Requirements

To ensure the MCP server works offline for AI agents:

1. **No network dependency at runtime**
   - All behavior is backed by SQLite + local filesystem artifacts.
   - No external APIs, no live warehouse connections.

2. **Deterministic behavior**
   - Seeded clock and stable IDs.
   - Deterministic pagination, filters, and error conditions.
   - Repeatable exports/renders via normalized request hashing.

3. **Agent-friendly contracts**
   - Focused tools with clear boundaries.
   - Consistent error envelope: `{ "error": { "code", "message", "details" } }`.
   - Discovery tools return compact summaries; get/run tools provide richer detail.

4. **Mock realism**
   - Data scale and entity counts emulate a realistic BI environment.
   - Includes realistic read-only operational states (READY/STALE/OFFLINE/DEGRADED).

## Open Question 13 — Position

**Question:** Should realistic read-only failure modes (source offline, stale cache/data) be exposed to agents?

**Answer:** **Yes.** They should be explicitly modeled and returned through deterministic, typed errors.

**Why:**
- Real BI systems do fail in read-only paths; hiding this produces brittle agents.
- Agents need to learn recoverable behavior (retry, switch source/view, narrow scope, surface limitations).
- Deterministic failure modeling improves testability and prevents flaky training behavior.

**Implementation choice in this spec:**
- Datasource/view status includes `READY`, `STALE`, `OFFLINE`, `DEGRADED`.
- Execution tools (`run_view`, `query_datasource`, `render_view`, `export_view_data`) can return `DATASOURCE_OFFLINE` and `STALE_DATA` where appropriate.
- Discovery tools remain readable so agents can find alternatives when execution is blocked.
