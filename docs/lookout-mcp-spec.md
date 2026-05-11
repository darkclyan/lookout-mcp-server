# Lookout MCP Server Technical Specification

This document is the implementation contract for a local, offline Lookout MCP server.

## Scope

### In scope

- 12 MCP tools for discovery, metadata inspection, view execution, querying, rendering, and export
- SQLite-backed catalog and business data
- Deterministic pagination, filter validation, and error handling
- Filesystem artifact generation for CSV, JSON, PNG, and SVG

### Out of scope

- Authentication and authorization
- External APIs or cloud dependencies
- Arbitrary SQL execution from callers
- Writeback to business tables

## Runtime configuration

- `database_path`
- `artifact_root`
- `seed_clock` (default `2026-04-30T00:00:00Z`)
- `default_page_size` (default `25`)
- `max_page_size` (default `50`)
- `inline_row_cap` (default `200`)
- `default_render_width` (default `1280`)
- `default_render_height` (default `720`)

## Global conventions

### ID prefixes

- Datasource: `ds_`
- Field: `fld_`
- Workbook: `wb_`
- View: `vw_`
- Query result: `qr_`
- Artifact: `art_`

### Pagination

- `page_number` is 1-based
- `page_size` range is `1..50`
- Empty pages are valid responses

### Filter model

- Structured filters only
- Operators are validated by field type
- Relative dates resolve from `seed_clock`
- View overrides are limited by each view's allowed filter set

## Error envelope

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "The filter is not valid.",
    "details": {}
  }
}
```

### Supported error codes

`QUERY_REQUIRED`, `INVALID_PAGE`, `INVALID_PAGE_SIZE`, `INVALID_SORT_FIELD`, `INVALID_CONTENT_TYPE`, `DATASOURCE_NOT_FOUND`, `WORKBOOK_NOT_FOUND`, `VIEW_NOT_FOUND`, `QUERY_RESULT_NOT_FOUND`, `INVALID_FILTER`, `UNSUPPORTED_FIELD`, `UNSUPPORTED_AGGREGATION`, `INVALID_QUERY_LIMIT`, `INVALID_VIEW_TYPE`, `INVALID_FORMAT`, `DATASOURCE_OFFLINE`, `STALE_DATA`, `ARTIFACT_GENERATION_FAILED`.

## Tool summary

| Tool | Purpose |
| --- | --- |
| `search_content` | Cross-entity search |
| `list_datasources` | Datasource listing |
| `get_datasource` | Datasource metadata |
| `list_workbooks` | Workbook listing |
| `get_workbook` | Workbook with contained views |
| `list_views` | View listing |
| `get_view` | View metadata and filters |
| `run_view` | Execute a view and return chart-ready output |
| `query_datasource` | Execute structured tabular query |
| `export_query_result` | Export query output to CSV or JSON |
| `render_view` | Render a view to PNG or SVG |
| `export_view_data` | Export raw rows behind a view |

## Data model

### Catalog tables

- `datasource`
- `datasource_field`
- `workbook`
- `view`
- `view_allowed_filter`
- `query_run`
- `artifact`
- `content_search` (FTS5)

### Business tables

- `dim_date`
- `dim_region`
- `dim_store`
- `dim_department`
- `dim_product`
- `fact_sales_daily`
- `fact_budget_monthly`
- `fact_inventory_daily`
- `fact_pipeline_snapshot`

## Filesystem contracts

- Query exports: `/exports/queries/{query_result_id}.{csv|json}`
- View renders: `/renders/views/{view_id}/{request_hash}.{png|svg}`
- View data exports: `/exports/views/{view_id}/{request_hash}.csv`

Artifacts are idempotent by normalized request hash.

## Determinism rules

- Stable sorting and pagination behavior
- Stable error semantics
- Seeded status/freshness anomalies
- Repeat requests may reuse existing artifacts

## Implementation baseline checklist

- All 12 tools implemented with documented payloads
- All error codes reachable through deterministic scenarios
- Structured query validation based on catalog metadata
- Inline result rows capped at `200`
- Artifact paths and metadata follow this contract
