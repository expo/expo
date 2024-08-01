/* eslint-env jest */
import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { bin, setupTestProjectWithOptionsAsync } from '../utils';

runExportSideEffects();

describe('exports monorepos', () => {
  // See: https://github.com/expo/expo/issues/29700#issuecomment-2165348259
  it(
    'exports identical projects with cache invalidation',
    async () => {
      // Create a project from the monorepo fixture
      const projectRoot = await setupTestProjectWithOptionsAsync(
        'basic-export-monorepo',
        'with-monorepo'
      );

      // Export both apps, in order of A then B
      const appAExportDir = await exportApp(projectRoot, 'apps/app-a');
      const appBExportDir = await exportApp(projectRoot, 'apps/app-b');

      // Find all relative files on both exports
      const appAFiles = findFilesInPath(appAExportDir);
      const appBFiles = findFilesInPath(appBExportDir);

      // Ensure app A only have files related to app A
      expect(appAFiles).toContain('page-a.html');
      expect(appAFiles).not.toContain('page-b.html');

      // Ensure app B only have files related to app B
      expect(appBFiles).toContain('page-b.html');
      expect(appBFiles).not.toContain('page-a.html');
    },
    // 1x App export could take 45s depending on how fast the bundler resolves
    560 * 1000 * 2
  );
});

async function exportApp(monorepoRoot: string, workspacePath: string) {
  await execa('node', [bin, 'export', '-p', 'web', '--output-dir', 'dist'], {
    cwd: path.join(monorepoRoot, workspacePath),
    env: {
      NODE_ENV: 'production',
      EXPO_USE_FAST_RESOLVER: 'true',
    },
  });

  return path.join(monorepoRoot, workspacePath, 'dist');
}

function findFilesInPath(outputDir: string) {
  return klawSync(outputDir)
    .map((entry) =>
      entry.path.includes('node_modules') || !entry.stats.isFile()
        ? null
        : path.posix.relative(outputDir, entry.path)
    )
    .filter(Boolean);
}
