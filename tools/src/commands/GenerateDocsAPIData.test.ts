/**
 * Guards `PACKAGES_MAPPING` against source files moving or disappearing.
 * Two entries went stale unnoticed (`FilterChip` after it merged into `Chip`,
 * `Speech/Speech.ts` after the package flattened its layout) because a dead
 * entry only surfaced as a generation-time error.
 */

import fs from 'fs-extra';
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';

import { PACKAGES_DIR } from '../Constants';
import { PACKAGES_MAPPING } from './GenerateDocsAPIData';

describe('PACKAGES_MAPPING', () => {
  it('every entry point resolves to an existing source file', () => {
    const missing: string[] = [];
    for (const [key, [entryPoint, packageName]] of Object.entries(PACKAGES_MAPPING)) {
      const entryPoints = Array.isArray(entryPoint) ? entryPoint : [entryPoint];
      for (const entry of entryPoints) {
        const entryPath = path.join(PACKAGES_DIR, packageName ?? key, 'src', entry);
        if (!fs.existsSync(entryPath)) {
          missing.push(`${key} -> ${entryPath}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });
});
