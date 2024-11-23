/* eslint-env jest */
import execa from 'execa';
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { bin, findProjectFiles, setupTestProjectWithOptionsAsync } from '../utils';

runExportSideEffects();

/** The monorepo configuration types, e.g. where `workspaces` are defined */
const configTypes = ['package.json', 'pnpm-workspace.yaml'] as const;

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

async function configureMonorepo(configType: (typeof configTypes)[number], projectRoot: string) {
  // Do not configure monorepo when using `package.json` configuration setup, the fixture uses this already
  if (configType === 'package.json') return;

  // Create the file path references
  const packageFile = path.join(projectRoot, 'package.json');
  const pnpmWorkspacesFile = path.join(projectRoot, 'pnpm-workspace.yaml');

  // Get the `package.json` config to modify the monorepo and support `pnpm-workspaces.yaml`
  const packageContent = await fs.promises.readFile(packageFile, 'utf8');
  const packageJson = JSON.parse(packageContent);
  // see: https://pnpm.io/pnpm-workspace_yaml
  const workspacesConfig = packageJson.workspaces.map((glob: string) => `  - '${glob}'`);
  const pnpmWorkspacesContent = [`packages:`, ...workspacesConfig].join('\n');

  await Promise.all([
    // Delete the original `package.json` workspaces config
    fs.promises.writeFile(packageFile, JSON.stringify({ ...packageJson, workspaces: undefined })),
    // Create the new `pnpm-workspaces.yaml` config
    fs.promises.writeFile(pnpmWorkspacesFile, pnpmWorkspacesContent),
  ]);
}
