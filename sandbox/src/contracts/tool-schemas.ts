import { z } from 'zod';

export const FilterOperatorSchema = z.enum([
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'in',
  'contains',
  'starts_with',
  'ends_with',
  'is_null',
  'is_not_null',
  'in_relative_period',
]);

export const FilterSchema = z.object({
  field: z.string().min(1),
  op: FilterOperatorSchema,
  value: z.unknown().optional(),
});

export const PaginationInputSchema = z.object({
  page_number: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(50).default(25),
});

export const PaginationOutputSchema = z.object({
  page_number: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
  total_available: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next_page: z.boolean(),
  next_page_number: z.number().int().nullable(),
});

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

const datasourceIdSchema = z.string().regex(/^ds_[A-Z0-9]{26}$/);
const workbookIdSchema = z.string().regex(/^wb_[A-Z0-9]{26}$/);
const viewIdSchema = z.string().regex(/^vw_[A-Z0-9]{26}$/);
const queryResultIdSchema = z.string().regex(/^qr_[A-Z0-9]{26}$/);
const artifactIdSchema = z.string().regex(/^art_[A-Z0-9]{26}$/);
const fieldIdSchema = z.string().regex(/^fld_[A-Z0-9]{26}$/);

export const SearchContentInputSchema = z.object({
  query: z.string().min(1),
  content_types: z.array(z.enum(['datasource', 'workbook', 'view'])).optional(),
  page_number: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(50).default(25),
});

export const ListDatasourcesInputSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['READY', 'STALE', 'OFFLINE', 'DEGRADED']).optional(),
  freshness_state: z.enum(['CURRENT', 'STALE', 'UNKNOWN']).optional(),
  page_number: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(50).default(25),
  sort: z.enum(['name_asc', 'name_desc', 'updated_at_desc', 'updated_at_asc']).optional(),
});

export const GetDatasourceInputSchema = z.object({
  datasource_id: datasourceIdSchema,
});

export const ListWorkbooksInputSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  page_number: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(50).default(25),
  sort: z.enum(['title_asc', 'title_desc', 'updated_at_desc', 'updated_at_asc']).optional(),
});

export const GetWorkbookInputSchema = z.object({
  workbook_id: workbookIdSchema,
});

export const ListViewsInputSchema = z.object({
  query: z.string().optional(),
  workbook_id: workbookIdSchema.optional(),
  datasource_id: datasourceIdSchema.optional(),
  view_types: z.array(z.enum(['bar', 'pie', 'treemap', 'line', 'histogram'])).optional(),
  page_number: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(50).default(25),
  sort: z.enum(['title_asc', 'title_desc', 'updated_at_desc', 'updated_at_asc']).optional(),
});

export const GetViewInputSchema = z.object({
  view_id: viewIdSchema,
});

export const RunViewInputSchema = z.object({
  view_id: viewIdSchema,
  filter_overrides: z.array(FilterSchema).optional(),
});

export const SelectFieldSchema = z.object({
  field: z.string().min(1),
  aggregate: z.enum(['sum', 'avg', 'min', 'max', 'count', 'count_distinct']).optional(),
  granularity: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  alias: z.string().optional(),
});

export const OrderBySchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
});

export const QueryDatasourceInputSchema = z.object({
  datasource_id: datasourceIdSchema,
  select: z.array(SelectFieldSchema).min(1),
  filters: z.array(FilterSchema).default([]),
  group_by: z.array(z.string()).default([]),
  order_by: z.array(OrderBySchema).default([]),
  limit: z.number().int().min(1).max(200).default(200),
});

export const ExportQueryResultInputSchema = z.object({
  query_result_id: queryResultIdSchema,
  format: z.enum(['csv', 'json']),
});

export const RenderViewInputSchema = z.object({
  view_id: viewIdSchema,
  format: z.enum(['png', 'svg']),
  width: z.number().int().min(100).max(4096).default(1280),
  height: z.number().int().min(100).max(4096).default(720),
  filter_overrides: z.array(FilterSchema).optional(),
});

export const ExportViewDataInputSchema = z.object({
  view_id: viewIdSchema,
  filter_overrides: z.array(FilterSchema).optional(),
  include_headers: z.boolean().default(true),
});

export const SearchResultItemSchema = z.object({
  entity_type: z.enum(['datasource', 'workbook', 'view']),
  id: z.string(),
  title: z.string(),
  description_snippet: z.string(),
  parent_workbook_id: z.string().nullable(),
  datasource_id: z.string().nullable(),
  match_score: z.number().min(0).max(1),
});

export const SearchContentOutputSchema = z.object({
  results: z.array(SearchResultItemSchema),
  pagination: PaginationOutputSchema,
});

export const DatasourceSummarySchema = z.object({
  datasource_id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['READY', 'STALE', 'OFFLINE', 'DEGRADED']),
  freshness_state: z.enum(['CURRENT', 'STALE', 'UNKNOWN']),
  row_count_estimate: z.number().int().min(0),
  field_count: z.number().int().min(0),
  updated_at: z.string().datetime(),
});

export const ListDatasourcesOutputSchema = z.object({
  items: z.array(DatasourceSummarySchema),
  pagination: PaginationOutputSchema,
});

