/* eslint-env jest */
// @ref llp/0013-doctor-fix.rfc.md §Path safety
// The one predicate every target passes through, as a table. This is the test that matters most in
// the command: everything else decides *whether* to delete something, and this decides whether the
// path it is about to hand to `rm -rf` is one it is allowed to name.
import { vol } from 'memfs';
import path from 'path';

import { rejectUnsafeTarget, type TargetSafetyContext } from '../fixSafety';

jest.mock('fs');
jest.mock('fs/promises');

const PROJECT = '/home/dev/app';
const HOME = '/home/dev';
const TMP = '/tmp/T';

function context(overrides: Partial<TargetSafetyContext> = {}): TargetSafetyContext {
  return {
    projectRoot: PROJECT,
    homeDir: HOME,
    tmpDir: TMP,
    scope: 'project',
    allowMachineWide: false,
    ...overrides,
  };
}

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    [`${PROJECT}/package.json`]: '{}',
    [`${PROJECT}/node_modules/.cache/x`]: 'x',
    [`${PROJECT}/.expo/web/cache/y`]: 'y',
    [`${TMP}/metro-cache/z`]: 'z',
    [`${TMP}/metro-file-map-expo-abc-def`]: 'map',
    [`${HOME}/Library/Developer/Xcode/DerivedData/app-abc/build`]: 'b',
    [`${HOME}/elsewhere/thing`]: 't',
  });
});

describe('rejectUnsafeTarget', () => {
  it('accepts a directory inside the project', () => {
    expect(rejectUnsafeTarget(`${PROJECT}/node_modules/.cache`, context())).toBeNull();
    expect(rejectUnsafeTarget(`${PROJECT}/.expo/web/cache`, context())).toBeNull();
  });

  // `$TMPDIR/metro-file-map-expo-<md5 of the project root>-…` is outside the project directory and
  // is still this project's alone: the project root is in its name.
  it('accepts a project-scoped target inside the temporary directory', () => {
    expect(rejectUnsafeTarget(`${TMP}/metro-file-map-expo-abc-def`, context())).toBeNull();
  });

  it('rejects the project root itself', () => {
    expect(rejectUnsafeTarget(PROJECT, context())).toMatch(/project root/i);
  });

  it('rejects a parent of the project root', () => {
    expect(rejectUnsafeTarget(HOME, context())).toBeTruthy();
    expect(rejectUnsafeTarget('/home', context())).toBeTruthy();
  });

  it('rejects the filesystem root', () => {
    expect(rejectUnsafeTarget('/', context())).toBeTruthy();
    expect(
      rejectUnsafeTarget('/', context({ scope: 'machine', allowMachineWide: true }))
    ).toBeTruthy();
  });

  it('rejects the home directory', () => {
    expect(rejectUnsafeTarget(HOME, context({ scope: 'machine', allowMachineWide: true }))).toMatch(
      /home directory/i
    );
  });

  it('rejects the temporary directory itself', () => {
    expect(rejectUnsafeTarget(TMP, context({ scope: 'machine', allowMachineWide: true }))).toMatch(
      /temporary directory/i
    );
  });

  it('rejects a project-scoped path that is neither in the project nor in the temporary directory', () => {
    expect(rejectUnsafeTarget(`${HOME}/elsewhere/thing`, context())).toMatch(/outside/i);
  });

  it('rejects a machine-wide target without the flag, and accepts it with one', () => {
    const target = `${TMP}/metro-cache`;
    expect(rejectUnsafeTarget(target, context({ scope: 'machine' }))).toMatch(
      /--allow-machine-wide/
    );
    expect(
      rejectUnsafeTarget(target, context({ scope: 'machine', allowMachineWide: true }))
    ).toBeNull();
  });

  it('rejects a machine-wide target outside every allowlisted root, even with the flag', () => {
    expect(
      rejectUnsafeTarget(
        `${HOME}/elsewhere/thing`,
        context({ scope: 'machine', allowMachineWide: true })
      )
    ).toMatch(/allowlist/i);
  });

  it('accepts the per-project DerivedData directory and rejects its root', () => {
    const derived = `${HOME}/Library/Developer/Xcode/DerivedData`;
    expect(
      rejectUnsafeTarget(
        `${derived}/app-abc`,
        context({ scope: 'machine', allowMachineWide: true })
      )
    ).toBeNull();
    expect(
      rejectUnsafeTarget(derived, context({ scope: 'machine', allowMachineWide: true }))
    ).toBeTruthy();
  });

  it('rejects a relative path', () => {
    expect(rejectUnsafeTarget('node_modules/.cache', context())).toMatch(/absolute/i);
  });

  it('rejects a path that escapes the project with ..', () => {
    expect(rejectUnsafeTarget(`${PROJECT}/../../etc`, context())).toBeTruthy();
  });

  // A symlink is the one shape where the path a caller reads and the bytes `rm -rf` reaches are
  // different things, so it is refused rather than resolved: nothing in the table needs one.
  it('rejects a symlink', () => {
    vol.symlinkSync(`${HOME}/elsewhere`, `${PROJECT}/node_modules/.cache-link`);
    expect(rejectUnsafeTarget(`${PROJECT}/node_modules/.cache-link`, context())).toMatch(
      /symlink/i
    );
  });

  // The parent may be the link instead, which the lstat of the target itself never sees.
  it('rejects a path whose realpath escapes the scope it was allowed under', () => {
    vol.mkdirSync(`${PROJECT}/nested`, { recursive: true });
    vol.symlinkSync(`${HOME}/elsewhere`, `${PROJECT}/nested/link`);
    expect(rejectUnsafeTarget(`${PROJECT}/nested/link/thing`, context())).toBeTruthy();
  });

  // macOS answers `os.tmpdir()` with `/var/folders/…` and `/var` is a symlink to `/private/var`,
  // so every real path under the temporary directory starts somewhere the declared root does not.
  // Resolving only the target and not the root made the command refuse its own Metro file map.
  it('accepts a target under a root that is itself a symlink', () => {
    vol.mkdirSync('/private/varlike/T', { recursive: true });
    vol.writeFileSync('/private/varlike/T/metro-cache', 'c');
    vol.symlinkSync('/private/varlike', '/varlike');
    expect(
      rejectUnsafeTarget('/varlike/T/metro-cache', {
        ...context({ scope: 'machine', allowMachineWide: true }),
        tmpDir: '/varlike/T',
      })
    ).toBeNull();
  });

  // A target that does not exist is not unsafe. The planner is what decides it is not worth a step.
  it('accepts a path that does not exist yet', () => {
    expect(rejectUnsafeTarget(`${PROJECT}/android/build`, context())).toBeNull();
  });

  it('normalizes a trailing separator before comparing', () => {
    expect(rejectUnsafeTarget(`${PROJECT}${path.sep}`, context())).toMatch(/project root/i);
  });
});
