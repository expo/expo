/* eslint-env jest */
import { PackageJSONConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import execa from 'execa';
import klawSync from 'klaw-sync';
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { bin, installAsync, setupTestProjectWithOptionsAsync } from '../utils';

const MONOREPO_ROOT = path.join(__dirname, '../../../../../../');

runExportSideEffects();

describe('exports monorepos', () => {
  // See: https://github.com/expo/expo/issues/29700#issuecomment-2165348259
  it(
    'exports identical projects with cache invalidation',
    async () => {
      // Create a project from the monorepo fixture
      const projectRoot = await setupTestProjectWithOptionsAsync(
        'basic-export-monorepo',
        'with-router-monorepo'
      );

      // Link `@expo/metro-config` to the test projects, and reinstall
      await linkPackageToTestProject(projectRoot, '@expo/metro-config');
      await configureMetroForPackageLinking(path.join(projectRoot, 'apps/app-a'));
      await configureMetroForPackageLinking(path.join(projectRoot, 'apps/app-b'));
      await installAsync(projectRoot);

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

async function exportApp(monorepoRoot: string, workspacePath: string) {
  await execa('node', [bin, 'export', '-p', 'web', '--output-dir', 'dist'], {
    cwd: path.join(monorepoRoot, workspacePath),
    env: {
      NODE_ENV: 'production',
      EXPO_USE_FAST_RESOLVER: 'true',
      // TODO: check if this can be turned on by default
      EXPO_USE_METRO_WORKSPACE_ROOT: 'true',
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

/**
 * Link a package from the expo/expo monorepo to the test project.
 * This is a temporary workaround to include fixes from packages outside of `@expo/cli`.
 * @see https://github.com/expo/expo/pull/29733
 */
async function linkPackageToTestProject(projectRoot: string, linkPackageName: string) {
  const linkPackageVersion = `file:${path.join(MONOREPO_ROOT, 'packages', linkPackageName)}`;

  const packageFile = path.join(projectRoot, 'package.json');
  const pkg = (await JsonFile.readAsync(packageFile)) as Partial<PackageJSONConfig>;

  await JsonFile.writeAsync(packageFile, {
    ...pkg,
    dependencies: {
      ...(pkg.dependencies || {}),
      // NOTE(cedric): this is a fix for Bun to install the overriden package in the test project
      [linkPackageName]: linkPackageVersion,
    },
    resolutions: {
      ...(pkg.resolutions || {}),
      [linkPackageName]: linkPackageVersion,
    },
    overrides: {
      ...(pkg.overrides || {}),
      [linkPackageName]: linkPackageVersion,
    },
  });
}

/**
 * Configure Metro to watch the monorepo root to allow linking packages from expo/expo.
 * @see linkPackageToTestProject
 * @see https://github.com/expo/expo/pull/29733
 */
async function configureMetroForPackageLinking(projectRoot: string) {
  await fs.promises.writeFile(
    path.join(projectRoot, 'metro.config.js'),
    `
    const { getDefaultConfig } = require('@expo/metro-config');
    const config = getDefaultConfig(__dirname);
    
    // Add the monorepo to the watch folders to allow linking \`@expo/metro-config\`
    config.watchFolders.push('${MONOREPO_ROOT}');

    module.exports = config;
  `
  );
}
