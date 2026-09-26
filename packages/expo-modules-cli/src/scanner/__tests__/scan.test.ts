import fs from 'fs';
import os from 'os';
import path from 'path';

import { scanPackage } from '../scan';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-modules-cli-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** An executable Node script that prints `stdout` and `stderr` and exits with `exitCode`. */
function writeFakeScanner(stdout: string, stderr: string, exitCode: number): string {
  const binaryPath = path.join(tmpDir, 'fake-scanner');
  fs.writeFileSync(
    binaryPath,
    `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(stdout)});\n` +
      `process.stderr.write(${JSON.stringify(stderr)});\nprocess.exitCode = ${exitCode};\n`,
    { mode: 0o755 }
  );
  return binaryPath;
}

const report = JSON.stringify({
  schemaVersion: 5,
  exports: { modules: [], sharedObjects: [], records: [], enums: [], unions: [] },
  stats: { durationMs: 1, filesParsed: 0, filesScanned: 0 },
});

describe(scanPackage, () => {
  it('returns the parsed report', async () => {
    const binaryPath = writeFakeScanner(report, '', 0);
    const result = await scanPackage('/pkg', { binaryPath });
    expect(result.stats.filesScanned).toBe(0);
  });

  it('explains a missing scanner executable', async () => {
    await expect(scanPackage('/pkg', { binaryPath: path.join(tmpDir, 'nope') })).rejects.toThrow(
      /was not found at .*nope/
    );
  });

  it('relays the scanner diagnostics when it exits non-zero', async () => {
    const binaryPath = writeFakeScanner('', "error: unknown subcommand 'scan-exports'\n", 2);
    await expect(scanPackage('/pkg', { binaryPath })).rejects.toThrow(
      "unknown subcommand 'scan-exports'"
    );
  });

  it('explains a scanner that cannot be executed, with a macOS hint on macOS', async () => {
    // A directory cannot be executed on any platform: macOS reports ENOEXEC and Linux EACCES.
    await expect(scanPackage('/pkg', { binaryPath: tmpDir, platform: 'darwin' })).rejects.toThrow(
      /did not produce a report.*make sure the file is executable/
    );
  });

  it('adds a platform hint off macOS, where the shipped binary fails through the shell', async () => {
    const binaryPath = writeFakeScanner('', 'Syntax error: word unexpected\n', 2);
    await expect(scanPackage('/pkg', { binaryPath, platform: 'linux' })).rejects.toThrow(
      /Syntax error/
    );
    // A spawn-level failure names the platform.
    await expect(scanPackage('/pkg', { binaryPath: tmpDir, platform: 'linux' })).rejects.toThrow(
      /macOS binary, so on linux/
    );
  });

  it('explains a schema version this CLI does not understand', async () => {
    const binaryPath = writeFakeScanner(
      report.replace('"schemaVersion":5', '"schemaVersion":99'),
      '',
      0
    );
    await expect(scanPackage('/pkg', { binaryPath })).rejects.toThrow(
      /schema version 99, but this CLI understands version 5/
    );
  });

  it('explains output that is not a report', async () => {
    const binaryPath = writeFakeScanner('not json', '', 0);
    await expect(scanPackage('/pkg', { binaryPath })).rejects.toThrow(/did not produce a report/);
  });
});
