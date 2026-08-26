// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0013
//
/* eslint-env jest */
// @ref llp/0013-doctor-fix.rfc.md §Reinstalling
import { vol } from 'memfs';

import { DEFAULT_PACKAGE_MANAGER, detectPackageManager, installArgv } from '../packageManager';

jest.mock('fs');
jest.mock('fs/promises');

const PROJECT = '/home/dev/app';

beforeEach(() => vol.reset());

/** Write a project with one lockfile next to its manifest. */
function projectWith(lockfileName?: string, extra: Record<string, string> = {}) {
  vol.fromJSON({
    [`${PROJECT}/package.json`]: '{}',
    ...(lockfileName ? { [`${PROJECT}/${lockfileName}`]: '' } : null),
    ...extra,
  });
}

describe('detectPackageManager', () => {
  it.each([
    ['pnpm-lock.yaml', 'pnpm'],
    ['package-lock.json', 'npm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
  ])('reads %s as %s', (lockfileName, expected) => {
    projectWith(lockfileName);
    expect(detectPackageManager(PROJECT)).toEqual({
      name: expected,
      lockfile: `${PROJECT}/${lockfileName}`,
      installCwd: PROJECT,
    });
  });

  // npm is the only answer that is true on every machine, so it is what a project with no lockfile
  // is reinstalled with — and `lockfile: null` says the answer was a fallback, not a reading.
  it('falls back to npm with no lockfile, and says so', () => {
    projectWith();
    expect(detectPackageManager(PROJECT)).toEqual({
      name: DEFAULT_PACKAGE_MANAGER,
      lockfile: null,
      installCwd: PROJECT,
    });
  });

  // A package of a monorepo has no lockfile of its own, and `npm install` run inside one writes a
  // second lockfile there instead of installing the workspace.
  it('walks up to the workspace lockfile, and installs where it found it', () => {
    vol.fromJSON({
      '/home/dev/monorepo/pnpm-lock.yaml': '',
      '/home/dev/monorepo/packages/app/package.json': '{}',
    });
    expect(detectPackageManager('/home/dev/monorepo/packages/app')).toEqual({
      name: 'pnpm',
      lockfile: '/home/dev/monorepo/pnpm-lock.yaml',
      installCwd: '/home/dev/monorepo',
    });
  });

  it("prefers the project's own lockfile over the workspace one above it", () => {
    vol.fromJSON({
      '/home/dev/monorepo/pnpm-lock.yaml': '',
      '/home/dev/monorepo/packages/app/package.json': '{}',
      '/home/dev/monorepo/packages/app/yarn.lock': '',
    });
    expect(detectPackageManager('/home/dev/monorepo/packages/app')).toMatchObject({
      name: 'yarn',
      installCwd: '/home/dev/monorepo/packages/app',
    });
  });

  // The precedence within one directory mirrors `@expo/package-manager`'s `RESOLUTION_ORDER`, so a
  // project with two lockfiles is reinstalled with what `expo prebuild` would have used.
  it('breaks a two-lockfile tie the way the Expo CLI does', () => {
    projectWith('yarn.lock', { [`${PROJECT}/package-lock.json`]: '' });
    expect(detectPackageManager(PROJECT).name).toBe('yarn');
  });

  it('terminates at the filesystem root', () => {
    vol.fromJSON({ '/package.json': '{}' });
    expect(detectPackageManager('/')).toEqual({
      name: DEFAULT_PACKAGE_MANAGER,
      lockfile: null,
      installCwd: '/',
    });
  });
});

describe('installArgv', () => {
  it('is the manager and its install verb', () => {
    expect(installArgv('pnpm')).toEqual(['pnpm', 'install']);
    expect(installArgv('bun')).toEqual(['bun', 'install']);
  });
});
