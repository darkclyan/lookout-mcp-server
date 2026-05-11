import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  SearchContentOutputSchema,
  ListDatasourcesOutputSchema,
  GetDatasourceOutputSchema,
  ListWorkbooksOutputSchema,
  GetWorkbookOutputSchema,
  ListViewsOutputSchema,
  GetViewOutputSchema,
  QueryDatasourceOutputSchema,
  RunViewOutputSchema,
  ExportQueryResultOutputSchema,
  RenderViewOutputSchema,
  ExportViewDataOutputSchema,
  ErrorEnvelopeSchema,
  SearchContentInputSchema,
  QueryDatasourceInputSchema,
  RunViewInputSchema,
} from '../contracts/tool-schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '../../../appendix/examples');

function loadJson(filename: string): unknown {
  const raw = readFileSync(join(EXAMPLES_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

describe('All example files parse as valid JSON', () => {
  const files = readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.json'));

  it(`found at least 15 example files`, () => {
    expect(files.length).toBeGreaterThanOrEqual(15);
  });

  for (const file of files) {
    it(`${file} is valid JSON`, () => {
      expect(() => loadJson(file)).not.toThrow();
    });
  }
});

describe('search_content.request.json', () => {
  it('conforms to SearchContentInputSchema', () => {
    const data = loadJson('search_content.request.json');
    expect(() => SearchContentInputSchema.parse(data)).not.toThrow();
  });
});

describe('query_datasource.request.json', () => {
  it('conforms to QueryDatasourceInputSchema', () => {
    const data = loadJson('query_datasource.request.json');
    expect(() => QueryDatasourceInputSchema.parse(data)).not.toThrow();
  });

  it('has valid ds_ prefixed datasource_id', () => {
    const data = loadJson('query_datasource.request.json') as Record<string, unknown>;
    expect(String(data.datasource_id)).toMatch(/^ds_/);
  });
});

describe('run_view.request.json', () => {
  it('conforms to RunViewInputSchema', () => {
    const data = loadJson('run_view.request.json');
    expect(() => RunViewInputSchema.parse(data)).not.toThrow();
  });
});

describe('search_content.success.json', () => {
  it('conforms to SearchContentOutputSchema', () => {
    const data = loadJson('search_content.success.json');
    expect(() => SearchContentOutputSchema.parse(data)).not.toThrow();
  });

  it('has at least one result', () => {
    const data = loadJson('search_content.success.json') as { results: unknown[] };
    expect(data.results.length).toBeGreaterThan(0);
  });

  it('has match_scores between 0 and 1', () => {
    const data = loadJson('search_content.success.json') as { results: Array<{ match_score: number }> };
    for (const r of data.results) {
      expect(r.match_score).toBeGreaterThanOrEqual(0);
      expect(r.match_score).toBeLessThanOrEqual(1);
    }
  });
});

describe('list_datasources.success.json', () => {
  it('conforms to ListDatasourcesOutputSchema', () => {
    const data = loadJson('list_datasources.success.json');
    expect(() => ListDatasourcesOutputSchema.parse(data)).not.toThrow();
  });
});

describe('get_datasource.success.json', () => {
  it('conforms to GetDatasourceOutputSchema', () => {
    const data = loadJson('get_datasource.success.json');
    expect(() => GetDatasourceOutputSchema.parse(data)).not.toThrow();
  });

  it('datasource_id starts with ds_', () => {
    const data = loadJson('get_datasource.success.json') as { datasource_id: string };
    expect(data.datasource_id).toMatch(/^ds_/);
  });

  it('has at least one field', () => {
    const data = loadJson('get_datasource.success.json') as { fields: unknown[] };
    expect(data.fields.length).toBeGreaterThan(0);
  });

  it('all fields have allowed_aggregations array', () => {
    const data = loadJson('get_datasource.success.json') as { fields: Array<{ allowed_aggregations: unknown }> };
    for (const f of data.fields) {
      expect(Array.isArray(f.allowed_aggregations)).toBe(true);
    }
  });
});

describe('list_workbooks.success.json', () => {
  it('conforms to ListWorkbooksOutputSchema', () => {
    const data = loadJson('list_workbooks.success.json');
    expect(() => ListWorkbooksOutputSchema.parse(data)).not.toThrow();
  });
});

describe('get_workbook.success.json', () => {
  it('conforms to GetWorkbookOutputSchema', () => {
    const data = loadJson('get_workbook.success.json');
    expect(() => GetWorkbookOutputSchema.parse(data)).not.toThrow();
  });

  it('workbook_id starts with wb_', () => {
    const data = loadJson('get_workbook.success.json') as { workbook_id: string };
    expect(data.workbook_id).toMatch(/^wb_/);
  });

  it('has at least one view', () => {
    const data = loadJson('get_workbook.success.json') as { views: unknown[] };
    expect(data.views.length).toBeGreaterThan(0);
  });
});

describe('list_views.success.json', () => {
  it('conforms to ListViewsOutputSchema', () => {
    const data = loadJson('list_views.success.json');
    expect(() => ListViewsOutputSchema.parse(data)).not.toThrow();
  });
});

describe('get_view.success.json', () => {
  it('conforms to GetViewOutputSchema', () => {
    const data = loadJson('get_view.success.json');
    expect(() => GetViewOutputSchema.parse(data)).not.toThrow();
  });

  it('view_id starts with vw_', () => {
    const data = loadJson('get_view.success.json') as { view_id: string };
    expect(data.view_id).toMatch(/^vw_/);
  });

  it('has supported_filter_overrides array', () => {
    const data = loadJson('get_view.success.json') as { supported_filter_overrides: unknown[] };
    expect(Array.isArray(data.supported_filter_overrides)).toBe(true);
  });
});

describe('query_datasource.success.json', () => {
  it('conforms to QueryDatasourceOutputSchema', () => {
    const data = loadJson('query_datasource.success.json');
    expect(() => QueryDatasourceOutputSchema.parse(data)).not.toThrow();
  });

  it('query_result_id starts with qr_', () => {
    const data = loadJson('query_datasource.success.json') as { query_result_id: string };
    expect(data.query_result_id).toMatch(/^qr_/);
  });

  it('returned_rows matches rows array length', () => {
    const data = loadJson('query_datasource.success.json') as { rows: unknown[]; returned_rows: number };
    expect(data.rows.length).toBe(data.returned_rows);
  });
});

describe('run_view.success.json', () => {
  it('conforms to RunViewOutputSchema', () => {
    const data = loadJson('run_view.success.json');
    expect(() => RunViewOutputSchema.parse(data)).not.toThrow();
  });

  it('trend is one of: up, down, flat, volatile', () => {
    const data = loadJson('run_view.success.json') as { summary_statistics: { trend: string } };
    expect(['up', 'down', 'flat', 'volatile']).toContain(data.summary_statistics.trend);
  });

  it('all series have at least one point', () => {
    const data = loadJson('run_view.success.json') as { series: Array<{ points: unknown[] }> };
    for (const s of data.series) {
      expect(s.points.length).toBeGreaterThan(0);
    }
  });
});

describe('export_query_result.success.json', () => {
  it('conforms to ExportQueryResultOutputSchema', () => {
    const data = loadJson('export_query_result.success.json');
    expect(() => ExportQueryResultOutputSchema.parse(data)).not.toThrow();
  });

  it('path matches /exports/queries/ pattern', () => {
    const data = loadJson('export_query_result.success.json') as { path: string };
    expect(data.path).toMatch(/^\/exports\/queries\//);
  });

  it('artifact_id starts with art_', () => {
    const data = loadJson('export_query_result.success.json') as { artifact_id: string };
    expect(data.artifact_id).toMatch(/^art_/);
  });
});

describe('render_view.success.json', () => {
  it('conforms to RenderViewOutputSchema', () => {
    const data = loadJson('render_view.success.json');
    expect(() => RenderViewOutputSchema.parse(data)).not.toThrow();
  });

  it('path matches /renders/views/ pattern', () => {
    const data = loadJson('render_view.success.json') as { path: string };
    expect(data.path).toMatch(/^\/renders\/views\//);
  });

  it('mime_type is image/png or image/svg+xml', () => {
    const data = loadJson('render_view.success.json') as { mime_type: string };
    expect(['image/png', 'image/svg+xml']).toContain(data.mime_type);
  });
});

describe('export_view_data.success.json', () => {
  it('conforms to ExportViewDataOutputSchema', () => {
    const data = loadJson('export_view_data.success.json');
    expect(() => ExportViewDataOutputSchema.parse(data)).not.toThrow();
  });

  it('path matches /exports/views/ pattern', () => {
    const data = loadJson('export_view_data.success.json') as { path: string };
    expect(data.path).toMatch(/^\/exports\/views\//);
  });
});

describe('error.invalid_filter.json', () => {
  it('conforms to ErrorEnvelopeSchema', () => {
    const data = loadJson('error.invalid_filter.json');
    expect(() => ErrorEnvelopeSchema.parse(data)).not.toThrow();
  });

  it('code is INVALID_FILTER', () => {
    const data = loadJson('error.invalid_filter.json') as { error: { code: string } };
    expect(data.error.code).toBe('INVALID_FILTER');
  });

  it('has details with field and op', () => {
    const data = loadJson('error.invalid_filter.json') as { error: { details: Record<string, unknown> } };
    expect(data.error.details).toBeDefined();
    expect(data.error.details.field).toBeDefined();
    expect(data.error.details.op).toBeDefined();
  });
});

describe('Cross-file ID consistency', () => {
  it('datasource_id is consistent between list and get examples', () => {
    const list = loadJson('list_datasources.success.json') as { items: Array<{ datasource_id: string }> };
    const get_ = loadJson('get_datasource.success.json') as { datasource_id: string };
    const listIds = list.items.map(i => i.datasource_id);
    expect(listIds).toContain(get_.datasource_id);
  });

  it('workbook_id is consistent between list and get examples', () => {
    const list = loadJson('list_workbooks.success.json') as { items: Array<{ workbook_id: string }> };
    const get_ = loadJson('get_workbook.success.json') as { workbook_id: string };
    const listIds = list.items.map(i => i.workbook_id);
    expect(listIds).toContain(get_.workbook_id);
  });

  it('view_id in run_view matches get_view', () => {
    const runReq = loadJson('run_view.request.json') as { view_id: string };
    const getResp = loadJson('get_view.success.json') as { view_id: string };
    expect(runReq.view_id).toBe(getResp.view_id);
  });

  it('query_result_id in export matches query result', () => {
    const qResult = loadJson('query_datasource.success.json') as { query_result_id: string };
    const export_ = loadJson('export_query_result.success.json') as { query_result_id: string };
    expect(qResult.query_result_id).toBe(export_.query_result_id);
  });
});
