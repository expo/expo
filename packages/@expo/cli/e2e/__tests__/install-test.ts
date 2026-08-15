/* eslint-env jest */
import JsonFile from '@expo/json-file';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { executeExpoAsync } from '../utils/expo';
import { createPackageTarball } from '../utils/package';
import {
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectWithOptionsAsync,
  writeSkillPackageAsync,
} from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;
beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});
afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/install').expoInstall`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/install/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo install --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['install', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Install a module or other package to a project

      Usage
        $ npx expo install

      Options
        --check            Check which installed packages need to be updated
        --dev              Save the dependencies as devDependencies
        --fix              Automatically update any invalid package versions
        --no-agent-skills  Skip linking agent skills from the installed packages
        --npm              Use npm to install dependencies. Default when package-lock.json exists
        --yarn             Use Yarn to install dependencies. Default when yarn.lock exists
        --bun              Use bun to install dependencies. Default when bun.lock or bun.lockb exists
        --pnpm             Use pnpm to install dependencies. Default when pnpm-lock.yaml exists
        -h, --help         Usage info
        --json             Output dependency information in JSON format with --check flag

      Additional options can be passed to the underlying install command by using --
        $ npx expo install react -- --verbose
        > yarn add react --verbose
    "
  `);
});

it('installs a local package tarball without network access', async () => {
  const offlineEnv = {
    EXPO_OFFLINE: '1',
    EXPO_NO_NEW_ARCH_COMPAT_CHECK: '1',
    npm_config_offline: 'true',
    HTTP_PROXY: 'http://127.0.0.1:9',
    HTTPS_PROXY: 'http://127.0.0.1:9',
    NO_PROXY: '',
  };
  const originalEnv = Object.fromEntries(
    Object.keys(offlineEnv).map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, offlineEnv);

  try {
    const projectRoot = await setupTestProjectWithOptionsAsync(
      'local-package-install',
      'with-blank',
      {
        reuseExisting: false,
      }
    );
    const tarball = await createPackageTarball(
      projectRoot,
      'packages/@expo/cli/e2e/fixtures/install-smoke-package'
    );

    await expect(
      executeExpoAsync(projectRoot, ['install', tarball.packageReference, '--', '--offline'], {
        env: offlineEnv,
      })
    ).resolves.toMatchObject({ exitCode: 0 });

    const pkg: any = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));
    expect(pkg.dependencies?.[tarball.name]).toEqual(expect.any(String));
    expect(require.resolve(tarball.name, { paths: [projectRoot] })).toEqual(expect.any(String));
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

it('syncs agent skills on `npx expo install` when auto sync is enabled', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('install-agent-skills', 'with-blank', {
    reuseExisting: false,
  });

  // Local packages that ship skills, installable with `<name>@file:./<name>`
  await writeSkillPackageAsync(path.join(projectRoot, 'test-skills'), 'test-skills', ['alpha']);
  await writeSkillPackageAsync(path.join(projectRoot, 'other-skills'), 'other-skills', ['beta']);

  // Cache the Claude Code agent selection like a previous `expo skills` run would
  await fs.mkdir(path.join(projectRoot, '.expo'), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, '.expo/agent-links.json'),
    JSON.stringify({ agents: ['claude-code'] })
  );

  const env = {
    EXPO_NO_NEW_ARCH_COMPAT_CHECK: '1',
  } as Partial<NodeJS.ProcessEnv> as NodeJS.ProcessEnv;

  // Installing a package links its skills
  await executeExpoAsync(projectRoot, ['install', 'test-skills@file:./test-skills'], { env });
  expect(existsSync(path.join(projectRoot, '.claude/skills/npm-test-skills-alpha'))).toBe(true);

  // `--no-agent-skills` skips the sync, existing links are left alone
  await executeExpoAsync(
    projectRoot,
    ['install', 'other-skills@file:./other-skills', '--no-agent-skills'],
    { env }
  );
  expect(existsSync(path.join(projectRoot, '.claude/skills/npm-other-skills-beta'))).toBe(false);
  expect(existsSync(path.join(projectRoot, '.claude/skills/npm-test-skills-alpha'))).toBe(true);
});
