import { describe, it, expect } from 'vitest';
import {
  SearchContentInputSchema,
  SearchContentOutputSchema,
  ListDatasourcesInputSchema,
  ListDatasourcesOutputSchema,
  GetDatasourceInputSchema,
  GetDatasourceOutputSchema,
  ListWorkbooksInputSchema,
  ListWorkbooksOutputSchema,
  GetWorkbookInputSchema,
  GetWorkbookOutputSchema,
  ListViewsInputSchema,
  ListViewsOutputSchema,
  GetViewInputSchema,
  GetViewOutputSchema,
  RunViewInputSchema,
  RunViewOutputSchema,
  QueryDatasourceInputSchema,
  QueryDatasourceOutputSchema,
  ExportQueryResultInputSchema,
  ExportQueryResultOutputSchema,
  RenderViewInputSchema,
  RenderViewOutputSchema,
  ExportViewDataInputSchema,
  ExportViewDataOutputSchema,
  FilterSchema,
  PaginationOutputSchema,
  ErrorEnvelopeSchema,
} from '../contracts/tool-schemas.js';
const DS_ID = 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A';
const WB_ID = 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5';
const VW_ID = 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK';
const QR_ID = 'qr_01JTK9K5F9BN3S5U4ZA5HD2WM6';
const ART_ID = 'art_01JTKAN8G0CO4T6V5AB6IE3XN7';

describe('FilterSchema', () => {
  it('accepts all valid operators', () => {
    const ops = [
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
    ];
    for (const op of ops) {
      expect(() => FilterSchema.parse({ field: 'order_date', op })).not.toThrow();
    }
  });

  it('rejects unknown operator', () => {
    expect(() => FilterSchema.parse({ field: 'x', op: 'like' })).toThrow();
  });

  it('rejects empty field name', () => {
    expect(() => FilterSchema.parse({ field: '', op: 'eq' })).toThrow();
  });
});

describe('PaginationOutputSchema', () => {
  it('accepts valid pagination block', () => {
    expect(() =>
      PaginationOutputSchema.parse({
        page_number: 1,
        page_size: 25,
        total_available: 100,
        total_pages: 4,
        has_next_page: true,
        next_page_number: 2,
      }),
    ).not.toThrow();
  });

  it('accepts null next_page_number on last page', () => {
    expect(() =>
      PaginationOutputSchema.parse({
        page_number: 4,
        page_size: 25,
        total_available: 100,
        total_pages: 4,
        has_next_page: false,
        next_page_number: null,
      }),
    ).not.toThrow();
  });
});

describe('ErrorEnvelopeSchema', () => {
  it('accepts valid error envelope', () => {
    expect(() =>
      ErrorEnvelopeSchema.parse({
        error: {
          code: 'INVALID_FILTER',
          message: 'The filter is not valid.',
          details: { field: 'store_name', op: 'between' },
        },
      }),
    ).not.toThrow();
  });

  it('accepts error without details', () => {
    expect(() =>
      ErrorEnvelopeSchema.parse({
        error: { code: 'DATASOURCE_NOT_FOUND', message: 'Not found.' },
      }),
    ).not.toThrow();
  });
});

describe('search_content', () => {
  it('input: requires query', () => {
    expect(() => SearchContentInputSchema.parse({})).toThrow();
  });

  it('input: rejects empty query', () => {
    expect(() => SearchContentInputSchema.parse({ query: '' })).toThrow();
  });

  it('input: accepts valid minimal input', () => {
    expect(() => SearchContentInputSchema.parse({ query: 'revenue' })).not.toThrow();
  });

  it('input: accepts all content_types', () => {
    expect(() =>
      SearchContentInputSchema.parse({
        query: 'test',
        content_types: ['datasource', 'workbook', 'view'],
      }),
    ).not.toThrow();
  });

  it('input: rejects invalid content_type', () => {
    expect(() =>
      SearchContentInputSchema.parse({
        query: 'test',
        content_types: ['dashboard'],
      }),
    ).toThrow();
  });

  it('input: rejects page_size > 50', () => {
    expect(() => SearchContentInputSchema.parse({ query: 'test', page_size: 51 })).toThrow();
  });

  it('input: rejects page_number < 1', () => {
    expect(() => SearchContentInputSchema.parse({ query: 'test', page_number: 0 })).toThrow();
  });

  it('output: accepts valid result', () => {
    expect(() =>
      SearchContentOutputSchema.parse({
        results: [
          {
            entity_type: 'view',
            id: VW_ID,
            title: 'Q1 Revenue by Region',
            description_snippet: 'Bar chart...',
            parent_workbook_id: WB_ID,
            datasource_id: DS_ID,
            match_score: 0.94,
          },
        ],
        pagination: {
          page_number: 1,
          page_size: 25,
          total_available: 1,
          total_pages: 1,
          has_next_page: false,
          next_page_number: null,
        },
      }),
    ).not.toThrow();
  });

  it('output: accepts empty results', () => {
    expect(() =>
      SearchContentOutputSchema.parse({
        results: [],
        pagination: {
          page_number: 1,
          page_size: 25,
          total_available: 0,
          total_pages: 0,
          has_next_page: false,
          next_page_number: null,
        },
      }),
    ).not.toThrow();
  });
});

