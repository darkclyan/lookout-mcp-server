# Lookout MCP Assessment

This repository contains the contract and seed assets for an offline Lookout MCP implementation.

## What is here

- `docs/lookout-mcp-spec.md`: main technical contract
- `appendix/schema.sql`: SQLite schema
- `appendix/examples/*.json`: request and response examples
- `appendix/*.md`: supporting decisions and workflow references
- `sandbox/`: local validation and seed tooling

## Tool surface

The contract defines 12 tools:

`search_content`, `list_datasources`, `get_datasource`, `list_workbooks`, `get_workbook`, `list_views`, `get_view`, `run_view`, `query_datasource`, `export_query_result`, `render_view`, `export_view_data`.

## Local validation

```bash
cd sandbox
npm install
cp .env.example .env
npm run seed
npm run validate
```

`validate` runs typecheck, tests, and build.

## Scope

- Offline and deterministic behavior
- Structured query inputs only
- No production server implementation in this repository
