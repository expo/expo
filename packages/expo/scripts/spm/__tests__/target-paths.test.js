'use strict';

const fs = require('fs');
const path = require('path');

const { parseDumpedManifest, resolveTargetPaths } = require('../manifests');

// tools/src/prebuilds/CheckedInManifest.targetPaths.test.ts runs the same cases.
const fixturesDir = path.join(__dirname, 'fixtures', 'target-paths');
const cases = fs
  .readdirSync(fixturesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

it('finds target path fixtures', () => {
  expect(cases.length).toBeGreaterThan(0);
});

describe.each(cases)('resolveTargetPaths: %s', (name) => {
  const caseDir = path.join(fixturesDir, name);
  const expected = JSON.parse(fs.readFileSync(path.join(caseDir, 'expected.json'), 'utf8'));

  it('matches expected.json', () => {
    const { targets } = parseDumpedManifest(
      fs.readFileSync(path.join(caseDir, 'dump.json'), 'utf8')
    );
    const resolved = resolveTargetPaths(targets, caseDir);
    expect({
      targets: Object.fromEntries(resolved.targets.map((target) => [target.name, target.path])),
      unresolved: resolved.unresolvedTargets,
    }).toEqual(expected);
  });
});