describe('list_datasources', () => {
  it('input: accepts empty input (all optional)', () => {
    expect(() => ListDatasourcesInputSchema.parse({})).not.toThrow();
  });

  it('input: accepts status filter', () => {
    expect(() => ListDatasourcesInputSchema.parse({ status: 'OFFLINE' })).not.toThrow();
  });

  it('input: rejects invalid status', () => {
    expect(() => ListDatasourcesInputSchema.parse({ status: 'ARCHIVED' })).toThrow();
  });

  it('output: matches summary schema', () => {
    expect(() =>
      ListDatasourcesOutputSchema.parse({
        items: [
          {
            datasource_id: DS_ID,
            name: 'Sales Performance',
            description: 'Daily sales data.',
            status: 'READY',
            freshness_state: 'CURRENT',
            row_count_estimate: 14400,
            field_count: 12,
            updated_at: '2026-04-30T06:00:00.000Z',
          },
        ],
        pagination: {
          page_number: 1,
          page_size: 25,
          total_available: 1,
          total_pages: 1,
          has_next_page: false,
          next_page_number: null,
        },
      }),
    ).not.toThrow();
  });
});

describe('get_datasource', () => {
  it('input: requires datasource_id', () => {
    expect(() => GetDatasourceInputSchema.parse({})).toThrow();
  });

  it('input: validates id prefix', () => {
    expect(() => GetDatasourceInputSchema.parse({ datasource_id: 'wb_invalid' })).toThrow();
    expect(() => GetDatasourceInputSchema.parse({ datasource_id: DS_ID })).not.toThrow();
  });

  it('output: includes fields array', () => {
    const result = {
      datasource_id: DS_ID,
      name: 'Sales Performance',
      slug: 'sales-performance',
      description: 'Daily sales data.',
      status: 'READY',
      freshness_state: 'CURRENT',
      row_count_estimate: 14400,
      default_table_name: 'fact_sales_daily',
      fields: [
        {
          field_id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1A',
          field_name: 'order_date',
          display_name: 'Order Date',
          data_type: 'date',
          semantic_role: 'date',
          description: 'Calendar date of the sale.',
          is_filterable: true,
          is_groupable: true,
          is_aggregatable: false,
          allowed_aggregations: [],
        },
      ],
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2026-04-30T06:00:00.000Z',
    };
    expect(() => GetDatasourceOutputSchema.parse(result)).not.toThrow();
  });
});

describe('list_workbooks', () => {
  it('input: all optional', () => {
    expect(() => ListWorkbooksInputSchema.parse({})).not.toThrow();
  });

  it('output: includes view_count', () => {
    expect(() =>
      ListWorkbooksOutputSchema.parse({
        items: [
          {
            workbook_id: WB_ID,
            title: 'Executive Monday Review',
            description: 'Weekly exec summary.',
            category: 'Executive',
            view_count: 5,
            updated_at: '2026-04-28T00:00:00.000Z',
          },
        ],
        pagination: {
          page_number: 1,
          page_size: 25,
          total_available: 1,
          total_pages: 1,
          has_next_page: false,
          next_page_number: null,
        },
      }),
    ).not.toThrow();
  });
});

