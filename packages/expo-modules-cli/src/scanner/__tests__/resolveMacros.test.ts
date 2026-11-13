import { SUPPORTED_SCAN_EXPORTS_SCHEMA_VERSION } from 'expo-modules-macros';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { SCAN_EXPORTS_SCHEMA_VERSION, resolveMacros } from '../resolveMacros';

let tmpDir: string;

beforeEach(() => {
  // Real path, since `require.resolve` reports one and the tmp dir is behind a symlink on macOS.
  tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'expo-modules-cli-')));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Writes a package with the given `package.json` fields and `index.js` source under `dir`. */
function writePackage(dir: string, name: string, version: string, source = ''): string {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }));
  fs.writeFileSync(path.join(dir, 'index.js'), source);
  return dir;
}

/**
 * A module package with `expo` installed, whose `expo-modules-core` has its own copy of the macros
 * reporting `schemaVersion`. Each package is nested in the one before, so it resolves only through
 * that one. Returns the module package directory.
 */
function writeModulePackage(schemaVersion: number): string {
  const packageDir = writePackage(path.join(tmpDir, 'my-module'), 'my-module', '1.0.0');
  const expoDir = writePackage(path.join(packageDir, 'node_modules', 'expo'), 'expo', '58.0.0');
  const coreDir = writePackage(
    path.join(expoDir, 'node_modules', 'expo-modules-core'),
    'expo-modules-core',
    '58.0.0'
  );
  writePackage(
    path.join(coreDir, 'node_modules', 'expo-modules-macros'),
    'expo-modules-macros',
    '0.99.0',
    `exports.SUPPORTED_SCAN_EXPORTS_SCHEMA_VERSION = ${schemaVersion};\n` +
      `exports.resolvedFrom = 'expo-modules-core';\n`
  );
  return packageDir;
}

describe(resolveMacros, () => {
  it('renders the schema of the macros version this CLI is developed against', () => {
    expect(SCAN_EXPORTS_SCHEMA_VERSION).toBe(SUPPORTED_SCAN_EXPORTS_SCHEMA_VERSION);
  });

  it('loads the macros that expo-modules-core depends on, through expo', () => {
    const packageDir = writeModulePackage(SCAN_EXPORTS_SCHEMA_VERSION);
    expect(resolveMacros(packageDir)).toMatchObject({ resolvedFrom: 'expo-modules-core' });
  });

  it('explains macros that report another schema version', () => {
    const packageDir = writeModulePackage(SCAN_EXPORTS_SCHEMA_VERSION + 1);
    expect(() => resolveMacros(packageDir)).toThrow(
      `expo-modules-macros 0.99.0 at ${path.join(packageDir, 'node_modules', 'expo', 'node_modules', 'expo-modules-core', 'node_modules', 'expo-modules-macros')} ` +
        `reports schema version ${SCAN_EXPORTS_SCHEMA_VERSION + 1}, but this CLI understands ` +
        `version ${SCAN_EXPORTS_SCHEMA_VERSION}.`
    );
  });
});
