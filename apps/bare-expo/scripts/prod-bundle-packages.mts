#!/usr/bin/env node
/**
 * Snapshot the package names in a bare-expo production bundle.
 *
 * The list is derived from the export's source map. Update it with:
 *   node apps/bare-expo/scripts/prod-bundle-packages.mts
 * Check it with `--check`.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '../..');

type Platform = 'ios' | 'android';

type SourceMap = {
  sources?: (string | null)[];
  sections?: { map?: SourceMap }[];
};

function parseArgs(argv: string[]): { check: boolean; platform: Platform } {
  let check = false;
  let platform: Platform = 'ios';
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      check = true;
    } else if (arg === '--platform') {
      const value = argv[++i];
      if (value !== 'ios' && value !== 'android') {
        console.error(`Unsupported platform: ${value ?? '(missing)'}`);
        process.exit(2);
      }
      platform = value;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node apps/bare-expo/scripts/prod-bundle-packages.mts [--check] [--platform ios|android]'
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return { check, platform };
}

function collectSources(map: SourceMap | undefined, sources: string[]): void {
  if (map == null) return;
  if (Array.isArray(map.sources)) {
    for (const source of map.sources) {
      if (typeof source === 'string' && source.length > 0) sources.push(source);
    }
  }
  if (Array.isArray(map.sections)) {
    for (const section of map.sections) collectSources(section.map, sources);
  }
}

const packageNameByDir = new Map<string, string | null>();

function packageNameAt(dir: string): string | null {
  const cached = packageNameByDir.get(dir);
  if (cached !== undefined) return cached;
  let name: string | null = null;
  const file = path.join(dir, 'package.json');
  if (fs.existsSync(file)) {
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf8')) as { name?: unknown };
      if (typeof json.name === 'string' && json.name.length > 0) name = json.name;
    } catch {
      name = null;
    }
  }
  packageNameByDir.set(dir, name);
  return name;
}

/**
 * Package name for one source-map path.
 *
 * Scoped and nested packages come from the nearest package.json, so
 * `node_modules/@scope/name` and `node_modules/foo/node_modules/bar` both
 * resolve to the package that owns the file. Workspace packages resolve the
 * same way once the path is realpath'd out of a pnpm symlink.
 *
 * Metro writes paths relative to the monorepo root with a leading slash
 * (`/packages/expo/build/Expo.js`, `/node_modules/.pnpm/...`). Those are not
 * filesystem-absolute. A path that exists on disk wins; otherwise the slash
 * is stripped and the path is resolved from the repo root, then the app root.
 *
 * The app's own source (the package at the export root) is omitted. Virtual
 * modules, whose ids contain a NUL, are omitted too. Polyfills that live in a
 * real package, such as `@react-native/js-polyfills` or `metro-runtime`, stay.
 */
function resolveSourceFile(source: string, appRoot: string, repoRoot: string): string | null {
  let file = source.split('?')[0] ?? source;
  if (file.startsWith('file://')) file = file.slice('file://'.length);
  try {
    file = decodeURIComponent(file);
  } catch {
    // Keep the raw path when it is not valid percent-encoding.
  }
  const stripped = file.startsWith('/') ? file.slice(1) : file;
  const candidates = [
    path.isAbsolute(file) && fs.existsSync(file) ? file : null,
    path.resolve(repoRoot, stripped),
    path.resolve(appRoot, stripped),
  ];
  for (const candidate of candidates) {
    if (candidate != null && fs.existsSync(candidate)) {
      try {
        return fs.realpathSync(candidate);
      } catch {
        return candidate;
      }
    }
  }
  return null;
}

function packageNameForSource(source: string, appRoot: string, repoRoot: string): string | null {
  if (source.includes('\0')) return null;
  const real = resolveSourceFile(source, appRoot, repoRoot);
  if (real == null) return null;
  const root = path.parse(real).root;
  let dir = path.dirname(real);
  while (dir.startsWith(root) && dir !== root) {
    const name = packageNameAt(dir);
    if (name != null) {
      if (path.resolve(dir) === path.resolve(appRoot)) return null;
      return name;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function snapshotPath(platform: Platform): string {
  return path.join(APP_ROOT, `prod-bundle-deps-${platform}.txt`);
}

function generatedPath(platform: Platform): string {
  return path.join(APP_ROOT, `prod-bundle-deps-${platform}.generated.txt`);
}

function formatList(names: string[]): string {
  return `${[...names].sort().join('\n')}\n`;
}

function bundleSourceMaps(outputDir: string, platform: Platform): string[] {
  const metadataPath = path.join(outputDir, 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
    fileMetadata?: Record<string, { bundle?: string }>;
  };
  const bundle = metadata.fileMetadata?.[platform]?.bundle;
  if (bundle == null || bundle.length === 0) {
    throw new Error(`Export metadata has no ${platform} bundle`);
  }
  const bundleDir = path.dirname(path.join(outputDir, bundle));
  const maps = fs
    .readdirSync(bundleDir)
    .filter((file) => file.endsWith('.js.map') || file.endsWith('.hbc.map'))
    .sort()
    .map((file) => path.join(bundleDir, file));
  if (maps.length === 0) {
    throw new Error(`No source map next to ${bundle}`);
  }
  return maps;
}

function packagesFromExport(outputDir: string, platform: Platform): string[] {
  const names = new Set<string>();
  for (const mapPath of bundleSourceMaps(outputDir, platform)) {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as SourceMap;
    const sources: string[] = [];
    collectSources(map, sources);
    for (const source of sources) {
      const name = packageNameForSource(source, APP_ROOT, REPO_ROOT);
      if (name != null) names.add(name);
    }
  }
  if (names.size === 0) {
    throw new Error('No packages found in the production bundle source map');
  }
  return [...names];
}

function exportProductionBundle(platform: Platform): string {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bare-expo-prod-bundle-'));
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'expo',
      'export',
      '--platform',
      platform,
      '--source-maps',
      '--no-bytecode',
      '--clear',
      '--output-dir',
      outputDir,
    ],
    {
      cwd: APP_ROOT,
      env: {
        ...process.env,
        CI: '1',
        EXPO_NO_TELEMETRY: '1',
        SKIP_SKIA_DOWNLOAD: '1',
      },
      stdio: 'inherit',
    }
  );
  if (result.status !== 0) {
    fs.rmSync(outputDir, { recursive: true, force: true });
    throw new Error(`expo export failed with status ${result.status ?? 'null'}`);
  }
  return outputDir;
}

function main(): void {
  const { check, platform } = parseArgs(process.argv);
  const outputDir = exportProductionBundle(platform);
  try {
    const text = formatList(packagesFromExport(outputDir, platform));
    const target = snapshotPath(platform);
    const generated = generatedPath(platform);
    if (!check) {
      fs.writeFileSync(target, text);
      fs.rmSync(generated, { force: true });
      console.log(
        `Wrote ${text.trim().split('\n').length} packages to ${path.relative(REPO_ROOT, target)}`
      );
      return;
    }
    const expected = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (expected === text) {
      fs.rmSync(generated, { force: true });
      console.log(
        `${path.relative(REPO_ROOT, target)} matches (${text.trim().split('\n').length} packages)`
      );
      return;
    }
    fs.writeFileSync(generated, text);
    console.error(`Production bundle packages differ from ${path.relative(REPO_ROOT, target)}`);
    console.error(`Generated list: ${path.relative(REPO_ROOT, generated)}`);
    const diff = spawnSync('diff', ['-u', target, generated], { encoding: 'utf8' });
    if (diff.stdout) process.stderr.write(diff.stdout);
    process.exitCode = 1;
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

const isDirectRun =
  process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