describe('get_workbook', () => {
  it('input: requires workbook_id with wb_ prefix', () => {
    expect(() => GetWorkbookInputSchema.parse({ workbook_id: 'ds_invalid' })).toThrow();
    expect(() => GetWorkbookInputSchema.parse({ workbook_id: WB_ID })).not.toThrow();
  });

  it('output: includes views list', () => {
    expect(() =>
      GetWorkbookOutputSchema.parse({
        workbook_id: WB_ID,
        title: 'Executive Monday Review',
        slug: 'executive-monday-review',
        description: 'Weekly exec summary.',
        category: 'Executive',
        views: [
          {
            view_id: VW_ID,
            title: 'Q1 Revenue by Region',
            view_type: 'bar',
            datasource_id: DS_ID,
            description: 'Bar chart...',
            status: 'READY',
          },
        ],
        created_at: '2025-01-10T00:00:00.000Z',
        updated_at: '2026-04-28T00:00:00.000Z',
      }),
    ).not.toThrow();
  });
});

describe('list_views', () => {
  it('input: accepts view_types array', () => {
    expect(() => ListViewsInputSchema.parse({ view_types: ['bar', 'line'] })).not.toThrow();
  });

  it('input: rejects invalid view_type', () => {
    expect(() => ListViewsInputSchema.parse({ view_types: ['scatter'] })).toThrow();
  });
});

describe('get_view', () => {
  it('input: requires vw_ prefix', () => {
    expect(() => GetViewInputSchema.parse({ view_id: 'ds_bad' })).toThrow();
    expect(() => GetViewInputSchema.parse({ view_id: VW_ID })).not.toThrow();
  });

  it('output: includes supported_filter_overrides', () => {
    expect(() =>
      GetViewOutputSchema.parse({
        view_id: VW_ID,
        title: 'Q1 Revenue by Region',
        description: 'Bar chart.',
        view_type: 'bar',
        workbook_id: WB_ID,
        datasource_id: DS_ID,
        x_axis_label: 'Region',
        y_axis_label: 'Net Revenue',
        status: 'READY',
        default_filters: [{ field: 'order_date', op: 'between', value: ['2026-01-01', '2026-03-31'] }],
        supported_filter_overrides: [
          {
            field_name: 'order_date',
            display_name: 'Order Date',
            data_type: 'date',
            allowed_operators: ['between', 'in_relative_period'],
            default_value: ['2026-01-01', '2026-03-31'],
            is_required: true,
          },
        ],
        last_refresh_at: '2026-04-28T00:00:00.000Z',
      }),
    ).not.toThrow();
  });
});

describe('run_view', () => {
  it('input: filter_overrides are optional', () => {
    expect(() => RunViewInputSchema.parse({ view_id: VW_ID })).not.toThrow();
  });

  it('output: trend must be one of up/down/flat/volatile', () => {
    const base = {
      view_id: VW_ID,
      title: 'Q1 Revenue by Region',
      view_type: 'bar',
      axes: { x_label: 'Region', y_label: 'Net Revenue' },
      resolved_filters: [],
      series: [{ name: 'Revenue', points: [{ x: 'East', y: 2150000.25 }] }],
      summary_statistics: { min: 1000, max: 2000, average: 1500, trend: 'flat' },
      warnings: [],
    };
    expect(() => RunViewOutputSchema.parse(base)).not.toThrow();

    const badTrend = { ...base, summary_statistics: { ...base.summary_statistics, trend: 'rising' } };
    expect(() => RunViewOutputSchema.parse(badTrend)).toThrow();
  });
});

describe('query_datasource', () => {
  it('input: requires at least one select field', () => {
    expect(() => QueryDatasourceInputSchema.parse({ datasource_id: DS_ID, select: [] })).toThrow();
  });

  it('input: limit must be 1–200', () => {
    expect(() =>
      QueryDatasourceInputSchema.parse({
        datasource_id: DS_ID,
        select: [{ field: 'net_revenue', aggregate: 'sum' }],
        limit: 201,
      }),
    ).toThrow();
    expect(() =>
      QueryDatasourceInputSchema.parse({
        datasource_id: DS_ID,
        select: [{ field: 'net_revenue', aggregate: 'sum' }],
        limit: 0,
      }),
    ).toThrow();
    expect(() =>
      QueryDatasourceInputSchema.parse({
        datasource_id: DS_ID,
        select: [{ field: 'net_revenue', aggregate: 'sum' }],
        limit: 200,
      }),
    ).not.toThrow();
  });

  it('input: rejects invalid aggregate', () => {
    expect(() =>
      QueryDatasourceInputSchema.parse({
        datasource_id: DS_ID,
        select: [{ field: 'net_revenue', aggregate: 'median' }],
      }),
    ).toThrow();
  });

  it('output: includes query_result_id with qr_ prefix', () => {
    expect(() =>
      QueryDatasourceOutputSchema.parse({
        query_result_id: QR_ID,
        columns: [
          { name: 'order_month', data_type: 'date' },
          { name: 'revenue', data_type: 'decimal' },
        ],
        rows: [
          ['2026-01', 2150000.25],
          ['2026-02', 1934200.1],
        ],
        total_rows: 2,
        returned_rows: 2,
        truncated: false,
      }),
    ).not.toThrow();
  });
});