export const DatasourceFieldSchema = z.object({
  field_id: z.string(),
  field_name: z.string(),
  display_name: z.string(),
  data_type: z.enum(['string', 'integer', 'decimal', 'boolean', 'date', 'datetime']),
  semantic_role: z.enum(['dimension', 'measure', 'date', 'identifier', 'category', 'currency', 'percentage']),
  description: z.string(),
  is_filterable: z.boolean(),
  is_groupable: z.boolean(),
  is_aggregatable: z.boolean(),
  allowed_aggregations: z.array(z.string()),
});

export const GetDatasourceOutputSchema = z.object({
  datasource_id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  status: z.enum(['READY', 'STALE', 'OFFLINE', 'DEGRADED']),
  freshness_state: z.enum(['CURRENT', 'STALE', 'UNKNOWN']),
  row_count_estimate: z.number().int(),
  default_table_name: z.string(),
  fields: z.array(DatasourceFieldSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const WorkbookSummarySchema = z.object({
  workbook_id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  view_count: z.number().int().min(0),
  updated_at: z.string().datetime(),
});

export const ListWorkbooksOutputSchema = z.object({
  items: z.array(WorkbookSummarySchema),
  pagination: PaginationOutputSchema,
});

export const ViewSummaryInWorkbookSchema = z.object({
  view_id: z.string(),
  title: z.string(),
  view_type: z.enum(['bar', 'pie', 'treemap', 'line', 'histogram']),
  datasource_id: z.string(),
  description: z.string(),
  status: z.enum(['READY', 'STALE', 'OFFLINE', 'DEGRADED']),
});

export const GetWorkbookOutputSchema = z.object({
  workbook_id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string(),
  views: z.array(ViewSummaryInWorkbookSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ViewSummarySchema = z.object({
  view_id: z.string(),
  title: z.string(),
  view_type: z.enum(['bar', 'pie', 'treemap', 'line', 'histogram']),
  workbook_id: z.string(),
  datasource_id: z.string(),
  status: z.enum(['READY', 'STALE', 'OFFLINE', 'DEGRADED']),
  updated_at: z.string().datetime(),
});

export const ListViewsOutputSchema = z.object({
  items: z.array(ViewSummarySchema),
  pagination: PaginationOutputSchema,
});

export const AllowedFilterOverrideSchema = z.object({
  field_name: z.string(),
  display_name: z.string(),
  data_type: z.string(),
  allowed_operators: z.array(z.string()),
  default_value: z.unknown().nullable(),
  is_required: z.boolean(),
});

export const GetViewOutputSchema = z.object({
  view_id: z.string(),
  title: z.string(),
  description: z.string(),
  view_type: z.enum(['bar', 'pie', 'treemap', 'line', 'histogram']),
  workbook_id: z.string(),
  datasource_id: z.string(),
  x_axis_label: z.string().nullable(),
  y_axis_label: z.string().nullable(),
  status: z.enum(['READY', 'STALE', 'OFFLINE', 'DEGRADED']),
  default_filters: z.array(FilterSchema),
  supported_filter_overrides: z.array(AllowedFilterOverrideSchema),
  last_refresh_at: z.string().datetime().nullable(),
});

export const SeriesPointSchema = z.object({
  x: z.unknown(),
  y: z.number(),
});

export const SeriesSchema = z.object({
  name: z.string(),
  points: z.array(SeriesPointSchema),
});

export const SummaryStatisticsSchema = z.object({
  min: z.number(),
  max: z.number(),
  average: z.number(),
  trend: z.enum(['up', 'down', 'flat', 'volatile']),
});

export const RunViewOutputSchema = z.object({
  view_id: z.string(),
  title: z.string(),
  view_type: z.enum(['bar', 'pie', 'treemap', 'line', 'histogram']),
  axes: z.object({
    x_label: z.string().nullable(),
    y_label: z.string().nullable(),
  }),
  resolved_filters: z.array(FilterSchema),
  series: z.array(SeriesSchema),
  summary_statistics: SummaryStatisticsSchema,
  warnings: z.array(z.string()),
});

export const QueryColumnSchema = z.object({
  name: z.string(),
  data_type: z.string(),
  alias: z.string().optional(),
});

export const QueryDatasourceOutputSchema = z.object({
  query_result_id: queryResultIdSchema,
  columns: z.array(QueryColumnSchema),
  rows: z.array(z.array(z.unknown())),
  total_rows: z.number().int().min(0),
  returned_rows: z.number().int().min(0),
  truncated: z.boolean(),
});

export const ArtifactOutputSchema = z.object({
  artifact_id: artifactIdSchema,
  format: z.string(),
  mime_type: z.string(),
  path: z.string(),
  byte_size: z.number().int().min(0).nullable(),
  generated_at: z.string().datetime(),
});

export const ExportQueryResultOutputSchema = ArtifactOutputSchema.extend({
  query_result_id: queryResultIdSchema,
});

export const RenderViewOutputSchema = ArtifactOutputSchema.extend({
  view_id: viewIdSchema,
  width: z.number().int(),
  height: z.number().int(),
  resolved_filters: z.array(FilterSchema),
});

export const ExportViewDataOutputSchema = ArtifactOutputSchema.extend({
  view_id: viewIdSchema,
  resolved_filters: z.array(FilterSchema),
});
