// @ref llp/0024-cli-ui.rfc.md §The program names itself
// The walk that finds the CLI's own `package.json`.
//
// What this tier can check is the walk: which manifest it stops at, and what it does when the one
// it finds is not an answer. What it *cannot* check is the property the whole design exists for —
// that the read happens at runtime rather than at build time — because in-process there is no build
// to inline anything. That is `e2e/__tests__/program-name-test.ts`, which edits the manifest of a
// built copy and runs it.
import { vol } from 'memfs';

import { FALLBACK_PROGRAM_NAME, PROGRAM_NAME, PROGRAM_PREFIX, readProgramNameFrom } from '../programName';

jest.mock('fs');

afterEach(() => vol.reset());

describe(readProgramNameFrom, () => {
  it(`answers the name of the manifest in the directory itself`, () => {
    vol.fromJSON({ '/pkg/package.json': '{"name":"@scope/tool"}' });

    expect(readProgramNameFrom('/pkg')).toBe('@scope/tool');
  });

  // The bundle sits two directories below the manifest, which is the layout the CLI ships in:
  // `build/cli/index.js` is what `bin/cli.js` requires, so the walk starts at `build/cli`.
  it(`walks up from the bundle to the package that holds it`, () => {
    vol.fromJSON({ '/pkg/package.json': '{"name":"@scope/tool"}', '/pkg/build/cli/index.js': '' });

    expect(readProgramNameFrom('/pkg/build/cli')).toBe('@scope/tool');
  });

  // A bundler may leave a manifest of its own beside its output — `{"type":"commonjs"}` and
  // nothing else. Stopping at the nearest *file* would answer with no name at all.
  it(`walks past a manifest that names nothing`, () => {
    vol.fromJSON({
      '/pkg/package.json': '{"name":"@scope/tool"}',
      '/pkg/build/cli/package.json': '{"type":"commonjs"}',
    });

    expect(readProgramNameFrom('/pkg/build/cli')).toBe('@scope/tool');
  });

  it(`walks past a manifest that is not JSON`, () => {
    vol.fromJSON({
      '/pkg/package.json': '{"name":"@scope/tool"}',
      '/pkg/build/package.json': 'not json',
    });

    expect(readProgramNameFrom('/pkg/build')).toBe('@scope/tool');
  });

  // The nearest one wins, which is what makes a copy of this package answer for itself rather than
  // for the workspace it was copied out of.
  it(`stops at the nearest manifest that has a name`, () => {
    vol.fromJSON({
      '/repo/package.json': '{"name":"monorepo"}',
      '/repo/packages/tool/package.json': '{"name":"@scope/tool"}',
    });

    expect(readProgramNameFrom('/repo/packages/tool/build/cli')).toBe('@scope/tool');
  });

  it(`answers null when the walk reaches the root with nothing`, () => {
    vol.fromJSON({ '/pkg/build/cli/index.js': '' });

    expect(readProgramNameFrom('/pkg/build/cli')).toBeNull();
  });
});

describe('the resolved name', () => {
  // Help that crashes over its own banner is worse than help that prints a stale name, so an
  // unreadable installation still has a name. Under the suite-wide `fs` mock this is the branch
  // that runs, which is also why every assertion about printed output in this tier reads as it did
  // before the name was made dynamic.
  it(`falls back to the published name, and never to nothing`, () => {
    expect(PROGRAM_NAME).toBe(FALLBACK_PROGRAM_NAME);
    expect(PROGRAM_NAME.length).toBeGreaterThan(0);
  });

  it(`is invoked with npx, which is what works for a scoped name too`, () => {
    expect(PROGRAM_PREFIX).toBe(`npx ${PROGRAM_NAME}`);
  });
});
