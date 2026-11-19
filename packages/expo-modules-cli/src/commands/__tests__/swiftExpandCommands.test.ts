import fs from 'fs';
import os from 'os';
import path from 'path';

import { swiftCheckCommand, swiftExpandCommand } from '../swiftExpandCommands';

let tmpDir: string;
let callsFile: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-modules-cli-'));
  callsFile = path.join(tmpDir, 'calls.json');
  process.exitCode = undefined;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exitCode = undefined;
});

/**
 * An executable Node script that appends its arguments to `callsFile` and exits with the code of
 * its subcommand in `exitCodes`, or 0.
 */
function writeFakeExecutable(exitCodes: Record<string, number> = {}): string {
  const binaryPath = path.join(tmpDir, 'fake-executable');
  fs.writeFileSync(
    binaryPath,
    `#!/usr/bin/env node\n` +
      `const fs = require('fs');\n` +
      `const file = ${JSON.stringify(callsFile)};\n` +
      `const calls = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];\n` +
      `fs.writeFileSync(file, JSON.stringify([...calls, process.argv.slice(2)]));\n` +
      `process.exitCode = ${JSON.stringify(exitCodes)}[process.argv[2]] ?? 0;\n`,
    { mode: 0o755 }
  );
  return binaryPath;
}

function readCalls(): string[][] {
  return fs.existsSync(callsFile) ? JSON.parse(fs.readFileSync(callsFile, 'utf8')) : [];
}

describe(swiftCheckCommand, () => {
  it('only checks without --fix', async () => {
    const scanner = writeFakeExecutable({ expand: 1 });
    await swiftCheckCommand(['--scanner', scanner, 'ios']);
    expect(readCalls()).toEqual([['expand', '--diagnostics-only', 'ios']]);
    expect(process.exitCode).toBe(1);
  });

  it('applies the Fix-Its and then checks again with --fix', async () => {
    const scanner = writeFakeExecutable();
    await swiftCheckCommand(['--fix', '--scanner', scanner, '--symbol', 'MyModule', 'ios']);
    expect(readCalls()).toEqual([
      ['fix', '--symbol', 'MyModule', 'ios'],
      ['expand', '--symbol', 'MyModule', '--diagnostics-only', 'ios'],
    ]);
    expect(process.exitCode).toBe(0);
  });

  it('fails when the check after the Fix-Its finds an error', async () => {
    const scanner = writeFakeExecutable({ expand: 1 });
    await swiftCheckCommand(['--fix', '--scanner', scanner, 'ios']);
    expect(readCalls()).toHaveLength(2);
    expect(process.exitCode).toBe(1);
  });

  it('still checks but fails when a file could not be written', async () => {
    const scanner = writeFakeExecutable({ fix: 1 });
    await swiftCheckCommand(['--fix', '--scanner', scanner, 'ios']);
    expect(readCalls()).toHaveLength(2);
    expect(process.exitCode).toBe(1);
  });

  it('stops after a usage error of fix', async () => {
    const scanner = writeFakeExecutable({ fix: 2 });
    await swiftCheckCommand(['--fix', '--scanner', scanner, 'ios']);
    expect(readCalls()).toEqual([['fix', 'ios']]);
    expect(process.exitCode).toBe(2);
  });

  it('rejects --fix with --json', async () => {
    const scanner = writeFakeExecutable();
    await expect(swiftCheckCommand(['--fix', '--json', '--scanner', scanner])).rejects.toThrow(
      "can't combine --fix with --json"
    );
    expect(readCalls()).toEqual([]);
  });
});

describe(swiftExpandCommand, () => {
  it('rejects --fix', async () => {
    const scanner = writeFakeExecutable();
    await expect(swiftExpandCommand(['--fix', '--scanner', scanner, 'ios'])).rejects.toThrow(
      'unknown or unexpected option: --fix'
    );
  });
});
