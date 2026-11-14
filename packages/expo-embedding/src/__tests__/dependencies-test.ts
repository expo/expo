import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { detachSharedNodeModules, getPackageManager, getInstallArguments } from '../dependencies';
let root: string;
let project: string;
let shared: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'expo-dependencies-test-'));
  project = join(root, 'app/expo');
  shared = join(root, 'checkout/node_modules');
  mkdirSync(project, { recursive: true });
  mkdirSync(shared, { recursive: true });
  writeFileSync(join(project, 'package.json'), '{"dependencies":{"expo":"58.0.14"}}');
  writeFileSync(join(shared, 'sentinel'), 'shared contents');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
describe('Installing app-owned dependencies', () => {
  it('should preserve pnpm workspace store links and use the workspace lockfile', async () => {
    const workspace = join(root, 'app');
    writeFileSync(join(workspace, 'pnpm-workspace.yaml'), 'packages:\n  - expo\n');
    writeFileSync(join(workspace, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    mkdirSync(join(project, 'node_modules/@expo'), { recursive: true });
    for (const name of ['expo', '@expo/example']) {
      const store = join(
        workspace,
        'node_modules/.pnpm',
        name.replace('/', '+'),
        'node_modules',
        name
      );
      mkdirSync(store, { recursive: true });
      symlinkSync(store, join(project, 'node_modules', name));
    }
    expect(await detachSharedNodeModules(project, true)).toBeUndefined();
    expect(await detachSharedNodeModules(project)).toBeUndefined();
    expect(await getPackageManager(project, workspace)).toBe('pnpm');
    expect(await getInstallArguments(project, 'pnpm', true, workspace)).toEqual([
      'install',
      '--frozen-lockfile',
    ]);
    expect(lstatSync(join(project, 'node_modules/expo')).isSymbolicLink()).toBe(true);
  });
  it('should ignore workspace declarations above the integration root', async () => {
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - other/*\n');
    writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    expect(await getPackageManager(project, join(root, 'app'))).toBe('npm');
    await expect(getInstallArguments(project, 'pnpm', true, join(root, 'app'))).rejects.toThrow(
      `requires a lockfile in ${project}`
    );
  });
  it('should use reproducible installs when a matching lockfile exists', async () => {
    writeFileSync(join(project, 'package-lock.json'), '{}');
    expect(await getInstallArguments(project, 'npm', true)).toEqual(['ci']);
    expect(await getInstallArguments(project, 'npm', false)).toEqual(['install']);
    writeFileSync(join(project, 'pnpm-lock.yaml'), '');
    expect(await getInstallArguments(project, 'pnpm', true)).toEqual([
      'install',
      '--frozen-lockfile',
    ]);
  });
  it('should reject a frozen install without a lockfile', async () => {
    await expect(getInstallArguments(project, 'npm', true)).rejects.toThrow('lockfile');
  });
  it('should leave legacy links untouched when a frozen install cannot migrate them', async () => {
    symlinkSync(shared, join(project, 'node_modules'));
    await expect(detachSharedNodeModules(project, true)).rejects.toThrow('frozen');
    expect(lstatSync(join(project, 'node_modules')).isSymbolicLink()).toBe(true);
  });
  it('should default to npm and honor an existing lockfile', async () => {
    expect(await getPackageManager(project)).toBe('npm');
    writeFileSync(join(project, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    expect(await getPackageManager(project)).toBe('pnpm');
  });
  it('should prefer the explicit package manager over conflicting lockfiles', async () => {
    writeFileSync(join(project, 'package.json'), '{"packageManager":"yarn@4.0.0"}');
    writeFileSync(join(project, 'package-lock.json'), '{}');
    expect(await getPackageManager(project)).toBe('yarn');
  });
  it('should reject ambiguous lockfiles and unsupported package managers', async () => {
    writeFileSync(join(project, 'package-lock.json'), '{}');
    writeFileSync(join(project, 'bun.lock'), '{}');
    await expect(getPackageManager(project)).rejects.toThrow('Multiple package manager lockfiles');
    writeFileSync(join(project, 'package.json'), '{"packageManager":"unknown@1"}');
    await expect(getPackageManager(project)).rejects.toThrow('Unsupported packageManager');
  });
  it('should back up a shared node_modules link without touching its target', async () => {
    symlinkSync(shared, join(project, 'node_modules'));
    const backup = await detachSharedNodeModules(project);
    expect(backup).toBeDefined();
    expect(lstatSync(join(backup!, 'node_modules')).isSymbolicLink()).toBe(true);
    expect(existsSync(join(project, 'node_modules'))).toBe(false);
    expect(readFileSync(join(shared, 'sentinel'), 'utf8')).toBe('shared contents');
  });
  it('should detach a directory containing legacy package or scope links', async () => {
    mkdirSync(join(project, 'node_modules'));
    mkdirSync(join(shared, 'expo'));
    symlinkSync(join(shared, 'expo'), join(project, 'node_modules/expo'));
    expect(await detachSharedNodeModules(project)).toBeDefined();
    mkdirSync(join(project, 'node_modules'));
    symlinkSync(shared, join(project, 'node_modules/@expo'));
    expect(await detachSharedNodeModules(project)).toBeDefined();
    expect(readFileSync(join(shared, 'sentinel'), 'utf8')).toBe('shared contents');
  });
  it('should handle dangling legacy links', async () => {
    symlinkSync(join(root, 'deleted-checkout'), join(project, 'node_modules'));
    const backup = await detachSharedNodeModules(project);
    expect(lstatSync(join(backup!, 'node_modules')).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(project, 'node_modules'), { throwIfNoEntry: false })).toBeUndefined();
  });
  it('should preserve package manager links inside the app and explicitly declared local packages', async () => {
    mkdirSync(join(project, 'node_modules/.pnpm/expo'), { recursive: true });
    symlinkSync('.pnpm/expo', join(project, 'node_modules/expo'));
    symlinkSync(shared, join(project, 'node_modules/local-module'));
    writeFileSync(
      join(project, 'package.json'),
      '{"dependencies":{"expo":"58.0.14","local-module":"file:../../checkout/node_modules"}}'
    );
    expect(await detachSharedNodeModules(project)).toBeUndefined();
    expect(lstatSync(join(project, 'node_modules/expo')).isSymbolicLink()).toBe(true);
  });
  it('should back up a legacy npm lockfile that contradicts a declared registry dependency', async () => {
    const lock = JSON.stringify({
      packages: {
        'node_modules/expo': { link: true, resolved: '../../checkout/expo' },
      },
    });
    writeFileSync(join(project, 'package-lock.json'), lock);
    const backup = await detachSharedNodeModules(project);
    expect(backup).toBeDefined();
    expect(readFileSync(join(backup!, 'package-lock.json'), 'utf8')).toBe(lock);
    expect(existsSync(join(project, 'package-lock.json'))).toBe(false);
  });
  it('should keep a valid lockfile with intentional file dependencies', async () => {
    writeFileSync(
      join(project, 'package.json'),
      '{"dependencies":{"expo":"file:../../checkout/expo"}}'
    );
    const lock = JSON.stringify({
      packages: {
        'node_modules/expo': { link: true, resolved: '../../checkout/expo' },
      },
    });
    writeFileSync(join(project, 'package-lock.json'), lock);
    expect(await detachSharedNodeModules(project)).toBeUndefined();
    expect(readFileSync(join(project, 'package-lock.json'), 'utf8')).toBe(lock);
  });
});
