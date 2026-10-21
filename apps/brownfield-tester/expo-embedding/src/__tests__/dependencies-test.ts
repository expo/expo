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
  it('should use reproducible installs when a matching lockfile exists', () => {
    writeFileSync(join(project, 'package-lock.json'), '{}');
    expect(getInstallArguments(project, 'npm', true)).toEqual(['ci']);
    expect(getInstallArguments(project, 'npm', false)).toEqual(['install']);
    writeFileSync(join(project, 'pnpm-lock.yaml'), '');
    expect(getInstallArguments(project, 'pnpm', true)).toEqual(['install', '--frozen-lockfile']);
  });

  it('should reject a frozen install without a lockfile', () => {
    expect(() => getInstallArguments(project, 'npm', true)).toThrow('lockfile');
  });

  it('should leave legacy links untouched when a frozen install cannot migrate them', () => {
    symlinkSync(shared, join(project, 'node_modules'));
    expect(() => detachSharedNodeModules(project, true)).toThrow('frozen');
    expect(lstatSync(join(project, 'node_modules')).isSymbolicLink()).toBe(true);
  });

  it('should default to npm and honor an existing lockfile', () => {
    expect(getPackageManager(project)).toBe('npm');
    writeFileSync(join(project, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    expect(getPackageManager(project)).toBe('pnpm');
  });

  it('should prefer the explicit package manager over conflicting lockfiles', () => {
    writeFileSync(join(project, 'package.json'), '{"packageManager":"yarn@4.0.0"}');
    writeFileSync(join(project, 'package-lock.json'), '{}');
    expect(getPackageManager(project)).toBe('yarn');
  });

  it('should reject ambiguous lockfiles and unsupported package managers', () => {
    writeFileSync(join(project, 'package-lock.json'), '{}');
    writeFileSync(join(project, 'bun.lock'), '{}');
    expect(() => getPackageManager(project)).toThrow('Multiple package manager lockfiles');
    writeFileSync(join(project, 'package.json'), '{"packageManager":"unknown@1"}');
    expect(() => getPackageManager(project)).toThrow('Unsupported packageManager');
  });

  it('should back up a shared node_modules link without touching its target', () => {
    symlinkSync(shared, join(project, 'node_modules'));
    const backup = detachSharedNodeModules(project);
    expect(backup).toBeDefined();
    expect(lstatSync(join(backup!, 'node_modules')).isSymbolicLink()).toBe(true);
    expect(existsSync(join(project, 'node_modules'))).toBe(false);
    expect(readFileSync(join(shared, 'sentinel'), 'utf8')).toBe('shared contents');
  });

  it('should detach a directory containing legacy package or scope links', () => {
    mkdirSync(join(project, 'node_modules'));
    mkdirSync(join(shared, 'expo'));
    symlinkSync(join(shared, 'expo'), join(project, 'node_modules/expo'));
    expect(detachSharedNodeModules(project)).toBeDefined();
    mkdirSync(join(project, 'node_modules'));
    symlinkSync(shared, join(project, 'node_modules/@expo'));
    expect(detachSharedNodeModules(project)).toBeDefined();
    expect(readFileSync(join(shared, 'sentinel'), 'utf8')).toBe('shared contents');
  });

  it('should handle dangling legacy links', () => {
    symlinkSync(join(root, 'deleted-checkout'), join(project, 'node_modules'));
    const backup = detachSharedNodeModules(project);
    expect(lstatSync(join(backup!, 'node_modules')).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(project, 'node_modules'), { throwIfNoEntry: false })).toBeUndefined();
  });

  it('should preserve package manager links inside the app and explicitly declared local packages', () => {
    mkdirSync(join(project, 'node_modules/.pnpm/expo'), { recursive: true });
    symlinkSync('.pnpm/expo', join(project, 'node_modules/expo'));
    symlinkSync(shared, join(project, 'node_modules/local-module'));
    writeFileSync(
      join(project, 'package.json'),
      '{"dependencies":{"expo":"58.0.14","local-module":"file:../../checkout/node_modules"}}'
    );
    expect(detachSharedNodeModules(project)).toBeUndefined();
    expect(lstatSync(join(project, 'node_modules/expo')).isSymbolicLink()).toBe(true);
  });

  it('should back up a legacy npm lockfile that contradicts a declared registry dependency', () => {
    const lock = JSON.stringify({
      packages: { 'node_modules/expo': { link: true, resolved: '../../checkout/expo' } },
    });
    writeFileSync(join(project, 'package-lock.json'), lock);
    const backup = detachSharedNodeModules(project);
    expect(backup).toBeDefined();
    expect(readFileSync(join(backup!, 'package-lock.json'), 'utf8')).toBe(lock);
    expect(existsSync(join(project, 'package-lock.json'))).toBe(false);
  });

  it('should keep a valid lockfile with intentional file dependencies', () => {
    writeFileSync(
      join(project, 'package.json'),
      '{"dependencies":{"expo":"file:../../checkout/expo"}}'
    );
    const lock = JSON.stringify({
      packages: { 'node_modules/expo': { link: true, resolved: '../../checkout/expo' } },
    });
    writeFileSync(join(project, 'package-lock.json'), lock);
    expect(detachSharedNodeModules(project)).toBeUndefined();
    expect(readFileSync(join(project, 'package-lock.json'), 'utf8')).toBe(lock);
  });
});
