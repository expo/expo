// Runs every scenario against the real legacy `xcode` library and snapshots the
// result: the golden baseline the shim must reproduce. Commit 3 reuses
// `scenarios` to diff the same sequences against `XcodeProjectShim`.

import { legacyBackend } from './adapters';
import { fixturePath } from './fixtures';
import { normalizeResult, normalizeUuids } from './normalize';
import { scenarios } from './scenarios';

describe('legacy xcode golden baseline', () => {
  it('covers every scenario with a unique name', () => {
    const names = scenarios.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(0);
  });

  for (const scenario of scenarios) {
    it(scenario.name, () => {
      const ctx = legacyBackend.load(fixturePath(scenario.fixture));
      const result = scenario.run(ctx);
      const pbxproj = normalizeUuids(ctx.project.writeSync());

      expect({ result: normalizeResult(result), pbxproj }).toMatchSnapshot();
    });
  }
});