describe('export_query_result', () => {
  it('input: format must be csv or json', () => {
    expect(() => ExportQueryResultInputSchema.parse({ query_result_id: QR_ID, format: 'xlsx' })).toThrow();
    expect(() => ExportQueryResultInputSchema.parse({ query_result_id: QR_ID, format: 'csv' })).not.toThrow();
    expect(() => ExportQueryResultInputSchema.parse({ query_result_id: QR_ID, format: 'json' })).not.toThrow();
  });

  it('output: includes path and mime_type', () => {
    expect(() =>
      ExportQueryResultOutputSchema.parse({
        artifact_id: ART_ID,
        query_result_id: QR_ID,
        format: 'csv',
        mime_type: 'text/csv',
        path: `/exports/queries/${QR_ID}.csv`,
        byte_size: 2048,
        generated_at: '2026-04-30T10:00:00.000Z',
      }),
    ).not.toThrow();
  });
});

describe('render_view', () => {
  it('input: format must be png or svg', () => {
    expect(() => RenderViewInputSchema.parse({ view_id: VW_ID, format: 'jpg' })).toThrow();
    expect(() => RenderViewInputSchema.parse({ view_id: VW_ID, format: 'png' })).not.toThrow();
    expect(() => RenderViewInputSchema.parse({ view_id: VW_ID, format: 'svg' })).not.toThrow();
  });

  it('input: width and height defaults are applied', () => {
    const parsed = RenderViewInputSchema.parse({ view_id: VW_ID, format: 'png' });
    expect(parsed.width).toBe(1280);
    expect(parsed.height).toBe(720);
  });

  it('output: includes resolved_filters and dimensions', () => {
    expect(() =>
      RenderViewOutputSchema.parse({
        artifact_id: ART_ID,
        view_id: VW_ID,
        format: 'png',
        mime_type: 'image/png',
        path: `/renders/views/${VW_ID}/a3f8b2c1.png`,
        byte_size: 98304,
        generated_at: '2026-04-30T10:05:00.000Z',
        width: 1280,
        height: 720,
        resolved_filters: [{ field: 'order_date', op: 'between', value: ['2026-01-01', '2026-03-31'] }],
      }),
    ).not.toThrow();
  });
});

describe('export_view_data', () => {
  it('input: include_headers defaults to true', () => {
    const parsed = ExportViewDataInputSchema.parse({ view_id: VW_ID });
    expect(parsed.include_headers).toBe(true);
  });

  it('output: includes artifact_id and path', () => {
    expect(() =>
      ExportViewDataOutputSchema.parse({
        artifact_id: ART_ID,
        view_id: VW_ID,
        format: 'csv',
        mime_type: 'text/csv',
        path: `/exports/views/${VW_ID}/b4c9d3e2.csv`,
        byte_size: 45000,
        generated_at: '2026-04-30T10:10:00.000Z',
        resolved_filters: [],
      }),
    ).not.toThrow();
  });
});

describe('ID prefix enforcement', () => {
  it('ds_ prefix required for datasource operations', () => {
    expect(() => GetDatasourceInputSchema.parse({ datasource_id: 'wb_ABCDEFGHIJKLMNOPQRSTUVWXYZ01' })).toThrow();
  });

  it('wb_ prefix required for workbook operations', () => {
    expect(() => GetWorkbookInputSchema.parse({ workbook_id: 'ds_ABCDEFGHIJKLMNOPQRSTUVWXYZ01' })).toThrow();
  });

  it('vw_ prefix required for view operations', () => {
    expect(() => GetViewInputSchema.parse({ view_id: 'ds_ABCDEFGHIJKLMNOPQRSTUVWXYZ01' })).toThrow();
  });

  it('qr_ prefix required for query result operations', () => {
    expect(() =>
      ExportQueryResultInputSchema.parse({ query_result_id: 'ds_ABCDEFGHIJKLMNOPQRSTUVWXYZ01', format: 'csv' }),
    ).toThrow();
  });
});
