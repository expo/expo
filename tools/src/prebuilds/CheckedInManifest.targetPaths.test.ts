import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { it } from 'node:test';

import { resolveCheckedInTargetSourceRoot } from './CheckedInManifest';

// Shared with packages/expo/scripts/spm/__tests__/target-paths.test.js, so the two dump
// parsers agree on where a target's sources live. src/ and build/ sit at the same depth.
const fixturesDir = path.resolve(
  __dirname,
  '../../../packages/expo/scripts/spm/__tests__/fixtures/target-paths'
);
const cases = fs
  .readdirSync(fixturesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

type Dump = { targets: { name: string; type: string; path?: string }[] };
type Expected = { targets: Record<string, string>; unresolved: string[] };

it('finds target path fixtures', () => {
  assert.ok(cases.length > 0, `no fixtures in ${fixturesDir}`);
});

for (const name of cases) {
  it(`target paths: ${name} matches expected.json`, () => {
    const caseDir = path.join(fixturesDir, name);
    const readJson = <T>(file: string): T =>
      JSON.parse(fs.readFileSync(path.join(caseDir, file), 'utf8'));
    const expected = readJson<Expected>('expected.json');
    const regular = readJson<Dump>('dump.json').targets.filter(
      (target) => target.type === 'regular'
    );
    const canonicalCaseDir = fs.realpathSync.native(caseDir);

    const resolved: Record<string, string> = {};
    const unresolved: string[] = [];
    for (const target of regular) {
      try {
        const sourceRoot = resolveCheckedInTargetSourceRoot(
          caseDir,
          'Fixture',
          target,
          regular.length
        );
        resolved[target.name] = path.relative(canonicalCaseDir, sourceRoot);
      } catch (error) {
        assert.match(String(error), /does not resolve to a real directory/);
        unresolved.push(target.name);
      }
    }
    assert.deepEqual({ targets: resolved, unresolved }, expected);
  });
}
