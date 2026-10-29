import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { Project } from '../xcode';

const exec = promisify(execFile);
const packageRoot = resolve(__dirname, '../..');
let directory: string;
let host: string;
let cli: string;

async function run(...args: string[]) {
  return exec(process.execPath, [cli, ...args], { cwd: host, env: { ...process.env, CI: '1' } });
}

async function contents(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const path of await readdir(root, { recursive: true, withFileTypes: true })) {
    if (path.isFile()) {
      const absolute = join(path.parentPath, path.name);
      result[absolute.slice(root.length + 1)] = await readFile(absolute, 'utf8');
    }
  }
  return result;
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'expo-embedding-cli-'));
  await exec(process.execPath, ['scripts/build.cjs'], { cwd: packageRoot });
  const { stdout } = await exec(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
    { cwd: packageRoot, env: { ...process.env, npm_config_cache: join(directory, 'cache') } }
  );
  await exec('tar', ['-xzf', join(directory, JSON.parse(stdout)[0].filename), '-C', directory]);
  cli = join(directory, 'package/bin/expo-embedding.js');
}, 30000);

beforeEach(async () => {
  host = await realpath(await mkdtemp(join(directory, 'host-')));
});

afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('Running the packed CLI outside the Expo checkout', () => {
  it('should show package runner commands before the local Node fallback', async () => {
    const { stdout } = await run('--help');
    expect(stdout).toContain('npx expo-embedding skill');
    expect(stdout).toContain('bunx expo-embedding');
    expect(stdout.indexOf('bunx expo-embedding')).toBeLessThan(stdout.indexOf('node /path/'));
    expect(await readdir(host)).toEqual([]);
  });

  it('should give a SwiftUI agent a validated handoff without changing the host', async () => {
    const project = Project.create();
    project.addTarget('Example', 'com.apple.product-type.application', ['Debug', 'Release']);
    await mkdir(join(host, 'Example.xcodeproj'));
    await writeFile(join(host, 'Example.xcodeproj/project.pbxproj'), project.serialize());
    await writeFile(join(host, 'Example.swift'), 'import SwiftUI\n// Keep the existing app.\n');
    const before = await contents(host);
    const { stdout } = await run('skill', '--json');
    const report = JSON.parse(stdout);
    expect(report).toMatchObject({ schemaVersion: 1, platform: 'ios', root: host });
    expect(report.guide).toContain('ExpoBrownfieldAppDelegate');
    expect(report.guide).toContain('ContentView()');
    expect(report.changes).toEqual([]);
    expect((await run('skill')).stdout).toContain('npx expo-embedding init');
    expect(await contents(host)).toEqual(before);
  });

  it('should explain which command accepts the agent output flag before changing files', async () => {
    await expect(run('init', '--json')).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('--json is only supported by npx expo-embedding skill.'),
    });
    expect(await readdir(host)).toEqual([]);
  });
});
