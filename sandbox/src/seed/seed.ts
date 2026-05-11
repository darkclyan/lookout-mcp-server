import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SANDBOX = join(__dirname, '../..');
const SCHEMA_PATH = join(ROOT, 'appendix/schema.sql');
const DB_PATH = join(SANDBOX, 'prisma/lookout.db');

const SEED_CLOCK = '2026-04-30T00:00:00.000Z';

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaRaw = readFileSync(SCHEMA_PATH, 'utf-8');
const statements = schemaRaw
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of statements) {
  try {
    db.exec(stmt + ';');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already exists')) continue;
    if (msg.includes('fts5') || msg.includes('tokenizer') || msg.includes('no such module')) {
      console.warn('⚠  FTS5 unavailable in this SQLite build, skipping content_search table');
      continue;
    }
    throw err;
  }
}

function ulid(prefix: string): string {
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let id = '';
  for (let i = 0; i < 26; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${id}`;
}

function insertFts(entityType: string, entityId: string, title: string, description: string) {
  try {
    db.prepare('INSERT INTO content_search(entity_type, entity_id, title, description) VALUES (?, ?, ?, ?)').run(
      entityType,
      entityId,
      title,
      description,
    );
  } catch {}
}

const REGIONS = [
  { id: 'reg_EAST0000000000000000000001', region_name: 'East' },
  { id: 'reg_WEST0000000000000000000001', region_name: 'West' },
  { id: 'reg_CENT0000000000000000000001', region_name: 'Central' },
  { id: 'reg_SOUT0000000000000000000001', region_name: 'South' },
];

const insertRegion = db.prepare('INSERT OR IGNORE INTO dim_region (id, region_name) VALUES (?, ?)');
for (const r of REGIONS) {
  insertRegion.run(r.id, r.region_name);
}

const DEPARTMENTS = [
  { id: 'dep_APPR0000000000000000000001', department_name: 'Apparel' },
  { id: 'dep_ELEC0000000000000000000001', department_name: 'Electronics' },
  { id: 'dep_HOME0000000000000000000001', department_name: 'Home & Garden' },
  { id: 'dep_FOOD0000000000000000000001', department_name: 'Food & Beverage' },
  { id: 'dep_SPOR0000000000000000000001', department_name: 'Sports & Outdoors' },
];

const insertDept = db.prepare('INSERT OR IGNORE INTO dim_department (id, department_name) VALUES (?, ?)');
for (const d of DEPARTMENTS) {
  insertDept.run(d.id, d.department_name);
}

const STORES = [
  {
    id: 'str_BOST0000000000000000000001',
    region_id: 'reg_EAST0000000000000000000001',
    store_code: 'BOS-001',
    store_name: 'Boston Flagship',
    opened_on: '2020-03-15',
    comparable_since_date: '2021-04-01',
    department_mix_json: JSON.stringify(['Apparel', 'Electronics', 'Home & Garden']),
  },
  {
    id: 'str_NYC00000000000000000000001',
    region_id: 'reg_EAST0000000000000000000001',
    store_code: 'NYC-001',
    store_name: 'New York Times Square',
    opened_on: '2019-11-01',
    comparable_since_date: '2020-12-01',
    department_mix_json: JSON.stringify(['Apparel', 'Electronics', 'Sports & Outdoors']),
  },
  {
    id: 'str_LA000000000000000000000001',
    region_id: 'reg_WEST0000000000000000000001',
    store_code: 'LAX-001',
    store_name: 'Los Angeles Westside',
    opened_on: '2021-06-01',
    comparable_since_date: '2022-07-01',
    department_mix_json: JSON.stringify(['Apparel', 'Home & Garden', 'Food & Beverage']),
  },
  {
    id: 'str_SEA00000000000000000000001',
    region_id: 'reg_WEST0000000000000000000001',
    store_code: 'SEA-001',
    store_name: 'Seattle Downtown',
    opened_on: '2020-09-01',
    comparable_since_date: '2021-10-01',
    department_mix_json: JSON.stringify(['Electronics', 'Sports & Outdoors']),
  },
  {
    id: 'str_CHI00000000000000000000001',
    region_id: 'reg_CENT0000000000000000000001',
    store_code: 'CHI-001',
    store_name: 'Chicago Magnificent Mile',
    opened_on: '2019-04-01',
    comparable_since_date: '2020-05-01',
    department_mix_json: JSON.stringify(['Apparel', 'Electronics', 'Food & Beverage']),
  },
  {
    id: 'str_ATL00000000000000000000001',
    region_id: 'reg_SOUT0000000000000000000001',
    store_code: 'ATL-001',
    store_name: 'Atlanta Midtown',
    opened_on: '2022-01-15',
    comparable_since_date: '2023-02-01',
    department_mix_json: JSON.stringify(['Apparel', 'Sports & Outdoors']),
  },
];

const insertStore = db.prepare(
  'INSERT OR IGNORE INTO dim_store (id, region_id, store_code, store_name, opened_on, comparable_since_date, department_mix_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
for (const s of STORES) {
  insertStore.run(
    s.id,
    s.region_id,
    s.store_code,
    s.store_name,
    s.opened_on,
    s.comparable_since_date,
    s.department_mix_json,
  );
}

const PRODUCTS = [
  {
    id: 'prd_APP00000000000000000000001',
    department_id: 'dep_APPR0000000000000000000001',
    sku: 'APP-001',
    product_name: 'Classic Denim Jacket',
    category_name: 'Outerwear',
  },
  {
    id: 'prd_APP00000000000000000000002',
    department_id: 'dep_APPR0000000000000000000001',
    sku: 'APP-002',
    product_name: 'Performance Running Shorts',
    category_name: 'Activewear',
  },
  {
    id: 'prd_ELC00000000000000000000001',
    department_id: 'dep_ELEC0000000000000000000001',
    sku: 'ELC-001',
    product_name: 'Wireless Noise-Cancelling Headphones',
    category_name: 'Audio',
  },
  {
    id: 'prd_ELC00000000000000000000002',
    department_id: 'dep_ELEC0000000000000000000001',
    sku: 'ELC-002',
    product_name: 'Smart Home Hub',
    category_name: 'Connected Home',
  },
  {
    id: 'prd_HOM00000000000000000000001',
    department_id: 'dep_HOME0000000000000000000001',
    sku: 'HOM-001',
    product_name: 'Stainless Steel Cookware Set',
    category_name: 'Kitchen',
  },
  {
    id: 'prd_FOD00000000000000000000001',
    department_id: 'dep_FOOD0000000000000000000001',
    sku: 'FOD-001',
    product_name: 'Organic Cold Brew Coffee',
    category_name: 'Beverages',
  },
  {
    id: 'prd_SPT00000000000000000000001',
    department_id: 'dep_SPOR0000000000000000000001',
    sku: 'SPT-001',
    product_name: 'Ultralight Hiking Backpack',
    category_name: 'Hiking',
  },
  {
    id: 'prd_SPT00000000000000000000002',
    department_id: 'dep_SPOR0000000000000000000001',
    sku: 'SPT-002',
    product_name: 'Carbon Fiber Bicycle',
    category_name: 'Cycling',
  },
];

const insertProduct = db.prepare(
  'INSERT OR IGNORE INTO dim_product (id, department_id, sku, product_name, category_name) VALUES (?, ?, ?, ?, ?)',
);
for (const p of PRODUCTS) {
  insertProduct.run(p.id, p.department_id, p.sku, p.product_name, p.category_name);
}

const insertDate = db.prepare(
  'INSERT OR IGNORE INTO dim_date (date_key, date_value, year, quarter, month, month_name, week_of_year, day_of_month, day_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
);

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

let d = new Date('2025-01-01T00:00:00Z');
const end = new Date('2026-05-01T00:00:00Z');
const insertDates = db.transaction(() => {
  while (d < end) {
    const dateStr = d.toISOString().slice(0, 10);
    const dateKey = parseInt(dateStr.replace(/-/g, ''), 10);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const dayOfMonth = d.getUTCDate();
    const dayOfWeek = d.getUTCDay();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const weekOfYear = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
    insertDate.run(dateKey, dateStr, year, quarter, month, MONTH_NAMES[month - 1], weekOfYear, dayOfMonth, dayOfWeek);
    d.setUTCDate(d.getUTCDate() + 1);
  }
});
insertDates();
console.log('✓ dim_date populated');

const insertSales = db.prepare(
  'INSERT OR IGNORE INTO fact_sales_daily (id, date_key, store_id, product_id, orders_count, units_sold, gross_revenue, net_revenue, margin_amount, same_store_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);

const SALES_PERIODS = [
  { start: '2025-01-01', end: '2025-03-31' },
  { start: '2026-01-01', end: '2026-03-31' },
];

const insertSalesData = db.transaction(() => {
  for (const period of SALES_PERIODS) {
    let pd = new Date(period.start + 'T00:00:00Z');
    const pe = new Date(period.end + 'T00:00:00Z');
    while (pd <= pe) {
      const dateStr = pd.toISOString().slice(0, 10);
      const dateKey = parseInt(dateStr.replace(/-/g, ''), 10);
      for (const store of STORES) {
        for (const product of PRODUCTS.slice(0, 4)) {
          const orders = Math.floor(Math.random() * 20) + 5;
          const units = orders * (Math.floor(Math.random() * 3) + 1);
          const gross = parseFloat((units * (Math.random() * 80 + 20)).toFixed(2));
          const net = parseFloat((gross * 0.92).toFixed(2));
          const margin = parseFloat((net * 0.35).toFixed(2));
          const comparable = store.comparable_since_date <= dateStr ? 1 : 0;
          insertSales.run(ulid('sale_'), dateKey, store.id, product.id, orders, units, gross, net, margin, comparable);
        }
      }
      pd.setUTCDate(pd.getUTCDate() + 1);
    }
  }
});
insertSalesData();
const salesCount = (db.prepare('SELECT COUNT(*) as c FROM fact_sales_daily').get() as { c: number }).c;
console.log(`✓ fact_sales_daily: ${salesCount} rows`);

const insertBudget = db.prepare(
  'INSERT OR IGNORE INTO fact_budget_monthly (id, month_key, region_id, department_id, budget_revenue, budget_margin) VALUES (?, ?, ?, ?, ?, ?)',
);

const insertBudgets = db.transaction(() => {
  for (let m = 1; m <= 12; m++) {
    const monthKey = 202600 + m;
    for (const region of REGIONS) {
      for (const dept of DEPARTMENTS) {
        const budgetRev = parseFloat((Math.random() * 500000 + 200000).toFixed(2));
        const budgetMargin = parseFloat((budgetRev * 0.3).toFixed(2));
        insertBudget.run(ulid('bdg_'), monthKey, region.id, dept.id, budgetRev, budgetMargin);
      }
    }
  }
});
insertBudgets();
console.log('✓ fact_budget_monthly populated');

const insertPipeline = db.prepare(
  'INSERT OR IGNORE INTO fact_pipeline_snapshot (id, snapshot_date_key, region_id, opportunity_stage, pipeline_amount, weighted_amount, opportunity_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
);

const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];
const SNAPSHOT_DATES = ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'];

const insertPipelines = db.transaction(() => {
  for (const snapDate of SNAPSHOT_DATES) {
    const snapKey = parseInt(snapDate.replace(/-/g, ''), 10);
    for (const region of REGIONS) {
      for (const stage of STAGES) {
        const amount = parseFloat((Math.random() * 2000000 + 100000).toFixed(2));
        const weighted = parseFloat((amount * (Math.random() * 0.6 + 0.1)).toFixed(2));
        const count = Math.floor(Math.random() * 30) + 5;
        insertPipeline.run(ulid('pip_'), snapKey, region.id, stage, amount, weighted, count);
      }
    }
  }
});
insertPipelines();
console.log('✓ fact_pipeline_snapshot populated');

const insertInventory = db.prepare(
  'INSERT OR IGNORE INTO fact_inventory_daily (id, date_key, store_id, product_id, on_hand_units, sell_through_rate, stockout_flag) VALUES (?, ?, ?, ?, ?, ?, ?)',
);

const insertInventoryData = db.transaction(() => {
  const dates = ['2026-03-31', '2026-04-15', '2026-04-30'];
  for (const snapDate of dates) {
    const snapKey = parseInt(snapDate.replace(/-/g, ''), 10);
    for (const store of STORES) {
      for (const product of PRODUCTS) {
        const onHand = Math.floor(Math.random() * 200);
        const sellThrough = parseFloat((Math.random() * 0.9 + 0.05).toFixed(4));
        const stockout = onHand === 0 ? 1 : 0;
        insertInventory.run(ulid('inv_'), snapKey, store.id, product.id, onHand, sellThrough, stockout);
      }
    }
  }
});
insertInventoryData();
console.log('✓ fact_inventory_daily populated');

const DATASOURCES = [
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'sales-performance',
    name: 'Sales Performance',
    description:
      'Daily transactional sales data by store, product, region, and date. Covers FY2024–FY2026 with gross revenue, net revenue, and margin metrics.',
    default_table_name: 'fact_sales_daily',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 14400,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-30T06:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1A',
        field_name: 'order_date',
        display_name: 'Order Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Calendar date of the sale transaction.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Geographic sales region (East, West, Central, South).',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1C',
        field_name: 'store_code',
        display_name: 'Store Code',
        data_type: 'string',
        semantic_role: 'identifier',
        description: 'Unique store identifier code.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1D',
        field_name: 'store_name',
        display_name: 'Store Name',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Human-readable store name.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 4,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1E',
        field_name: 'department_name',
        display_name: 'Department',
        data_type: 'string',
        semantic_role: 'category',
        description: 'Product department (Apparel, Electronics, etc.).',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 5,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1F',
        field_name: 'product_sku',
        display_name: 'Product SKU',
        data_type: 'string',
        semantic_role: 'identifier',
        description: 'Stock-keeping unit identifier.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 6,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1G',
        field_name: 'orders_count',
        display_name: 'Orders',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Number of order transactions on this date.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max","count"]',
        ordinal_position: 7,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1H',
        field_name: 'units_sold',
        display_name: 'Units Sold',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Total units sold across all orders.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 8,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1I',
        field_name: 'gross_revenue',
        display_name: 'Gross Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Total revenue before discounts and returns.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 9,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1J',
        field_name: 'net_revenue',
        display_name: 'Net Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Revenue after discounts and returns.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 10,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1K',
        field_name: 'margin_amount',
        display_name: 'Margin',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Gross margin in absolute currency.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 11,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1L',
        field_name: 'same_store_flag',
        display_name: 'Same-Store',
        data_type: 'boolean',
        semantic_role: 'dimension',
        description: '1 if the store was open in the comparable prior period.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 12,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2B',
    slug: 'budget-vs-actual',
    name: 'Budget vs Actual',
    description: 'Monthly budget targets by region and department alongside realized revenue and margin figures.',
    default_table_name: 'fact_budget_monthly',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 2880,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R2A',
        field_name: 'month_key',
        display_name: 'Month Key',
        data_type: 'integer',
        semantic_role: 'date',
        description: 'YYYYMM format month identifier.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R2B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Geographic region.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R2C',
        field_name: 'department_name',
        display_name: 'Department',
        data_type: 'string',
        semantic_role: 'category',
        description: 'Product department.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R2D',
        field_name: 'budget_revenue',
        display_name: 'Budget Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Planned revenue for the month.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 4,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R2E',
        field_name: 'budget_margin',
        display_name: 'Budget Margin',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Planned gross margin for the month.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 5,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2C',
    slug: 'store-operations',
    name: 'Store Operations',
    description:
      'Daily store-level operational data including inventory positions, sell-through rates, and stockout events.',
    default_table_name: 'fact_inventory_daily',
    status: 'STALE',
    freshness_state: 'STALE',
    row_count_estimate: 4320,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-15T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R3A',
        field_name: 'snapshot_date',
        display_name: 'Snapshot Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Date of the inventory snapshot.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R3B',
        field_name: 'store_code',
        display_name: 'Store Code',
        data_type: 'string',
        semantic_role: 'identifier',
        description: 'Store identifier.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R3C',
        field_name: 'product_sku',
        display_name: 'Product SKU',
        data_type: 'string',
        semantic_role: 'identifier',
        description: 'Product SKU.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R3D',
        field_name: 'on_hand_units',
        display_name: 'On Hand',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Units currently in store inventory.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 4,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R3E',
        field_name: 'sell_through_rate',
        display_name: 'Sell-Through Rate',
        data_type: 'decimal',
        semantic_role: 'percentage',
        description: 'Ratio of units sold to available inventory.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["avg","min","max"]',
        ordinal_position: 5,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R3F',
        field_name: 'stockout_flag',
        display_name: 'Stockout',
        data_type: 'boolean',
        semantic_role: 'dimension',
        description: '1 if on_hand_units reached zero.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 6,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-health',
    name: 'Pipeline Health',
    description:
      'Monthly snapshots of sales pipeline by region and opportunity stage, including weighted pipeline amounts.',
    default_table_name: 'fact_pipeline_snapshot',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 400,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4A',
        field_name: 'snapshot_date',
        display_name: 'Snapshot Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Date of the pipeline snapshot.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Sales region.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4C',
        field_name: 'opportunity_stage',
        display_name: 'Stage',
        data_type: 'string',
        semantic_role: 'category',
        description: 'CRM opportunity stage.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4D',
        field_name: 'pipeline_amount',
        display_name: 'Pipeline Amount',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Full pipeline value.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 4,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4E',
        field_name: 'weighted_amount',
        display_name: 'Weighted Amount',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Probability-weighted pipeline value.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 5,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4F',
        field_name: 'opportunity_count',
        display_name: 'Opportunity Count',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Number of open opportunities.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max","count"]',
        ordinal_position: 6,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2E',
    slug: 'inventory-position',
    name: 'Inventory Position',
    description: 'Aggregate inventory position by product category and region. Last refreshed 2026-04-15.',
    default_table_name: 'fact_inventory_daily',
    status: 'STALE',
    freshness_state: 'STALE',
    row_count_estimate: 1440,
    created_at: '2025-03-01T00:00:00.000Z',
    updated_at: '2026-04-15T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5A',
        field_name: 'snapshot_date',
        display_name: 'Snapshot Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Date of inventory snapshot.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Region.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5C',
        field_name: 'category_name',
        display_name: 'Category',
        data_type: 'string',
        semantic_role: 'category',
        description: 'Product category.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5D',
        field_name: 'on_hand_units',
        display_name: 'On Hand',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Total on-hand units.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 4,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2F',
    slug: 'marketing-performance',
    name: 'Marketing Performance',
    description: 'Campaign performance metrics including impressions, clicks, and attributed revenue by channel.',
    default_table_name: 'mktg_campaign_daily',
    status: 'OFFLINE',
    freshness_state: 'UNKNOWN',
    row_count_estimate: 0,
    created_at: '2025-06-01T00:00:00.000Z',
    updated_at: '2026-02-14T00:00:00.000Z',
    fields: [],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2G',
    slug: 'regional-executive-summary',
    name: 'Regional Executive Summary',
    description:
      'Pre-aggregated executive-level KPIs by region, including revenue, margin, YoY growth, and budget variance.',
    default_table_name: 'vw_regional_executive_summary',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 48,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-30T06:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7A',
        field_name: 'report_month',
        display_name: 'Month',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Calendar month of the summary.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Geographic region.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7C',
        field_name: 'net_revenue',
        display_name: 'Net Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Realized net revenue.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7D',
        field_name: 'yoy_growth_pct',
        display_name: 'YoY Growth %',
        data_type: 'decimal',
        semantic_role: 'percentage',
        description: 'Year-over-year revenue growth percentage.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["avg"]',
        ordinal_position: 4,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2H',
    slug: 'product-mix',
    name: 'Product Mix',
    description: 'Revenue and unit contribution by product category and SKU across all stores and periods.',
    default_table_name: 'vw_product_mix',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 8000,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8A',
        field_name: 'order_date',
        display_name: 'Order Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Date of sale.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8B',
        field_name: 'category_name',
        display_name: 'Category',
        data_type: 'string',
        semantic_role: 'category',
        description: 'Product category.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8C',
        field_name: 'net_revenue',
        display_name: 'Net Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Net revenue for the category.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8D',
        field_name: 'units_sold',
        display_name: 'Units Sold',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Units sold in the category.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 4,
      },
    ],
  },
];

const insertDs = db.prepare(
  'INSERT OR IGNORE INTO datasource (id, slug, name, description, default_table_name, status, freshness_state, row_count_estimate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
const insertField = db.prepare(
  'INSERT OR IGNORE INTO datasource_field (id, datasource_id, field_name, display_name, data_type, semantic_role, description, is_filterable, is_groupable, is_aggregatable, allowed_aggregations, ordinal_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);

for (const ds of DATASOURCES) {
  insertDs.run(
    ds.id,
    ds.slug,
    ds.name,
    ds.description,
    ds.default_table_name,
    ds.status,
    ds.freshness_state,
    ds.row_count_estimate,
    ds.created_at,
    ds.updated_at,
  );
  insertFts('datasource', ds.id, ds.name, ds.description);
  for (const f of ds.fields) {
    insertField.run(
      f.id,
      ds.id,
      f.field_name,
      f.display_name,
      f.data_type,
      f.semantic_role,
      f.description,
      f.is_filterable,
      f.is_groupable,
      f.is_aggregatable,
      f.allowed_aggregations,
      f.ordinal_position,
    );
  }
}
console.log(`✓ ${DATASOURCES.length} datasources seeded`);

const WORKBOOKS = [
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    slug: 'executive-monday-review',
    title: 'Executive Monday Review',
    description: 'Weekly executive summary covering revenue performance, regional highlights, and pipeline status.',
    category: 'Executive',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    slug: 'pipeline-health',
    title: 'Pipeline Health',
    description: 'Monthly and weekly pipeline views by region and stage, including weighted and unweighted amounts.',
    category: 'Sales',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB7',
    slug: 'q1-sales-review',
    title: 'Q1 Sales Review',
    description: 'Deep-dive analysis of Q1 2026 sales performance by region, store, department, and product.',
    category: 'Sales',
    created_at: '2025-03-01T00:00:00.000Z',
    updated_at: '2026-04-15T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB8',
    slug: 'store-operations-weekly',
    title: 'Store Operations Weekly',
    description: 'Weekly inventory and operational metrics for all store managers.',
    category: 'Operations',
    created_at: '2025-01-15T00:00:00.000Z',
    updated_at: '2026-04-25T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB9',
    slug: 'budget-vs-actual-q1',
    title: 'Budget vs Actual — Q1 2026',
    description: 'Variance analysis comparing Q1 2026 actual revenue and margin against targets.',
    category: 'Finance',
    created_at: '2025-04-01T00:00:00.000Z',
    updated_at: '2026-04-20T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VC0',
    slug: 'product-mix-analysis',
    title: 'Product Mix Analysis',
    description: 'Revenue and unit contribution by category and SKU.',
    category: 'Merchandising',
    created_at: '2025-01-20T00:00:00.000Z',
    updated_at: '2026-04-10T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VC1',
    slug: 'regional-kpis',
    title: 'Regional KPIs',
    description: 'Pre-aggregated executive KPIs per region including YoY growth.',
    category: 'Executive',
    created_at: '2025-01-05T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VC2',
    slug: 'same-store-growth',
    title: 'Same-Store Growth Tracker',
    description: 'Tracks comparable same-store sales growth excluding new-store openings.',
    category: 'Sales',
    created_at: '2025-02-15T00:00:00.000Z',
    updated_at: '2026-04-22T00:00:00.000Z',
  },
];
const extraCategories = ['Sales', 'Operations', 'Finance', 'Merchandising', 'Executive', 'Marketing'];
for (let i = 9; i <= 40; i++) {
  const cat = extraCategories[i % extraCategories.length];
  const num = String(i).padStart(2, '0');
  WORKBOOKS.push({
    id: `wb_EXTRA${num}000000000000000000000${i}`.slice(0, 29),
    slug: `analytical-workbook-${num}`,
    title: `Analytical Workbook ${num}`,
    description: `${cat} analytical workbook covering standard KPIs and trend analysis.`,
    category: cat,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  });
}

const insertWb = db.prepare(
  'INSERT OR IGNORE INTO workbook (id, slug, title, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
for (const wb of WORKBOOKS) {
  insertWb.run(wb.id, wb.slug, wb.title, wb.description, wb.category, wb.created_at, wb.updated_at);
  insertFts('workbook', wb.id, wb.title, wb.description);
}
console.log(`✓ ${WORKBOOKS.length} workbooks seeded`);

const VIEW_TYPES = ['bar', 'line', 'pie', 'treemap', 'histogram'] as const;

const defaultQ = (ds: string, field: string, value: string[]) =>
  JSON.stringify({ filters: [{ field, op: 'between', value }] });
const renderSpec = (type: string) => JSON.stringify({ chart_type: type, theme: 'default' });

interface ViewDef {
  id: string;
  workbook_id: string;
  datasource_id: string;
  slug: string;
  title: string;
  view_type: string;
  description: string;
  x_axis_label: string | null;
  y_axis_label: string | null;
  default_query_json: string;
  render_spec_json: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const VIEWS: ViewDef[] = [
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'q1-revenue-by-region',
    title: 'Q1 Revenue by Region',
    view_type: 'bar',
    description: 'Bar chart comparing net revenue across all regions for Q1 2026.',
    x_axis_label: 'Region',
    y_axis_label: 'Net Revenue',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A', 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('bar'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TL',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'weekly-revenue-trend',
    title: 'Weekly Revenue Trend',
    view_type: 'line',
    description: 'Line chart tracking weekly net revenue over the past 13 weeks.',
    x_axis_label: 'Week',
    y_axis_label: 'Net Revenue',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A', 'order_date', ['2026-01-26', '2026-04-27']),
    render_spec_json: renderSpec('line'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TM',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2H',
    slug: 'revenue-by-department',
    title: 'Revenue by Department',
    view_type: 'pie',
    description: 'Pie chart showing revenue share by product department for the current quarter.',
    x_axis_label: null,
    y_axis_label: null,
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2H', 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('pie'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TN',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2G',
    slug: 'store-performance-map',
    title: 'Store Performance Map',
    view_type: 'treemap',
    description: 'Treemap showing revenue contribution by store, sized by net revenue and colored by growth.',
    x_axis_label: null,
    y_axis_label: null,
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2G', 'report_month', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('treemap'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TO',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'order-volume-distribution',
    title: 'Order Volume Distribution',
    view_type: 'histogram',
    description: 'Histogram of daily order volumes, showing distribution shape and outliers.',
    x_axis_label: 'Daily Orders',
    y_axis_label: 'Frequency',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A', 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('histogram'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TP',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-by-stage',
    title: 'Pipeline by Stage',
    view_type: 'bar',
    description: 'Bar chart showing pipeline amount by opportunity stage for the latest snapshot.',
    x_axis_label: 'Stage',
    y_axis_label: 'Pipeline Amount',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D', 'snapshot_date', ['2026-04-01', '2026-04-30']),
    render_spec_json: renderSpec('bar'),
    status: 'READY',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TQ',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-trend',
    title: 'Pipeline Trend (4 Months)',
    view_type: 'line',
    description: 'Line chart tracking total pipeline and weighted pipeline across the last 4 monthly snapshots.',
    x_axis_label: 'Month',
    y_axis_label: 'Pipeline Amount',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D', 'snapshot_date', ['2026-01-01', '2026-04-30']),
    render_spec_json: renderSpec('line'),
    status: 'READY',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TR',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-by-region',
    title: 'Pipeline by Region',
    view_type: 'treemap',
    description: 'Treemap of pipeline distribution by region, sized by total pipeline amount.',
    x_axis_label: null,
    y_axis_label: null,
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D', 'snapshot_date', ['2026-04-01', '2026-04-30']),
    render_spec_json: renderSpec('treemap'),
    status: 'READY',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
];
let viewCounter = VIEWS.length;
const VIEW_WORKBOOKS = WORKBOOKS.slice(0, 8);
const DATASOURCE_IDS = DATASOURCES.filter(d => d.status !== 'OFFLINE').map(d => d.id);

for (let i = viewCounter; i < 220; i++) {
  const wb = VIEW_WORKBOOKS[i % VIEW_WORKBOOKS.length];
  const dsId = DATASOURCE_IDS[i % DATASOURCE_IDS.length];
  const vtype = VIEW_TYPES[i % VIEW_TYPES.length];
  const num = String(i).padStart(3, '0');
  const xLabel = ['bar', 'line', 'histogram'].includes(vtype) ? 'Category' : null;
  const yLabel = ['bar', 'line', 'histogram'].includes(vtype) ? 'Value' : null;
  VIEWS.push({
    id: `vw_VIEW${num}000000000000000000000${i}`.slice(0, 29),
    workbook_id: wb.id,
    datasource_id: dsId,
    slug: `view-${vtype}-${num}`,
    title: `${vtype.charAt(0).toUpperCase() + vtype.slice(1)} Chart ${num}`,
    view_type: vtype,
    description: `${vtype.charAt(0).toUpperCase() + vtype.slice(1)} view for broad analytics coverage.`,
    x_axis_label: xLabel,
    y_axis_label: yLabel,
    default_query_json: defaultQ(dsId, 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec(vtype),
    status: i % 20 === 0 ? 'STALE' : 'READY',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  });
}

const insertView = db.prepare(
  'INSERT OR IGNORE INTO view (id, workbook_id, datasource_id, slug, title, view_type, description, x_axis_label, y_axis_label, default_query_json, render_spec_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
for (const v of VIEWS) {
  insertView.run(
    v.id,
    v.workbook_id,
    v.datasource_id,
    v.slug,
    v.title,
    v.view_type,
    v.description,
    v.x_axis_label,
    v.y_axis_label,
    v.default_query_json,
    v.render_spec_json,
    v.status,
    v.created_at,
    v.updated_at,
  );
  insertFts('view', v.id, v.title, v.description);
}
console.log(`✓ ${VIEWS.length} views seeded`);

const insertFilter = db.prepare(
  'INSERT OR IGNORE INTO view_allowed_filter (id, view_id, datasource_field_id, operator_list_json, default_value_json, is_required, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
const DATE_OPS = JSON.stringify(['between', 'in_relative_period']);
const STR_OPS = JSON.stringify(['eq', 'in', 'contains']);

insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TK',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1A',
  DATE_OPS,
  JSON.stringify(['2026-01-01', '2026-03-31']),
  1,
  1,
);
insertFilter.run(ulid('vaf_'), 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK', 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1B', STR_OPS, null, 0, 2);
insertFilter.run(ulid('vaf_'), 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK', 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1E', STR_OPS, null, 0, 3);

insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TL',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1A',
  DATE_OPS,
  JSON.stringify(['2026-01-26', '2026-04-27']),
  1,
  1,
);
insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TP',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4A',
  DATE_OPS,
  JSON.stringify(['2026-04-01', '2026-04-30']),
  1,
  1,
);
insertFilter.run(ulid('vaf_'), 'vw_01JTK8J4E8AM2R4T3YX3GZC3TP', 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4B', STR_OPS, null, 0, 2);
insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TQ',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4A',
  DATE_OPS,
  JSON.stringify(['2026-01-01', '2026-04-30']),
  1,
  1,
);

console.log('✓ view_allowed_filter populated');

const counts = {
  datasource: (db.prepare('SELECT COUNT(*) as c FROM datasource').get() as { c: number }).c,
  field: (db.prepare('SELECT COUNT(*) as c FROM datasource_field').get() as { c: number }).c,
  workbook: (db.prepare('SELECT COUNT(*) as c FROM workbook').get() as { c: number }).c,
  view: (db.prepare('SELECT COUNT(*) as c FROM view').get() as { c: number }).c,
  sales: salesCount,
};

console.log('\n📊 Seed Summary:');
console.log(`   Datasources : ${counts.datasource}`);
console.log(`   Fields      : ${counts.field}`);
console.log(`   Workbooks   : ${counts.workbook}`);
console.log(`   Views       : ${counts.view}`);
console.log(`   Sales rows  : ${counts.sales}`);
console.log('\n✅ Seed complete.'
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4C',
        field_name: 'opportunity_stage',
        display_name: 'Stage',
        data_type: 'string',
        semantic_role: 'category',
        description: 'CRM opportunity stage.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4D',
        field_name: 'pipeline_amount',
        display_name: 'Pipeline Amount',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Full pipeline value.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max"]',
        ordinal_position: 4,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4E',
        field_name: 'weighted_amount',
        display_name: 'Weighted Amount',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Probability-weighted pipeline value.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 5,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4F',
        field_name: 'opportunity_count',
        display_name: 'Opportunity Count',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Number of open opportunities.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg","min","max","count"]',
        ordinal_position: 6,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2E',
    slug: 'inventory-position',
    name: 'Inventory Position',
    description: 'Aggregate inventory position by product category and region. Last refreshed 2026-04-15.',
    default_table_name: 'fact_inventory_daily',
    status: 'STALE',
    freshness_state: 'STALE',
    row_count_estimate: 1440,
    created_at: '2025-03-01T00:00:00.000Z',
    updated_at: '2026-04-15T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5A',
        field_name: 'snapshot_date',
        display_name: 'Snapshot Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Date of inventory snapshot.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Region.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5C',
        field_name: 'category_name',
        display_name: 'Category',
        data_type: 'string',
        semantic_role: 'category',
        description: 'Product category.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R5D',
        field_name: 'on_hand_units',
        display_name: 'On Hand',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Total on-hand units.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 4,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2F',
    slug: 'marketing-performance',
    name: 'Marketing Performance',
    description: 'Campaign performance metrics including impressions, clicks, and attributed revenue by channel.',
    default_table_name: 'mktg_campaign_daily',
    status: 'OFFLINE',
    freshness_state: 'UNKNOWN',
    row_count_estimate: 0,
    created_at: '2025-06-01T00:00:00.000Z',
    updated_at: '2026-02-14T00:00:00.000Z',
    fields: [],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2G',
    slug: 'regional-executive-summary',
    name: 'Regional Executive Summary',
    description:
      'Pre-aggregated executive-level KPIs by region, including revenue, margin, YoY growth, and budget variance.',
    default_table_name: 'vw_regional_executive_summary',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 48,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-30T06:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7A',
        field_name: 'report_month',
        display_name: 'Month',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Calendar month of the summary.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7B',
        field_name: 'region_name',
        display_name: 'Region',
        data_type: 'string',
        semantic_role: 'dimension',
        description: 'Geographic region.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7C',
        field_name: 'net_revenue',
        display_name: 'Net Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Realized net revenue.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R7D',
        field_name: 'yoy_growth_pct',
        display_name: 'YoY Growth %',
        data_type: 'decimal',
        semantic_role: 'percentage',
        description: 'Year-over-year revenue growth percentage.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["avg"]',
        ordinal_position: 4,
      },
    ],
  },
  {
    id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2H',
    slug: 'product-mix',
    name: 'Product Mix',
    description: 'Revenue and unit contribution by product category and SKU across all stores and periods.',
    default_table_name: 'vw_product_mix',
    status: 'READY',
    freshness_state: 'CURRENT',
    row_count_estimate: 8000,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
    fields: [
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8A',
        field_name: 'order_date',
        display_name: 'Order Date',
        data_type: 'date',
        semantic_role: 'date',
        description: 'Date of sale.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 1,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8B',
        field_name: 'category_name',
        display_name: 'Category',
        data_type: 'string',
        semantic_role: 'category',
        description: 'Product category.',
        is_filterable: 1,
        is_groupable: 1,
        is_aggregatable: 0,
        allowed_aggregations: '[]',
        ordinal_position: 2,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8C',
        field_name: 'net_revenue',
        display_name: 'Net Revenue',
        data_type: 'decimal',
        semantic_role: 'currency',
        description: 'Net revenue for the category.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 3,
      },
      {
        id: 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R8D',
        field_name: 'units_sold',
        display_name: 'Units Sold',
        data_type: 'integer',
        semantic_role: 'measure',
        description: 'Units sold in the category.',
        is_filterable: 0,
        is_groupable: 0,
        is_aggregatable: 1,
        allowed_aggregations: '["sum","avg"]',
        ordinal_position: 4,
      },
    ],
  },
];

const insertDs = db.prepare(
  'INSERT OR IGNORE INTO datasource (id, slug, name, description, default_table_name, status, freshness_state, row_count_estimate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
const insertField = db.prepare(
  'INSERT OR IGNORE INTO datasource_field (id, datasource_id, field_name, display_name, data_type, semantic_role, description, is_filterable, is_groupable, is_aggregatable, allowed_aggregations, ordinal_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);

for (const ds of DATASOURCES) {
  insertDs.run(
    ds.id,
    ds.slug,
    ds.name,
    ds.description,
    ds.default_table_name,
    ds.status,
    ds.freshness_state,
    ds.row_count_estimate,
    ds.created_at,
    ds.updated_at,
  );
  insertFts('datasource', ds.id, ds.name, ds.description);
  for (const f of ds.fields) {
    insertField.run(
      f.id,
      ds.id,
      f.field_name,
      f.display_name,
      f.data_type,
      f.semantic_role,
      f.description,
      f.is_filterable,
      f.is_groupable,
      f.is_aggregatable,
      f.allowed_aggregations,
      f.ordinal_position,
    );
  }
}
console.log(`✓ ${DATASOURCES.length} datasources seeded`);

const WORKBOOKS = [
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    slug: 'executive-monday-review',
    title: 'Executive Monday Review',
    description: 'Weekly executive summary covering revenue performance, regional highlights, and pipeline status.',
    category: 'Executive',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    slug: 'pipeline-health',
    title: 'Pipeline Health',
    description: 'Monthly and weekly pipeline views by region and stage, including weighted and unweighted amounts.',
    category: 'Sales',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB7',
    slug: 'q1-sales-review',
    title: 'Q1 Sales Review',
    description: 'Deep-dive analysis of Q1 2026 sales performance by region, store, department, and product.',
    category: 'Sales',
    created_at: '2025-03-01T00:00:00.000Z',
    updated_at: '2026-04-15T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB8',
    slug: 'store-operations-weekly',
    title: 'Store Operations Weekly',
    description: 'Weekly inventory and operational metrics for all store managers.',
    category: 'Operations',
    created_at: '2025-01-15T00:00:00.000Z',
    updated_at: '2026-04-25T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB9',
    slug: 'budget-vs-actual-q1',
    title: 'Budget vs Actual — Q1 2026',
    description: 'Variance analysis comparing Q1 2026 actual revenue and margin against targets.',
    category: 'Finance',
    created_at: '2025-04-01T00:00:00.000Z',
    updated_at: '2026-04-20T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VC0',
    slug: 'product-mix-analysis',
    title: 'Product Mix Analysis',
    description: 'Revenue and unit contribution by category and SKU.',
    category: 'Merchandising',
    created_at: '2025-01-20T00:00:00.000Z',
    updated_at: '2026-04-10T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VC1',
    slug: 'regional-kpis',
    title: 'Regional KPIs',
    description: 'Pre-aggregated executive KPIs per region including YoY growth.',
    category: 'Executive',
    created_at: '2025-01-05T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VC2',
    slug: 'same-store-growth',
    title: 'Same-Store Growth Tracker',
    description: 'Tracks comparable same-store sales growth excluding new-store openings.',
    category: 'Sales',
    created_at: '2025-02-15T00:00:00.000Z',
    updated_at: '2026-04-22T00:00:00.000Z',
  },
];
const extraCategories = ['Sales', 'Operations', 'Finance', 'Merchandising', 'Executive', 'Marketing'];
for (let i = 9; i <= 40; i++) {
  const cat = extraCategories[i % extraCategories.length];
  const num = String(i).padStart(2, '0');
  WORKBOOKS.push({
    id: `wb_EXTRA${num}000000000000000000000${i}`.slice(0, 29),
    slug: `analytical-workbook-${num}`,
    title: `Analytical Workbook ${num}`,
    description: `${cat} analytical workbook covering standard KPIs and trend analysis.`,
    category: cat,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  });
}

const insertWb = db.prepare(
  'INSERT OR IGNORE INTO workbook (id, slug, title, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
for (const wb of WORKBOOKS) {
  insertWb.run(wb.id, wb.slug, wb.title, wb.description, wb.category, wb.created_at, wb.updated_at);
  insertFts('workbook', wb.id, wb.title, wb.description);
}
console.log(`✓ ${WORKBOOKS.length} workbooks seeded`);

const VIEW_TYPES = ['bar', 'line', 'pie', 'treemap', 'histogram'] as const;

const defaultQ = (ds: string, field: string, value: string[]) =>
  JSON.stringify({ filters: [{ field, op: 'between', value }] });
const renderSpec = (type: string) => JSON.stringify({ chart_type: type, theme: 'default' });

interface ViewDef {
  id: string;
  workbook_id: string;
  datasource_id: string;
  slug: string;
  title: string;
  view_type: string;
  description: string;
  x_axis_label: string | null;
  y_axis_label: string | null;
  default_query_json: string;
  render_spec_json: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const VIEWS: ViewDef[] = [
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'q1-revenue-by-region',
    title: 'Q1 Revenue by Region',
    view_type: 'bar',
    description: 'Bar chart comparing net revenue across all regions for Q1 2026.',
    x_axis_label: 'Region',
    y_axis_label: 'Net Revenue',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A', 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('bar'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TL',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'weekly-revenue-trend',
    title: 'Weekly Revenue Trend',
    view_type: 'line',
    description: 'Line chart tracking weekly net revenue over the past 13 weeks.',
    x_axis_label: 'Week',
    y_axis_label: 'Net Revenue',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A', 'order_date', ['2026-01-26', '2026-04-27']),
    render_spec_json: renderSpec('line'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TM',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2H',
    slug: 'revenue-by-department',
    title: 'Revenue by Department',
    view_type: 'pie',
    description: 'Pie chart showing revenue share by product department for the current quarter.',
    x_axis_label: null,
    y_axis_label: null,
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2H', 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('pie'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TN',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2G',
    slug: 'store-performance-map',
    title: 'Store Performance Map',
    view_type: 'treemap',
    description: 'Treemap showing revenue contribution by store, sized by net revenue and colored by growth.',
    x_axis_label: null,
    y_axis_label: null,
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2G', 'report_month', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('treemap'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TO',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB5',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A',
    slug: 'order-volume-distribution',
    title: 'Order Volume Distribution',
    view_type: 'histogram',
    description: 'Histogram of daily order volumes, showing distribution shape and outliers.',
    x_axis_label: 'Daily Orders',
    y_axis_label: 'Frequency',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2A', 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec('histogram'),
    status: 'READY',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TP',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-by-stage',
    title: 'Pipeline by Stage',
    view_type: 'bar',
    description: 'Bar chart showing pipeline amount by opportunity stage for the latest snapshot.',
    x_axis_label: 'Stage',
    y_axis_label: 'Pipeline Amount',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D', 'snapshot_date', ['2026-04-01', '2026-04-30']),
    render_spec_json: renderSpec('bar'),
    status: 'READY',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TQ',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-trend',
    title: 'Pipeline Trend (4 Months)',
    view_type: 'line',
    description: 'Line chart tracking total pipeline and weighted pipeline across the last 4 monthly snapshots.',
    x_axis_label: 'Month',
    y_axis_label: 'Pipeline Amount',
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D', 'snapshot_date', ['2026-01-01', '2026-04-30']),
    render_spec_json: renderSpec('line'),
    status: 'READY',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'vw_01JTK8J4E8AM2R4T3YX3GZC3TR',
    workbook_id: 'wb_01JTK7M5P3NX9R2Q8YZ4KC1VB6',
    datasource_id: 'ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D',
    slug: 'pipeline-by-region',
    title: 'Pipeline by Region',
    view_type: 'treemap',
    description: 'Treemap of pipeline distribution by region, sized by total pipeline amount.',
    x_axis_label: null,
    y_axis_label: null,
    default_query_json: defaultQ('ds_01JTK6N6WQ8C6Q4PNM9H9J7Q2D', 'snapshot_date', ['2026-04-01', '2026-04-30']),
    render_spec_json: renderSpec('treemap'),
    status: 'READY',
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2026-04-30T00:00:00.000Z',
  },
];
let viewCounter = VIEWS.length;
const VIEW_WORKBOOKS = WORKBOOKS.slice(0, 8);
const DATASOURCE_IDS = DATASOURCES.filter(d => d.status !== 'OFFLINE').map(d => d.id);

for (let i = viewCounter; i < 220; i++) {
  const wb = VIEW_WORKBOOKS[i % VIEW_WORKBOOKS.length];
  const dsId = DATASOURCE_IDS[i % DATASOURCE_IDS.length];
  const vtype = VIEW_TYPES[i % VIEW_TYPES.length];
  const num = String(i).padStart(3, '0');
  const xLabel = ['bar', 'line', 'histogram'].includes(vtype) ? 'Category' : null;
  const yLabel = ['bar', 'line', 'histogram'].includes(vtype) ? 'Value' : null;
  VIEWS.push({
    id: `vw_VIEW${num}000000000000000000000${i}`.slice(0, 29),
    workbook_id: wb.id,
    datasource_id: dsId,
    slug: `view-${vtype}-${num}`,
    title: `${vtype.charAt(0).toUpperCase() + vtype.slice(1)} Chart ${num}`,
    view_type: vtype,
    description: `${vtype.charAt(0).toUpperCase() + vtype.slice(1)} view for broad analytics coverage.`,
    x_axis_label: xLabel,
    y_axis_label: yLabel,
    default_query_json: defaultQ(dsId, 'order_date', ['2026-01-01', '2026-03-31']),
    render_spec_json: renderSpec(vtype),
    status: i % 20 === 0 ? 'STALE' : 'READY',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  });
}

const insertView = db.prepare(
  'INSERT OR IGNORE INTO view (id, workbook_id, datasource_id, slug, title, view_type, description, x_axis_label, y_axis_label, default_query_json, render_spec_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
for (const v of VIEWS) {
  insertView.run(
    v.id,
    v.workbook_id,
    v.datasource_id,
    v.slug,
    v.title,
    v.view_type,
    v.description,
    v.x_axis_label,
    v.y_axis_label,
    v.default_query_json,
    v.render_spec_json,
    v.status,
    v.created_at,
    v.updated_at,
  );
  insertFts('view', v.id, v.title, v.description);
}
console.log(`✓ ${VIEWS.length} views seeded`);

const insertFilter = db.prepare(
  'INSERT OR IGNORE INTO view_allowed_filter (id, view_id, datasource_field_id, operator_list_json, default_value_json, is_required, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
);
const DATE_OPS = JSON.stringify(['between', 'in_relative_period']);
const STR_OPS = JSON.stringify(['eq', 'in', 'contains']);

insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TK',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1A',
  DATE_OPS,
  JSON.stringify(['2026-01-01', '2026-03-31']),
  1,
  1,
);
insertFilter.run(ulid('vaf_'), 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK', 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1B', STR_OPS, null, 0, 2);
insertFilter.run(ulid('vaf_'), 'vw_01JTK8J4E8AM2R4T3YX3GZC3TK', 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1E', STR_OPS, null, 0, 3);

insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TL',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R1A',
  DATE_OPS,
  JSON.stringify(['2026-01-26', '2026-04-27']),
  1,
  1,
);
insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TP',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4A',
  DATE_OPS,
  JSON.stringify(['2026-04-01', '2026-04-30']),
  1,
  1,
);
insertFilter.run(ulid('vaf_'), 'vw_01JTK8J4E8AM2R4T3YX3GZC3TP', 'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4B', STR_OPS, null, 0, 2);
insertFilter.run(
  ulid('vaf_'),
  'vw_01JTK8J4E8AM2R4T3YX3GZC3TQ',
  'fld_01JTK6N6WQ8C6Q4PNM9H9J7R4A',
  DATE_OPS,
  JSON.stringify(['2026-01-01', '2026-04-30']),
  1,
  1,
);

console.log('✓ view_allowed_filter populated');

const counts = {
  datasource: (db.prepare('SELECT COUNT(*) as c FROM datasource').get() as { c: number }).c,
  field: (db.prepare('SELECT COUNT(*) as c FROM datasource_field').get() as { c: number }).c,
  workbook: (db.prepare('SELECT COUNT(*) as c FROM workbook').get() as { c: number }).c,
  view: (db.prepare('SELECT COUNT(*) as c FROM view').get() as { c: number }).c,
  sales: salesCount,
};

console.log('\n📊 Seed Summary:');
console.log(`   Datasources : ${counts.datasource}`);
console.log(`   Fields      : ${counts.field}`);
console.log(`   Workbooks   : ${counts.workbook}`);
console.log(`   Views       : ${counts.view}`);
console.log(`   Sales rows  : ${counts.sales}`);
console.log('\n✅ Seed complete.');

db.close();
