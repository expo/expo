import fs from 'fs';
import os from 'os';
import path from 'path';

import { generateTypes } from '../generateTypes';

const sampleScan = {
  schemaVersion: 5,
  exports: {
    records: [
      {
        name: 'Options',
        file: '/pkg/ios/Demo.swift',
        properties: [
          {
            name: 'quality',
            type: { kind: 'primitive', name: 'Double', typeof: 'number' },
            optional: false,
            required: false,
          },
        ],
      },
    ],
    sharedObjects: [
      {
        name: 'VideoPlayer',
        jsName: 'Player',
        file: '/pkg/ios/Demo.swift',
        events: [],
        constructorParameters: [
          {
            label: 'options',
            name: 'options',
            type: { kind: 'ref', name: 'Options', typeof: 'object' },
            optional: false,
          },
        ],
        functions: [],
        properties: [],
      },
    ],
    modules: [
      {
        name: 'MyModule',
        jsName: 'MyModule',
        file: '/pkg/ios/Demo.swift',
        events: [],
        functions: [],
        properties: [
          {
            name: 'status',
            jsName: 'status',
            type: { kind: 'ref', name: 'PlaybackStatus', typeof: 'object' },
            readonly: true,
            static: false,
          },
        ],
      },
    ],
    enums: [],
    unions: [],
  },
  stats: { durationMs: 1.5, filesParsed: 1, filesScanned: 3 },
};

const emptyScan = {
  schemaVersion: 5,
  exports: { records: [], sharedObjects: [], modules: [], enums: [], unions: [] },
  stats: { durationMs: 0.5, filesParsed: 0, filesScanned: 0 },
};

type FakeScanner = { stdout?: string; stderr?: string; exitCode?: number };

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-modules-cli-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Writes an executable Node script standing in for the Swift scanner. It records its arguments to
 * `args.json` next to itself, then prints the given output and exits with the given code.
 */
function writeFakeScanner({ stdout = '', stderr = '', exitCode = 0 }: FakeScanner): string {
  const scannerPath = path.join(tmpDir, 'fake-scanner');
  const argsPath = path.join(tmpDir, 'args.json');
  fs.writeFileSync(
    scannerPath,
    [
      '#!/usr/bin/env node',
      `require('fs').writeFileSync(${JSON.stringify(argsPath)}, JSON.stringify(process.argv.slice(2)));`,
      `process.stdout.write(${JSON.stringify(stdout)});`,
      `process.stderr.write(${JSON.stringify(stderr)});`,
      `process.exitCode = ${exitCode};`,
      '',
    ].join('\n'),
    { mode: 0o755 }
  );
  return scannerPath;
}

function readScannerArgs(): string[] {
  return JSON.parse(fs.readFileSync(path.join(tmpDir, 'args.json'), 'utf8'));
}

