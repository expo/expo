import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, it } from 'node:test';

import { EXPO_DIR } from '../Constants';
import { spawnAsync } from '../Utils';
import { normalizeCanaryVersionsAsync } from './Canary';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-canary-integration-'));

after(() => fs.rmSync(fixture, { recursive: true, force: true }));

it('uses calculated major and patch versions for a Changesets canary snapshot', async () => {
  fs.mkdirSync(path.join(fixture, '.changeset'), { recursive: true });
  for (const [name, version] of [
    ['expo', '58.0.0-preview.1'],
    ['independent', '1.2.3'],
  ]) {
    fs.mkdirSync(path.join(fixture, 'packages', name), { recursive: true });
    fs.writeFileSync(
      path.join(fixture, 'packages', name, 'package.json'),
      `${JSON.stringify({ name, version })}\n`
    );
  }
  fs.writeFileSync(path.join(fixture, 'package.json'), '{"private":true,"name":"fixture"}\n');
  fs.writeFileSync(path.join(fixture, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
  fs.writeFileSync(
    path.join(fixture, '.changeset/config.json'),
    `${JSON.stringify({
      changelog: false,
      commit: false,
      access: 'public',
      baseBranch: 'main',
      updateInternalDependencies: 'patch',
      ignore: [],
      fixed: [],
      linked: [],
      privatePackages: { version: false, tag: false },
      snapshot: {
        useCalculatedVersion: true,
        prereleaseTemplate: '{tag}-{datetime}-{commit}',
      },
    })}\n`
  );
  fs.writeFileSync(
    path.join(fixture, '.changeset/canary.md'),
    '---\n"expo": major\n"independent": patch\n---\n\nCanary.\n'
  );
  fs.writeFileSync(
    path.join(fixture, '.changeset/real-intent.md'),
    '---\n"independent": minor\n---\n\nAdd an independent feature.\n'
  );

  await normalizeCanaryVersionsAsync(
    [
      {
        name: 'expo',
        version: '58.0.0-preview.1',
        path: path.join(fixture, 'packages/expo'),
      },
    ],
    58,
    'main'
  );

  await spawnAsync(
    'node',
    [path.join(EXPO_DIR, 'node_modules/@changesets/cli/bin.js'), 'version', '--snapshot', 'canary'],
    { cwd: fixture }
  );

  const expo = JSON.parse(
    fs.readFileSync(path.join(fixture, 'packages/expo/package.json'), 'utf8')
  );
  const independent = JSON.parse(
    fs.readFileSync(path.join(fixture, 'packages/independent/package.json'), 'utf8')
  );
  assert.match(expo.version, /^59\.0\.0-canary-\d{14}-$/);
  assert.match(independent.version, /^1\.3\.0-canary-\d{14}-$/);
});
