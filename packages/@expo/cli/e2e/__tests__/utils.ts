/* eslint-env jest */
import { ExpoConfig, getConfig, PackageJSONConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import klawSync from 'klaw-sync';
import * as htmlParser from 'node-html-parser';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { copySync } from '../../src/utils/dir';
import { toPosixPath } from '../../src/utils/filePath';
import { executeBunAsync } from '../utils/expo';
import { createVerboseLogger } from '../utils/log';
import { createPackageTarball } from '../utils/package';
import { TEMP_DIR, getTemporaryPath } from '../utils/path';
import { executeAsync } from '../utils/process';

export { getTemporaryPath } from '../utils/path';

export const bin = require.resolve('../../build/bin/cli');

export const projectRoot = getTemporaryPath();

/** Get the directory relative to the default project root */
export function getRoot(...args: string[]) {
  return path.join(projectRoot, ...args);
}

/**
 * @param parentDir Directory to create the project folder in, i.e. os temp directory
 * @param props.dirName Name of the project folder, used to prevent recreating the project locally
 * @param props.reuseExisting Should reuse the existing project if possible, good for testing locally
 * @param props.fixtureName Name of the fixture folder to use, this must map to the directories in the `expo/e2e/fixtures/` folder
 * @param props.config Optional extra values to add inside the app.json `expo` object
 * @param props.pkg Optional extra values to add to the fixture package.json file before installing
 * @returns The project root that can be tested inside of
 */
export async function createFromFixtureAsync(
  parentDir: string,
  {
    verbose,
    dirName,
    reuseExisting,
    fixtureName,
    config,
    pkg,
    linkExpoPackages,
    linkExpoPackagesDev,
  }: {
    verbose?: boolean;
    dirName: string;
    reuseExisting?: boolean;
    fixtureName: string;
    config?: Partial<ExpoConfig>;
    pkg?: Partial<PackageJSONConfig>;
    /**
     * Note, this is linked by installing the workspace folder as dependency directly.
     * This may cause other side-effects, like resolving monorepo dependencies instead of the test project.
     */
    linkExpoPackages?: string[];
    /**
     * Note, this is linked by installing the workspace folder as dependency directly.
     * This may cause other side-effects, like resolving monorepo dependencies instead of the test project.
     */
    linkExpoPackagesDev?: string[];
  }
): Promise<string> {
  const projectRoot = path.join(parentDir, dirName);
  const log = createVerboseLogger({ verbose, prefix: 'project' });

  log('Creating fixture:', {
    parentDir,
    dirName,
    reuseExisting,
    fixtureName,
    config,
    pkg,
    linkExpoPackages,
    linkExpoPackagesDev,
  });

  if (fs.existsSync(projectRoot)) {
    if (reuseExisting) {
      log('Reusing existing fixture project:', projectRoot);
      log.exit();

      // bail out early, this is good for local testing.
      return projectRoot;
    } else {
      log('Clearing existing fixture project:', projectRoot);
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }
  }

  try {
    const fixturePath = path.join(__dirname, '../fixtures', fixtureName);

    if (!fs.existsSync(fixturePath)) {
      throw new Error('No fixture project named: ' + fixtureName);
    }

    // Create the project root
    fs.mkdirSync(projectRoot, { recursive: true });
    log('Created fixture project:', projectRoot);

    // Copy all files recursively into the temporary directory
    await copySync(fixturePath, projectRoot);

    // Add additional modifications to the package.json
    if (pkg || linkExpoPackages || linkExpoPackagesDev) {
      pkg ??= {};
      const pkgPath = path.join(projectRoot, 'package.json');
      const fixturePkg = (await JsonFile.readAsync(pkgPath)) as PackageJSONConfig;

      const dependencies = Object.assign({}, fixturePkg.dependencies, pkg.dependencies);
      const devDependencies = Object.assign({}, fixturePkg.devDependencies, pkg.devDependencies);

      if (linkExpoPackages) {
        for (const pkg of linkExpoPackages) {
          const tarball = await createPackageTarball(projectRoot, `packages/${pkg}`);
          log('Created and linked tarball for dependencies', tarball);
          dependencies[pkg] = tarball.packageReference;
        }
      }

      if (linkExpoPackagesDev) {
        for (const pkg of linkExpoPackagesDev) {
          const tarball = await createPackageTarball(projectRoot, `packages/${pkg}`);
          log('Created and linked tarball for devDependencies', tarball);
          devDependencies[pkg] = tarball.packageReference;
        }
      }

      await JsonFile.writeAsync(pkgPath, {
        ...pkg,
        ...fixturePkg,
        dependencies,
        devDependencies,
        scripts: Object.assign({}, fixturePkg.scripts, pkg.scripts),
      });
    }

    // Add additional modifications to the Expo config
    if (config) {
      const { rootConfig, staticConfigPath } = getConfig(projectRoot, {
        // pkgs not installed yet
        skipSDKVersionRequirement: true,
        skipPlugins: true,
      });

      const modifiedConfig = {
        ...rootConfig,
        expo: {
          ...(rootConfig.expo || {}),
          ...config,
        },
      };
      assert(staticConfigPath);
      await JsonFile.writeAsync(staticConfigPath, modifiedConfig as any);
    }

    // Install the packages for e2e experience.
    await executeBunAsync(projectRoot, ['install']);
  } catch (error) {
    log.error(error);
    // clean up if something failed.
    // await fs.remove(projectRoot).catch(() => null);
    throw error;
  } finally {
    log.exit();
  }

  return projectRoot;
}

// Set this to true to enable caching and prevent rerunning yarn installs
const testingLocally = !process.env.CI;

export async function setupTestProjectWithOptionsAsync(
  name: string,
  fixtureName: string,
  {
    reuseExisting = testingLocally,
    sdkVersion = '52.0.0',
    linkExpoPackages,
    linkExpoPackagesDev,
  }: {
    sdkVersion?: string;
    reuseExisting?: boolean;
    linkExpoPackages?: string[];
    linkExpoPackagesDev?: string[];
  } = {}
): Promise<string> {
  // If you're testing this locally, you can set the projectRoot to a local project (you created with expo init) to save time.
  const projectRoot = await createFromFixtureAsync(TEMP_DIR, {
    dirName: name,
    reuseExisting,
    fixtureName,
    linkExpoPackages,
    linkExpoPackagesDev,
  });

  // Many of the factors in this test are based on the expected SDK version that we're testing against.
  const { exp } = getConfig(projectRoot, { skipPlugins: true });
  expect(exp.sdkVersion).toBe(sdkVersion);
  return projectRoot;
}

/** Returns a list of loaded modules relative to the repo root. Useful for preventing lazy loading from breaking unexpectedly.   */
export async function getLoadedModulesAsync(statement: string): Promise<string[]> {
  const repoRoot = path.join(__dirname, '../../../../');
  const results = await executeAsync(__dirname, [
    'node',
    '-e',
    [statement, `console.log(JSON.stringify(Object.keys(require('module')._cache)));`].join(';'),
  ]);
  const loadedModules = JSON.parse(results.stdout.trim()) as string[];
  return loadedModules
    .map((value) => toPosixPath(path.relative(repoRoot, value)))
    .filter((value) => !value.includes('/ms-vscode.js-debug/')) // Ignore injected vscode debugger scripts
    .sort();
}

export async function getPage(output: string, route: string): Promise<string> {
  return await fs.promises.readFile(path.join(output, route), 'utf8');
}

export async function getPageHtml(output: string, route: string) {
  return htmlParser.parse(await getPage(output, route));
}

export function getRouterE2ERoot(): string {
  const root = path.join(__dirname, '../../../../../apps/router-e2e');
  return root;
}

export function getHtmlHelpers(outputDir: string) {
  async function getScriptTagsAsync(name: string) {
    const tags = (await getPageHtml(outputDir, name))
      .querySelectorAll('script')
      // Remove scripts without a src attribute
      .filter((script) => !!script.attributes.src)
      .map((script) => {
        expect(fs.existsSync(path.join(outputDir, script.attributes.src))).toBe(true);

        return script.attributes.src;
      });

    ensureEntryChunk(tags[0]);

    return tags;
  }

  function ensureEntryChunk(relativePath: string) {
    expect(fs.readFileSync(path.join(outputDir, relativePath), 'utf8')).toMatch(
      /__BUNDLE_START_TIME__/
    );
  }

  return {
    getScriptTagsAsync,
  };
}

export function expectChunkPathMatching(name: string) {
  return expect.stringMatching(
    new RegExp(
      `_expo\\/static\\/js\\/web\\/${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}-.*\\.js`
    )
  );
}

/**
 * Find all project files in the given project root.
 * This returns all paths in POSIX format, sorted alphabetically, and relative to the project root without any prefix.
 */
export function findProjectFiles(projectRoot: string) {
  return klawSync(projectRoot, { nodir: true })
    .map((entry) =>
      entry.path.includes('node_modules')
        ? null
        : toPosixPath(path.relative(projectRoot, entry.path))
    )
    .filter(Boolean)
    .sort() as string[];
}
