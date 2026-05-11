#!/usr/bin/env node

import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '../../appendix/examples');

const files = readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.json'));
let passed = 0;
let failed = 0;

for (const file of files) {
  try {
    const raw = readFileSync(join(EXAMPLES_DIR, file), 'utf-8');
    JSON.parse(raw);
    console.log(`✓ ${file}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${file}: ${err}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${files.length} files`);
if (failed > 0) process.exit(1);
