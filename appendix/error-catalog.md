# Error Catalog

## Envelope

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "The filter is not valid.",
    "details": {}
  }
}
```

## Rules

- Empty result sets are successful responses.
- Pagination uses `page_number >= 1` and `1 <= page_size <= 50`.
- Query `limit` must be `1..200`.

## Codes by meaning

| Code | Meaning |
| --- | --- |
| `QUERY_REQUIRED` | Missing or empty search query |
| `INVALID_PAGE` | Invalid `page_number` |
| `INVALID_PAGE_SIZE` | Invalid `page_size` |
| `INVALID_SORT_FIELD` | Unsupported sort value |
| `INVALID_CONTENT_TYPE` | Unsupported `content_types` value |
| `DATASOURCE_NOT_FOUND` | Datasource does not exist |
| `WORKBOOK_NOT_FOUND` | Workbook does not exist |
| `VIEW_NOT_FOUND` | View does not exist |
| `QUERY_RESULT_NOT_FOUND` | Query result does not exist |
| `INVALID_FILTER` | Invalid filter shape or value |
| `UNSUPPORTED_FIELD` | Field is not available in the current context |
| `UNSUPPORTED_AGGREGATION` | Aggregate not allowed for the field |
| `INVALID_QUERY_LIMIT` | Query limit outside allowed range |
| `INVALID_VIEW_TYPE` | Unsupported view type |
| `INVALID_FORMAT` | Unsupported export or render format |
| `DATASOURCE_OFFLINE` | Datasource cannot execute requests |
| `STALE_DATA` | Data freshness blocks execution |
| `ARTIFACT_GENERATION_FAILED` | Export or render artifact write failed |

## Codes by tool

| Tool | Error codes |
| --- | --- |
| `search_content` | `QUERY_REQUIRED`, `INVALID_PAGE`, `INVALID_PAGE_SIZE`, `INVALID_CONTENT_TYPE` |
| `list_datasources` | `INVALID_PAGE`, `INVALID_PAGE_SIZE`, `INVALID_SORT_FIELD` |
| `get_datasource` | `DATASOURCE_NOT_FOUND` |
| `list_workbooks` | `INVALID_PAGE`, `INVALID_PAGE_SIZE`, `INVALID_SORT_FIELD` |
| `get_workbook` | `WORKBOOK_NOT_FOUND` |
| `list_views` | `INVALID_PAGE`, `INVALID_PAGE_SIZE`, `INVALID_SORT_FIELD`, `INVALID_VIEW_TYPE` |
| `get_view` | `VIEW_NOT_FOUND` |
| `run_view` | `VIEW_NOT_FOUND`, `DATASOURCE_OFFLINE`, `INVALID_FILTER`, `UNSUPPORTED_FIELD`, `STALE_DATA` |
| `query_datasource` | `DATASOURCE_NOT_FOUND`, `DATASOURCE_OFFLINE`, `INVALID_FILTER`, `UNSUPPORTED_FIELD`, `UNSUPPORTED_AGGREGATION`, `INVALID_QUERY_LIMIT` |
| `export_query_result` | `QUERY_RESULT_NOT_FOUND`, `INVALID_FORMAT`, `ARTIFACT_GENERATION_FAILED` |
| `render_view` | `VIEW_NOT_FOUND`, `DATASOURCE_OFFLINE`, `INVALID_FILTER`, `INVALID_FORMAT`, `ARTIFACT_GENERATION_FAILED` |
| `export_view_data` | `VIEW_NOT_FOUND`, `DATASOURCE_OFFLINE`, `INVALID_FILTER`, `ARTIFACT_GENERATION_FAILED` |