describe(generateTypes, () => {
  it('scans the package directory and writes every declaration to the output file', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(sampleScan) });
    const packageDir = path.join(tmpDir, 'pkg');
    const outputPath = path.join(packageDir, 'src', 'native.ts');

    const result = await generateTypes({ packageDir, outputPath, scannerPath });

    expect(readScannerArgs()).toEqual(['scan-exports', packageDir]);
    expect(result.outputPath).toBe(outputPath);
    expect(result.counts).toEqual({
      modules: 1,
      sharedObjects: 1,
      records: 1,
      enums: 0,
      unions: 0,
    });
    expect(result.stats).toEqual(sampleScan.stats);
    expect(result.warnings).toEqual([
      {
        file: '/pkg/ios/Demo.swift',
        location: 'MyModule.status',
        message: "unresolved type 'PlaybackStatus' rendered as unknown",
      },
    ]);
    const source = fs.readFileSync(outputPath, 'utf8');
    expect(source).toContain("import type { NativeModule, SharedObject } from 'expo';");
    expect(source).toContain('export type Options = {');
    expect(source).toContain('export declare class Player extends SharedObject {');
    expect(source).toContain('constructor(options: Options);');
    expect(source).toContain('readonly status: unknown;');
  });

  it('keeps declarations no module references, since ownership is not tracked', async () => {
    const scan = {
      ...sampleScan,
      exports: {
        ...sampleScan.exports,
        modules: [
          { ...sampleScan.exports.modules[0], jsName: 'A', properties: [] },
          { ...sampleScan.exports.modules[0], name: 'B', jsName: 'B', properties: [] },
        ],
      },
    };
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(scan) });
    const outputPath = path.join(tmpDir, 'pkg', 'src', 'native.ts');

    const result = await generateTypes({ packageDir: tmpDir, outputPath, scannerPath });

    expect(result.warnings).toEqual([]);
    const source = fs.readFileSync(outputPath, 'utf8');
    expect(source).toContain('export declare class Player extends SharedObject {');
    expect(source).toContain('export declare class A extends NativeModule {}');
    expect(source).toContain('export declare class B extends NativeModule {}');
  });

  it('accepts scanner output larger than the default child process buffer', async () => {
    const padded = { ...sampleScan, padding: 'x'.repeat(2 * 1024 * 1024) };
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(padded) });
    const outputPath = path.join(tmpDir, 'pkg', 'src', 'native.ts');

    const result = await generateTypes({ packageDir: tmpDir, outputPath, scannerPath });

    expect(result.outputPath).toBe(outputPath);
  });

  it('overwrites a file it generated before', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(sampleScan) });
    const outputPath = path.join(tmpDir, 'native.ts');
    fs.writeFileSync(
      outputPath,
      '// @generated by expo-modules-cli. Do not edit by hand.\nexport type Old = 1;\n'
    );

    await generateTypes({ packageDir: tmpDir, outputPath, scannerPath });

    expect(fs.readFileSync(outputPath, 'utf8')).not.toContain('Old');
  });

  it('refuses to overwrite a file it did not generate', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(sampleScan) });
    const outputPath = path.join(tmpDir, 'native.ts');
    fs.writeFileSync(outputPath, 'export type Mine = 1;\n');

    await expect(generateTypes({ packageDir: tmpDir, outputPath, scannerPath })).rejects.toThrow(
      /was not generated by/
    );
    expect(fs.readFileSync(outputPath, 'utf8')).toBe('export type Mine = 1;\n');
  });

  it('explains an output path that cannot be read, such as a directory', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(sampleScan) });
    const outputPath = path.join(tmpDir, 'a-directory');
    fs.mkdirSync(outputPath);

    await expect(generateTypes({ packageDir: tmpDir, outputPath, scannerPath })).rejects.toThrow(
      /Could not read .*a-directory.*EISDIR/
    );
  });

  it('writes nothing when the package exports no types', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(emptyScan) });
    const outputPath = path.join(tmpDir, 'pkg', 'src', 'native.ts');

    const result = await generateTypes({ packageDir: tmpDir, outputPath, scannerPath });

    expect(result.outputPath).toBeNull();
    expect(result.counts).toEqual({
      modules: 0,
      sharedObjects: 0,
      records: 0,
      enums: 0,
      unions: 0,
    });
    expect(fs.existsSync(outputPath)).toBe(false);
  });

  it('rejects with the scanner diagnostics when the scanner fails', async () => {
    const scannerPath = writeFakeScanner({
      stderr: "error: unknown subcommand 'scan-exports'\n",
      exitCode: 2,
    });

    await expect(
      generateTypes({ packageDir: tmpDir, outputPath: path.join(tmpDir, 'out.ts'), scannerPath })
    ).rejects.toThrow("unknown subcommand 'scan-exports'");
  });

  it('explains that the scanner is a macOS binary when it cannot be executed', async () => {
    // A directory cannot be executed on any platform: macOS reports ENOEXEC and Linux EACCES.
    await expect(
      generateTypes({
        packageDir: tmpDir,
        outputPath: path.join(tmpDir, 'out.ts'),
        scannerPath: tmpDir,
      })
    ).rejects.toThrow(/did not produce a report/);
  });

  it('rejects when the scanner output is not the expected JSON', async () => {
    const scannerPath = writeFakeScanner({ stdout: 'not json' });

    await expect(
      generateTypes({ packageDir: tmpDir, outputPath: path.join(tmpDir, 'out.ts'), scannerPath })
    ).rejects.toThrow(/did not produce a report/);
  });

  it('removes a file it generated before when the package no longer exports any types', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(emptyScan) });
    const outputPath = path.join(tmpDir, 'native.ts');
    fs.writeFileSync(
      outputPath,
      '// @generated by expo-modules-cli. Do not edit by hand.\nexport type Old = 1;\n'
    );

    const result = await generateTypes({ packageDir: tmpDir, outputPath, scannerPath });

    expect(result.outputPath).toBeNull();
    expect(result.removedOutputPath).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(false);
  });

  it('leaves a file it did not generate alone when the package exports no types', async () => {
    const scannerPath = writeFakeScanner({ stdout: JSON.stringify(emptyScan) });
    const outputPath = path.join(tmpDir, 'native.ts');
    fs.writeFileSync(outputPath, 'export type Mine = 1;\n');

    const result = await generateTypes({ packageDir: tmpDir, outputPath, scannerPath });

    expect(result.outputPath).toBeNull();
    expect(result.removedOutputPath).toBeNull();
    expect(fs.readFileSync(outputPath, 'utf8')).toBe('export type Mine = 1;\n');
  });
});
