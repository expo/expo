import fs from 'node:fs';
import path from 'node:path';
import * as tar from 'tar';

import { spawnAsync } from '../Utils';
import { NpmPack, npmPackAsync } from './Baseline';

export type Flavor = 'debug' | 'release';
export type ModuleBinary = { product: string; binary: string };
export type ModuleBinaries =
  | { status: 'found'; binaries: ModuleBinary[] }
  | { status: 'none' }
  | { status: 'unpublished' };

export function parseImports(nmOutput: string, library: string): Set<string> {
  const symbols = new Set<string>();
  for (const match of nmOutput.matchAll(/external (\S+) \(from (\S+)\)/g)) {
    if (match[2] === library) {
      symbols.add(match[1]);
    }
  }
  return symbols;
}

export function parseExports(nmOutput: string): Set<string> {
  const symbols = new Set<string>();
  for (const line of nmOutput.split('\n')) {
    const columns = line.trim().split(/\s+/);
    if (columns.length === 3) {
      symbols.add(columns[2]);
    }
  }
  return symbols;
}

export function findMissingSymbols(imports: Set<string>, exports: Set<string>): string[] {
  return [...imports].filter((symbol) => !exports.has(symbol)).sort();
}

export async function readImportsAsync(binary: string): Promise<string> {
  const { stdout } = await spawnAsync('nm', ['-m', '-u', '-arch', 'arm64', binary]);
  return stdout;
}

export async function readExportsAsync(binary: string): Promise<Set<string>> {
  const { stdout } = await spawnAsync('nm', ['-gU', '-arch', 'arm64', binary]);
  return parseExports(stdout);
}

export async function demangleAsync(symbols: string[]): Promise<string[]> {
  const demangle = spawnAsync('xcrun', ['swift-demangle']);
  demangle.child.stdin?.end(symbols.join('\n'));
  const { stdout } = await demangle;
  return stdout.trim().split('\n');
}

export function librariesToCheck(packageName: string, product: string): string[] {
  if (packageName !== 'expo-modules-core') {
    return ['ExpoModulesCore', 'ExpoModulesJSI'];
  }
  return product === 'ExpoModulesCore' ? ['ExpoModulesJSI'] : [];
}

export function simulatorBinaryPath(xcframework: string, product: string): string {
  return path.join(xcframework, 'ios-arm64_x86_64-simulator', `${product}.framework`, product);
}

export async function resolveModuleBinariesAsync(
  packageName: string,
  version: string,
  flavor: Flavor,
  workDir: string,
  pack: NpmPack = npmPackAsync
): Promise<ModuleBinaries> {
  const destination = path.join(workDir, `${packageName}-${version}`);
  const packageRoot = path.join(destination, 'package');
  if (!fs.existsSync(packageRoot)) {
    await fs.promises.mkdir(destination, { recursive: true });
    const tarball = await pack(`${packageName}@${version}`, destination);
    if (!tarball) {
      return { status: 'unpublished' };
    }
    await tar.x({ file: tarball, cwd: destination });
  }

  const xcframeworks = path.join(packageRoot, 'prebuilds/output', flavor, 'xcframeworks');
  if (!fs.existsSync(xcframeworks)) {
    return { status: 'none' };
  }
  const extracted = path.join(destination, flavor);
  await fs.promises.mkdir(extracted, { recursive: true });
  const binaries: ModuleBinary[] = [];
  for (const file of (await fs.promises.readdir(xcframeworks)).sort()) {
    if (!file.endsWith('.tar.gz')) {
      continue;
    }
    const product = file.slice(0, -'.tar.gz'.length);
    await tar.x({ file: path.join(xcframeworks, file), cwd: extracted });
    const binary = simulatorBinaryPath(path.join(extracted, `${product}.xcframework`), product);
    if (!fs.existsSync(binary)) {
      throw new Error(`${packageName}@${version} ${file} has no simulator binary at ${binary}`);
    }
    binaries.push({ product, binary });
  }
  return { status: 'found', binaries };
}
