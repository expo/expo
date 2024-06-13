/* eslint-env jest */
import execa from 'execa';
import klawSync from 'klaw-sync';
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { copyAsync } from '../../../src/utils/dir';
import { bin, getTemporaryPath, installAsync } from '../utils';

runExportSideEffects();

describe('exports monorepos', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await createMonorepoFixture();
  }, 120 * 1000);

  // See: https://github.com/expo/expo/issues/29700#issuecomment-2165348259
  it(
    'exports identical projects with cache invalidation',
    async () => {
      // Export both apps, in order of A then B
      const appAExportDir = await exportApp(projectRoot, 'apps/app-a');
      const appBExportDir = await exportApp(projectRoot, 'apps/app-b');

      // Find all relative files on both exports
      const appAFiles = findFilesInPath(appAExportDir);
      const appBFiles = findFilesInPath(appBExportDir);

      // Ensure app A only have files related to app A
      expect(appAFiles).toContain('about-a.html');
      expect(appAFiles).not.toContain('about-b.html');

      // Ensure app B only have files related to app B
      expect(appBFiles).toContain('about-b.html');
      expect(appBFiles).not.toContain('about-a.html');
    },
    // 1x App export could take 45s depending on how fast the bundler resolves
    560 * 1000 * 2
  );
});

async function createMonorepoFixture() {
  const fixturePath = path.join(__dirname, '../../fixtures', 'with-router-monorepo');
  const monorepoRoot = getTemporaryPath();

  // Copy the fixture, and install the dependencies
  await fs.promises.mkdir(monorepoRoot, { recursive: true });
  await copyAsync(fixturePath, monorepoRoot, { recursive: true });
  await installAsync(monorepoRoot);

  return monorepoRoot;
}

async function exportApp(monorepoRoot: string, workspacePath: string) {
  await execa('node', [bin, 'export', '-p', 'web', '--output-dir', 'dist'], {
    cwd: path.join(monorepoRoot, workspacePath),
    env: {
      NODE_ENV: 'production',
      EXPO_USE_STATIC: 'static',
      E2E_ROUTER_SRC: 'monorepos',
      E2E_ROUTER_ASYNC: 'development',
      EXPO_USE_FAST_RESOLVER: 'true',
    },
  });

  return path.join(monorepoRoot, workspacePath, 'dist');
}

function findFilesInPath(outputDir: string) {
  return klawSync(outputDir)
    .map((entry) => {
      if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
        return null;
      }
      return path.posix.relative(outputDir, entry.path);
    })
    .filter(Boolean);
}
