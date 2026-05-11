# Workflow-to-Tool Map

## W1 Explore datasources

`search_content` -> `list_datasources` -> `get_datasource`

## W2 Explore workbooks

`search_content` or `list_workbooks` -> `get_workbook`

## W3 Run a filtered view

`get_view` -> `run_view`

## W4 Query tabular data and export

`get_datasource` -> `query_datasource` -> `export_query_result`

## W5 Compare periods

Run the same `query_datasource` or `run_view` request twice with different date filters.

## W6 Inspect chart details

`get_view` -> `run_view`

## W7 Render chart artifacts

`get_view` -> `render_view`

## W8 Export raw rows behind a view

`get_view` -> `export_view_data`

## Notes

- Metadata tools are read-only and can return empty sets.
- Execution tools can fail with deterministic state errors (`DATASOURCE_OFFLINE`, `STALE_DATA`).
- Rendering/export tools return paths and metadata, not inline files.
