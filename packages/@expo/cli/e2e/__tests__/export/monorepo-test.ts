/* eslint-env jest */
import execa from 'execa';
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { bin, findProjectFiles, jestPlatformTimeout, setupTestProjectWithOptionsAsync } from '../utils';

runExportSideEffects();

type MonorepoConfigTypes = (typeof configTypes)[number];

/** The monorepo configuration types, e.g. where `workspaces` are defined */
const configTypes = ['package-json', 'pnpm-workspace-yaml'] as const;

describe.each(configTypes)('exports monorepo using "%s"', (configType) => {
  // See: https://github.com/expo/expo/issues/29700#issuecomment-2165348259
  it(
    'exports identical projects with cache invalidation',
    async () => {
      // Create a project from the monorepo fixture
      const projectRoot = await setupTestProjectWithOptionsAsync(
        `basic-export-monorepo-${configType}`,
        'with-monorepo'
      );

      // Ensure our fixture uses the correct monorepo configuration
      await configureMonorepo(configType, projectRoot);

      // Export both apps, in order of A then B
      const appAExportDir = await exportApp(projectRoot, 'apps/app-a');
      const appBExportDir = await exportApp(projectRoot, 'apps/app-b');

      // Find all relative files on both exports
      const appAFiles = findProjectFiles(appAExportDir);
      const appBFiles = findProjectFiles(appBExportDir);

      // Ensure app A only have files related to app A
      expect(appAFiles).toContain('page-a.html');
      expect(appAFiles).not.toContain('page-b.html');

      // Ensure app B only have files related to app B
      expect(appBFiles).toContain('page-b.html');
      expect(appBFiles).not.toContain('page-a.html');
    },
    jestPlatformTimeout(180_000)
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

async function configureMonorepo(configTypes: MonorepoConfigTypes, projectRoot: string) {
  // Load initial workspaces config, from fixture
  const fixturePackageFile = path.join(__dirname, '../../fixtures/with-monorepo/package.json');
  const fixturePackageJson = JSON.parse(fs.readFileSync(fixturePackageFile, 'utf8'));

  const packageFile = path.join(projectRoot, 'package.json');

  switch (configTypes) {
    case 'package-json':
      // Ensure the default package file configuration is used
      return await fs.promises.writeFile(packageFile, JSON.stringify(fixturePackageJson, null, 2));

    case 'pnpm-workspace-yaml': {
      const pnpmWorkspacesFile = path.join(projectRoot, 'pnpm-workspace.yaml');
      // Create the pnpm workspaces configuration manually (instead of using Yaml serializer)
      const pnpmWorkspacesGlobs = fixturePackageJson.workspaces.map(
        (glob: string) => `  - '${glob}'`
      );
      const pnpmWorkspacesYaml = ['packages:', ...pnpmWorkspacesGlobs].join('\n');
      // Remove the workspaces configuration from `package.json`, and write the `pnpm-workspace.yaml` file
      return await Promise.all([
        fs.promises.writeFile(
          packageFile,
          JSON.stringify({ ...fixturePackageJson, workspaces: undefined }, null, 2)
        ),
        fs.promises.writeFile(pnpmWorkspacesFile, pnpmWorkspacesYaml),
      ]);
    }
  }
}
