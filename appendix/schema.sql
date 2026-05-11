PRAGMA foreign_keys = ON;
CREATE TABLE datasource (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  default_table_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('READY', 'STALE', 'OFFLINE', 'DEGRADED')),
  freshness_state TEXT NOT NULL CHECK (freshness_state IN ('CURRENT', 'STALE', 'UNKNOWN')),
  row_count_estimate INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE datasource_field (
  id TEXT PRIMARY KEY,
  datasource_id TEXT NOT NULL REFERENCES datasource(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('string', 'integer', 'decimal', 'boolean', 'date', 'datetime')),
  semantic_role TEXT NOT NULL CHECK (semantic_role IN ('dimension', 'measure', 'date', 'identifier', 'category', 'currency', 'percentage')),
  description TEXT NOT NULL,
  is_filterable INTEGER NOT NULL CHECK (is_filterable IN (0,1)),
  is_groupable INTEGER NOT NULL CHECK (is_groupable IN (0,1)),
  is_aggregatable INTEGER NOT NULL CHECK (is_aggregatable IN (0,1)),
  allowed_aggregations TEXT NOT NULL,
  ordinal_position INTEGER NOT NULL,
  UNIQUE(datasource_id, field_name)
);

CREATE TABLE workbook (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE view (
  id TEXT PRIMARY KEY,
  workbook_id TEXT NOT NULL REFERENCES workbook(id) ON DELETE CASCADE,
  datasource_id TEXT NOT NULL REFERENCES datasource(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  view_type TEXT NOT NULL,
  description TEXT NOT NULL,
  x_axis_label TEXT,
  y_axis_label TEXT,
  default_query_json TEXT NOT NULL,
  render_spec_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('READY', 'STALE', 'OFFLINE', 'DEGRADED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE view_allowed_filter (
  id TEXT PRIMARY KEY,
  view_id TEXT NOT NULL REFERENCES view(id) ON DELETE CASCADE,
  datasource_field_id TEXT NOT NULL REFERENCES datasource_field(id) ON DELETE RESTRICT,
  operator_list_json TEXT NOT NULL,
  default_value_json TEXT,
  is_required INTEGER NOT NULL CHECK (is_required IN (0,1)),
  display_order INTEGER NOT NULL
);

CREATE TABLE query_run (
  id TEXT PRIMARY KEY,
  datasource_id TEXT NOT NULL REFERENCES datasource(id) ON DELETE RESTRICT,
  source_view_id TEXT REFERENCES view(id) ON DELETE SET NULL,
  normalized_query_json TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  returned_rows INTEGER NOT NULL,
  truncated INTEGER NOT NULL CHECK (truncated IN (0,1)),
  created_at TEXT NOT NULL
);

CREATE TABLE artifact (
  id TEXT PRIMARY KEY,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('view_render', 'view_export', 'query_export')),
  source_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  format TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  relative_path TEXT NOT NULL UNIQUE,
  byte_size INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_datasource_slug ON datasource(slug);
CREATE INDEX idx_datasource_status ON datasource(status, updated_at);
CREATE INDEX idx_datasource_field_ds ON datasource_field(datasource_id, ordinal_position);
CREATE INDEX idx_workbook_updated ON workbook(updated_at DESC, id ASC);
CREATE INDEX idx_view_workbook ON view(workbook_id, updated_at DESC, id ASC);
CREATE INDEX idx_view_datasource ON view(datasource_id, updated_at DESC, id ASC);
CREATE INDEX idx_view_filter_view ON view_allowed_filter(view_id, display_order);
CREATE INDEX idx_query_run_created ON query_run(created_at DESC, id ASC);
CREATE INDEX idx_artifact_source ON artifact(source_id, created_at DESC, id ASC);
CREATE VIRTUAL TABLE content_search USING fts5(
  entity_type,
  entity_id,
  title,
  description,
  tokenize = 'unicode61'
);
CREATE TABLE dim_date (
  date_key INTEGER PRIMARY KEY,
  date_value TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name TEXT NOT NULL,
  week_of_year INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL
);

CREATE TABLE dim_region (
  id TEXT PRIMARY KEY,
  region_name TEXT NOT NULL UNIQUE
);

CREATE TABLE dim_store (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL REFERENCES dim_region(id) ON DELETE RESTRICT,
  store_code TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  opened_on TEXT NOT NULL,
  comparable_since_date TEXT NOT NULL,
  department_mix_json TEXT NOT NULL
);

CREATE TABLE dim_department (
  id TEXT PRIMARY KEY,
  department_name TEXT NOT NULL UNIQUE
);

CREATE TABLE dim_product (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES dim_department(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category_name TEXT NOT NULL
);

CREATE TABLE fact_sales_daily (
  id TEXT PRIMARY KEY,
  date_key INTEGER NOT NULL REFERENCES dim_date(date_key) ON DELETE RESTRICT,
  store_id TEXT NOT NULL REFERENCES dim_store(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL REFERENCES dim_product(id) ON DELETE RESTRICT,
  orders_count INTEGER NOT NULL,
  units_sold INTEGER NOT NULL,
  gross_revenue DECIMAL NOT NULL,
  net_revenue DECIMAL NOT NULL,
  margin_amount DECIMAL NOT NULL,
  same_store_flag INTEGER NOT NULL CHECK (same_store_flag IN (0,1))
);

CREATE TABLE fact_budget_monthly (
  id TEXT PRIMARY KEY,
  month_key INTEGER NOT NULL,
  region_id TEXT NOT NULL REFERENCES dim_region(id) ON DELETE RESTRICT,
  department_id TEXT REFERENCES dim_department(id) ON DELETE RESTRICT,
  budget_revenue DECIMAL NOT NULL,
  budget_margin DECIMAL NOT NULL
);

CREATE TABLE fact_inventory_daily (
  id TEXT PRIMARY KEY,
  date_key INTEGER NOT NULL REFERENCES dim_date(date_key) ON DELETE RESTRICT,
  store_id TEXT NOT NULL REFERENCES dim_store(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL REFERENCES dim_product(id) ON DELETE RESTRICT,
  on_hand_units INTEGER NOT NULL,
  sell_through_rate DECIMAL NOT NULL,
  stockout_flag INTEGER NOT NULL CHECK (stockout_flag IN (0,1))
);

CREATE TABLE fact_pipeline_snapshot (
  id TEXT PRIMARY KEY,
  snapshot_date_key INTEGER NOT NULL REFERENCES dim_date(date_key) ON DELETE RESTRICT,
  region_id TEXT NOT NULL REFERENCES dim_region(id) ON DELETE RESTRICT,
  opportunity_stage TEXT NOT NULL,
  pipeline_amount DECIMAL NOT NULL,
  weighted_amount DECIMAL NOT NULL,
  opportunity_count INTEGER NOT NULL
);
CREATE INDEX idx_fact_sales_date_store ON fact_sales_daily(date_key, store_id);
CREATE INDEX idx_fact_sales_product ON fact_sales_daily(product_id, date_key);
CREATE INDEX idx_budget_month_region ON fact_budget_monthly(month_key, region_id);
CREATE INDEX idx_inventory_date_store ON fact_inventory_daily(date_key, store_id);
CREATE INDEX idx_pipeline_snapshot ON fact_pipeline_snapshot(snapshot_date_key, region_id);
