/* eslint-env jest */
import execa from 'execa';
import klawSync from 'klaw-sync';
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { bin, linkPackagesFromMonorepo, setupTestProjectWithOptionsAsync } from '../utils';

runExportSideEffects();

it(
  'exports project using react-dom only',
  async () => {
    // Create a project from the blank template
    const projectRoot = await setupTestProjectWithOptionsAsync(
      'basic-export-react-dom',
      'with-react-dom',
      { reuseExisting: false }
    );

    // NOTE(cedric): this is required because the fix to make this pass is not published yet
    // Link the packages from the monorepo
    await linkPackagesFromMonorepo(projectRoot, ['expo']);

    // Export the app
    const exportDir = await exportApp(projectRoot);

    // Ensure no React Native code is bundled
    expect(await loadBundleFile(exportDir)).not.toContain('react-native');
  },
  // 1x App export could take 45s depending on how fast the bundler resolves
  560 * 1000 * 2
);

async function exportApp(projectRoot: string) {
  await execa('node', [bin, 'export', '--platform=web', '--output-dir=dist'], {
    cwd: projectRoot,
    env: {
      NODE_ENV: 'production',
      EXPO_USE_FAST_RESOLVER: 'true',
    },
  });

  return path.join(projectRoot, 'dist');
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

function loadBundleFile(outputDir: string) {
  const exportedFiles = findFilesInPath(outputDir);
  const exportedBundleFile = exportedFiles.find((file) => file?.startsWith('_expo/static/js/web/'));
  if (!exportedBundleFile) {
    throw new Error('Could not find the exported web bundle');
  }

  const bundleData = path.join(outputDir, exportedBundleFile);
  return fs.promises.readFile(bundleData, 'utf8');
}
