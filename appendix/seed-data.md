# Seed Data Strategy

## Seed clock

`2026-04-30T00:00:00Z`

## Dataset goals

- Offline, deterministic behavior
- Enough data for search, pagination, filtering, rendering, and export
- Stable IDs and timestamps for repeatable tests

## Inventory targets

| Entity | Target |
| --- | ---: |
| Datasources | 8 |
| Workbooks | 40 |
| Views | 220 |

## Required chart types

- `bar`
- `line`
- `pie`
- `treemap`
- `histogram`

## Status/freshness anomalies

- At least one datasource seeded as `OFFLINE`
- At least two datasources seeded as `STALE`
- Discoverability remains enabled even for non-ready sources

## Core business tables

- `fact_sales_daily`
- `fact_budget_monthly`
- `fact_inventory_daily`
- `fact_pipeline_snapshot`

Shared dimensions include date, region, store, department, and product.

## Search indexing

`content_search` is populated from datasource/workbook/view titles and descriptions during seed.

## Seeding rules

- IDs are stable prefixed strings
- Timestamps are ISO 8601 UTC strings
- Seed output is deterministic for contract validation
