import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildExpandArgs, resolveExpandBinary, runExpand } from '../expand';

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
 * with `source` as its entry point. Returns the module package directory.
 */
function writeModulePackage(macrosSource: string): string {
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
    '0.26.0',
    macrosSource
  );
  return packageDir;
}

/** An executable Node script that writes its arguments as JSON to `argsFile` and exits with `exitCode`. */
function writeFakeExecutable(argsFile: string, exitCode: number): string {
  const binaryPath = path.join(tmpDir, 'fake-executable');
  fs.writeFileSync(
    binaryPath,
    `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(argsFile)}, ` +
      `JSON.stringify(process.argv.slice(2)));\nprocess.exitCode = ${exitCode};\n`,
    { mode: 0o755 }
  );
  return binaryPath;
}

describe(buildExpandArgs, () => {
  it('passes the options before the paths', () => {
    expect(
      buildExpandArgs({
        paths: ['ios', 'Other.swift'],
        symbols: ['MyModule', 'MyModule.greet'],
        json: true,
        diagnosticsOnly: true,
      })
    ).toEqual([
      'expand',
      '--symbol',
      'MyModule',
      '--symbol',
      'MyModule.greet',
      '--json',
      '--diagnostics-only',
      'ios',
      'Other.swift',
    ]);
  });
});

describe(resolveExpandBinary, () => {
  it('returns the executable of the macros that expo-modules-core depends on', () => {
    const packageDir = writeModulePackage(
      `exports.SUPPORTED_EXPAND_SCHEMA_VERSION = 1;\n` +
        `exports.getScannerBinaryPath = () => '/macros/apple/ExpoModulesMacros';\n`
    );
    expect(resolveExpandBinary(path.join(packageDir, 'ios'))).toBe(
      '/macros/apple/ExpoModulesMacros'
    );
  });

  it('explains macros without expand', () => {
    const packageDir = writeModulePackage(`exports.getScannerBinaryPath = () => '/old';\n`);
    expect(() => resolveExpandBinary(packageDir)).toThrow(
      /^expo-modules-macros 0\.26\.0 at .* can't expand macros: `expand` needs expo-modules-macros 0\.27\.0 or later\./
    );
  });
});

describe(runExpand, () => {
  it('runs the executable with the arguments and resolves with its exit code', async () => {
    const argsFile = path.join(tmpDir, 'args.json');
    const binaryPath = writeFakeExecutable(argsFile, 1);
    await expect(runExpand(binaryPath, ['expand', 'ios'])).resolves.toBe(1);
    expect(JSON.parse(fs.readFileSync(argsFile, 'utf8'))).toEqual(['expand', 'ios']);
  });

  it('explains a missing executable', async () => {
    await expect(runExpand(path.join(tmpDir, 'nope'), ['expand', 'ios'])).rejects.toThrow(
      `The Expo Modules executable was not found at ${path.join(tmpDir, 'nope')}.`
    );
  });
});
