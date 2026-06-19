// Runs every scenario against legacy `xcode` and the shim and asserts they agree
// semantically. Scenarios whose shim methods are implemented (IMPLEMENTED) must
// match; the rest must still throw "not implemented yet" — that set is the
// commit 4..N worklist and keeps this suite green as it shrinks.

import { Backend, legacyBackend, shimBackend } from './adapters';
import { compareResults, compareSemantics, normalizedTextDiff } from './comparator';
import { FIXTURES, FixtureName, fixturePath } from './fixtures';
import { Scenario, scenarios } from './scenarios';

const IMPLEMENTED = new Set<string>([
  'build-settings/set-bundle-identifier',
  'build-settings/set-development-team',
  'build-settings/set-deployment-target',
  'build-settings/toggle-bitcode',
  'build-settings/set-device-family',
  'build-settings/update-product-name',
  'build-settings/set-entitlements',
  'build-settings/update-property-for-target',
  'files/has-file',
  'files/ensure-group-recursively',
  'files/add-resource-file',
  'files/add-resource-file-no-build',
  'files/add-source-file',
  'files/add-duplicate-resource',
  'files/add-pbx-group',
  'files/add-to-pbx-group',
  'build-settings/add-header-search-paths',
  'build-settings/add-other-linker-flags',
  'misc/add-known-region',
  'build-phases/add-shell-script',
  'build-phases/add-copy-files',
  'build-phases/build-phase-object',
]);

function runOn(backend: Backend, scenario: Scenario): { result: unknown; pbxproj: string } {
  const ctx = backend.load(fixturePath(scenario.fixture));
  const result = scenario.run(ctx);
  return { result, pbxproj: ctx.project.writeSync() };
}

describe('substrate: unmutated legacy vs shim are semantically equal', () => {
  for (const name of Object.keys(FIXTURES) as FixtureName[]) {
    it(name, () => {
      const legacy = legacyBackend.load(fixturePath(name)).project.writeSync();
      const shim = shimBackend.load(fixturePath(name)).project.writeSync();
      const diff = compareSemantics(legacy, shim);
      if (!diff.equal) {
        throw new Error(
          `semantic divergence at "${diff.path}"\n  legacy: ${JSON.stringify(diff.legacy)}\n  shim:   ${JSON.stringify(diff.shim)}`
        );
      }
    });
  }
});

const textReport: { name: string; onlyLegacy: string[]; onlyShim: string[] }[] = [];

describe('differential: legacy vs shim', () => {
  for (const scenario of scenarios) {
    const implemented = IMPLEMENTED.has(scenario.name);

    it(scenario.name, () => {
      const legacy = runOn(legacyBackend, scenario);

      if (!implemented) {
        expect(() => runOn(shimBackend, scenario)).toThrow(/not implemented yet/);
        return;
      }

      const shim = runOn(shimBackend, scenario);

      const semantic = compareSemantics(legacy.pbxproj, shim.pbxproj);
      if (!semantic.equal) {
        throw new Error(
          `semantic divergence at "${semantic.path}"\n  legacy: ${JSON.stringify(semantic.legacy)}\n  shim:   ${JSON.stringify(semantic.shim)}`
        );
      }

      const results = compareResults(legacy.result, shim.result);
      if (!results.equal) {
        throw new Error(
          `read-result divergence at "${results.path}"\n  legacy: ${JSON.stringify(results.legacy)}\n  shim:   ${JSON.stringify(results.shim)}`
        );
      }

      const diff = normalizedTextDiff(legacy.pbxproj, shim.pbxproj);
      if (diff.onlyLegacy.length || diff.onlyShim.length) {
        textReport.push({ name: scenario.name, ...diff });
      }
    });
  }

  afterAll(() => {
    if (textReport.length) {
      // Secondary, non-failing: accepted-cosmetic text divergences to triage.
      console.log('\nAccepted text divergences (semantically equal):');
      for (const entry of textReport) {
        console.log(`\n• ${entry.name}`);
        entry.onlyLegacy.forEach((l) => console.log(`  - legacy: ${l.trim()}`));
        entry.onlyShim.forEach((l) => console.log(`  + shim:   ${l.trim()}`));
      }
    }
  });
});
