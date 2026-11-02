import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { it } from 'node:test';

import { glob, globSync } from './Glob';

it('applies path-based ignores without excluding the same basename elsewhere', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'expotools-glob-'));
  try {
    await fs.mkdir(path.join(cwd, 'Nested'));
    await fs.mkdir(path.join(cwd, 'Tests'));
    for (const file of ['Keep.swift', 'Omit.swift', 'Nested/Omit.swift', 'Tests/Omit.swift']) {
      await fs.writeFile(path.join(cwd, file), '');
    }
    for (const pattern of ['**/*', '**/*.swift', '{Nested,Tests}/*.swift']) {
      const options = { cwd, ignore: ['Omit.swift', 'Nested/Omit.swift'], onlyFiles: true };
      const expected = pattern.startsWith('{')
        ? ['Tests/Omit.swift']
        : ['Keep.swift', 'Tests/Omit.swift'];
      assert.deepEqual(globSync(pattern, options).sort(), expected);
      assert.deepEqual((await glob(pattern, options)).sort(), expected);
    }
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});
