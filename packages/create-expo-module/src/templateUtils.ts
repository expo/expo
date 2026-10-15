import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import ejs from 'ejs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { usesCompose, usesExpoUI, usesSwiftUI } from './features';
import { MIN_SUPPORTED_LOCAL_SDK } from './localSdk';
import type { Platform } from './prompts';
import {
  buildAppSnippets,
  buildModuleSnippets,
  buildViewSnippets,
  buildWebModuleSnippets,
} from './snippets';
import type { LocalSubstitutionData, SubstitutionData } from './types';
import { env } from './utils/env';
import { UserError } from './utils/errors';
import { writeFileAsync, type WriteFile } from './utils/files';
import { newStep } from './utils/ora';
import { extractLocalTarball } from './utils/tar';

const debug = require('debug')('create-expo-module:main') as typeof console.log;

// Ignore some paths. Especially `package.json` as it is rendered
// from `$package.json` file instead of the original one.
export const IGNORES_PATHS = [
  '.DS_Store',
  'build',
  'node_modules',
  'package.json',
  '.npmignore',
  '.gitignore',
  'snippets',
];

// Files and top-level directories that only belong in standalone npm modules.
// When generating a local module, these are skipped so the host project's tooling is used instead.
export const LOCAL_EXCLUDED_FILES = new Set([
  '$package.json',
  '$CHANGELOG.md',
  '$.gitignore',
  '$.npmignore',
  '$.prettierrc',
  'babel.config.js',
  'eslint.config.cjs',
  'tsconfig.json',
  'README.md',
  path.join('src', 'index.ts'),
]);
export const LOCAL_EXCLUDED_DIRS = new Set(['example', 'internal']);

// pnpm settings for the module and its example app, copied by `copyPnpmWorkspaceFiles`. They're in
// `snippets`, so that versions of the CLI that don't know these files never copy them.
const PNPM_WORKSPACE_FILES: Record<string, string> = {
  'pnpm-workspace.yaml': path.join('snippets', 'pnpm', 'pnpm-workspace.yaml'),
  [path.join('example', 'pnpm-workspace.yaml')]: path.join(
    'snippets',
    'pnpm',
    'example-pnpm-workspace.yaml'
  ),
};

/**
 * Maps template top-level directory names to the platform name in `expo-module.config.json`.
 * Files under these directories are only copied when the corresponding platform is selected.
 */
export const TEMPLATE_DIR_TO_PLATFORM: Record<string, Platform> = {
  ios: 'apple',
  android: 'android',
};

export function getGeneratedWebStubSentinel(moduleName: string): string {
  return `${moduleName} is not available on the web platform`;
}

export function handleSuffix(name: string, suffix: string): string {
  if (name.endsWith(suffix)) {
    return name;
  }
  return `${name}${suffix}`;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/**
 * Converts a slug to an Android package name.
 */
export function slugToAndroidPackage(slug: string): string {
  const namespace = slug
    .replace(/\W/g, '')
    .replace(/^(expo|reactnative)/, '')
    .toLowerCase();
  return `expo.modules.${namespace}`;
}

/**
 * Recursively scans for the files within the directory. Returned paths are relative to the `root` path.
 */
export async function getFilesAsync(root: string, dir: string | null = null): Promise<string[]> {
  const files: string[] = [];
  const baseDir = dir ? path.join(root, dir) : root;

  for (const file of await fs.promises.readdir(baseDir)) {
    const relativePath = dir ? path.join(dir, file) : file;

    if (IGNORES_PATHS.includes(relativePath) || IGNORES_PATHS.includes(file)) {
      continue;
    }

    const fullPath = path.join(baseDir, file);
    const stat = await fs.promises.lstat(fullPath);
    if (stat.isDirectory()) {
      files.push(...(await getFilesAsync(root, relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

/**
 * Downloads a package tarball using `npm pack` and returns the filename.
 */
async function npmPackAsync(packageName: string, cwd: string): Promise<string> {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const cmd = ['pack', packageName, '--json'];
  const cmdString = `${npm} ${cmd.join(' ')}`;
  debug('Run:', cmdString, `(cwd: ${cwd})`);

  let results: string;
  try {
    results = (await spawnAsync(npm, cmd, { cwd })).stdout?.trim();
  } catch (error: any) {
    if (error?.stderr?.match(/npm ERR! code E404/)) {
      const pkg =
        error.stderr.match(/npm ERR! 404\s+'(.*)' is not in this registry\./)?.[1] ?? error.stderr;
      throw new Error(`NPM package not found: ` + pkg);
    }
    throw error;
  }

  if (!results) {
    throw new Error(`No output from "${cmdString}"`);
  }

  try {
    const json = JSON.parse(results);
    const packages = normalizeNpmPackResult(json);
    const packageInfo = packages?.[0];
    if (
      !packageInfo ||
      typeof packageInfo !== 'object' ||
      !('filename' in packageInfo) ||
      typeof packageInfo.filename !== 'string'
    ) {
      throw new Error(`Invalid response from npm: ${results}`);
    }
    return packageInfo.filename;
  } catch (error: any) {
    throw new Error(
      `Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`
    );
  }
}

/** Normalize the npm pack JSON formats used before and after npm 12 */
export function normalizeNpmPackResult(result: unknown): unknown[] | null {
  if (Array.isArray(result)) {
    return result;
  } else if (result && typeof result === 'object') {
    return Object.values(result);
  } else {
    return null;
  }
}

// The first SDK the CLI is versioned in lockstep with (CLI major == SDK major). Earlier releases
// used an independent scheme (e.g. `1.x` for sdk-54, `2.x` for sdk-55) whose major doesn't map to
// an SDK, so anything below this falls back to `latest`.
const FIRST_SDK_ALIGNED_MAJOR = 56;

/**
 * Resolves the template dist-tag targeted by a `create-expo-module` release from its own package
 * version. The CLI is published in lockstep with the SDK (e.g. `56.x.y` ships alongside SDK 56), so
 * its major version is the SDK major and maps to `sdk-<major>`. Falls back to `latest` for the
 * older, non-SDK-aligned versions.
 */
export function getTemplateDistTag(version: string | undefined): string {
  const major = Number(version?.split('.')[0]);
  return Number.isInteger(major) && major >= FIRST_SDK_ALIGNED_MAJOR ? `sdk-${major}` : 'latest';
}

/**
 * Selects correct version of the template based on the SDK version and EXPO_BETA flag.
 *
 * - For local modules, `sdkVersion` is the host project's `expo` major. An SDK older than the
 *   template supports (allowed only with `--ignore-compatibility-check`) uses this CLI's template,
 *   because the older `sdk-<major>` tags use a legacy format.
 * - For standalone modules, the SDK is derived from the CLI's own version, so that
 *   `create-expo-module@sdk-XX` scaffolds an SDK XX module rather than always using `latest`.
 *
 * In both cases we fall back to `latest` when the SDK can't be determined.
 */
export function getTemplateVersion(isLocal: boolean, sdkVersion: number | null): string {
  if (env.EXPO_BETA) {
    return 'next';
  }
  if (!isLocal || (sdkVersion != null && sdkVersion < MIN_SUPPORTED_LOCAL_SDK)) {
    return getTemplateDistTag(require('../package.json').version);
  }
  if (sdkVersion == null) {
    console.log();
    console.warn(
      chalk.yellow(
        "Couldn't determine the SDK version from the local project, using `latest` as the template version."
      )
    );
    return 'latest';
  }
  return `sdk-${sdkVersion}`;
}

/**
 * Downloads the template from NPM registry.
 */
export async function downloadPackageAsync(
  targetDir: string,
  isLocal = false,
  sdkVersion: number | null = null
): Promise<string> {
  return await newStep('Downloading module template from npm', async (step) => {
    const templateVersion = getTemplateVersion(isLocal, sdkVersion);
    const packageName = 'expo-module-template';
    const tmpDir = path.join(os.tmpdir(), '.create-expo-module');

    await fs.promises.mkdir(tmpDir, { recursive: true });

    let filename: string;
    try {
      filename = await npmPackAsync(`${packageName}@${templateVersion}`, tmpDir);
    } catch {
      console.log();
      console.warn(
        chalk.yellow(
          "Couldn't download the versioned template from npm, falling back to the latest version."
        )
      );
      filename = await npmPackAsync(`${packageName}@latest`, tmpDir);
    }

    await extractLocalTarball({
      filePath: path.join(tmpDir, filename),
      dir: targetDir,
    });

    await fs.promises.rm(tmpDir, { recursive: true, force: true });

    step.succeed('Downloaded module template from npm registry.');

    return path.join(targetDir, 'package');
  });
}

/** Uses a custom or downloaded template, cleaning up downloaded files when the action finishes. */
export async function withTemplateAsync<T>(
  options: { source?: string; isLocal: boolean; sdkVersion: number | null },
  action: (templatePath: string) => Promise<T>
): Promise<T> {
  const { source, isLocal, sdkVersion } = options;
  if (source) {
    if (!fs.existsSync(source)) {
      throw new UserError(
        `❌ Template source directory does not exist: ${source}.\n` +
          '   Check the --source path and try again.'
      );
    }
    if (!fs.statSync(source).isDirectory()) {
      throw new UserError(
        `❌ Template source is not a directory: ${source}.\n` +
          '   Pass the root directory of an expo-module-template package.'
      );
    }
    return action(source);
  }

  const templateTempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'create-expo-module-template-')
  );
  try {
    const templatePath = await downloadPackageAsync(templateTempDir, isLocal, sdkVersion);
    return await action(templatePath);
  } finally {
    await fs.promises.rm(templateTempDir, { recursive: true, force: true });
  }
}

/**
 * Builds the augmented substitution data object by rendering all snippet slots.
 * Extracted from `createModuleFromTemplate` for reuse.
 */
export async function buildAugmentedData(
  snippetsDir: string,
  data: SubstitutionData | LocalSubstitutionData
) {
  const features = data.project.features;

  // Build view-level snippets first (used inside the View() block)
  const [viewSnippetsSwift, viewSnippetsKt] = await Promise.all([
    buildViewSnippets(snippetsDir, features, data, 'swift'),
    buildViewSnippets(snippetsDir, features, data, 'kt'),
  ]);

  // Build module-level snippets, passing the view snippets for injection
  const [moduleSnippetsSwift, moduleSnippetsKt] = await Promise.all([
    buildModuleSnippets(snippetsDir, features, data, 'swift', viewSnippetsSwift),
    buildModuleSnippets(snippetsDir, features, data, 'kt', viewSnippetsKt),
  ]);

  // Build web module snippets and helpers
  const webEventImport = features.includes('Event')
    ? `\nimport { ${data.project.moduleName}Events } from './${data.project.name}.types';\n`
    : '';
  const webEventType = features.includes('Event') ? `${data.project.moduleName}Events` : '{}';
  const webModuleSnippets = await buildWebModuleSnippets(snippetsDir, features, data);

  // Build combined module import line for App.tsx
  const needsDefaultImport = features.some((f) =>
    (['Constant', 'Function', 'AsyncFunction', 'Event'] as string[]).includes(f)
  );
  const moduleNamedImports: string[] = [];
  if (features.includes('View')) moduleNamedImports.push(data.project.viewName);
  if (features.includes('SwiftUIView')) moduleNamedImports.push(data.project.swiftUIViewName);
  if (features.includes('ComposeView')) moduleNamedImports.push(data.project.composeViewName);
  if (features.includes('SwiftUIModifier')) {
    const fnName = lowerFirst(data.project.swiftUIModifierName);
    moduleNamedImports.push(fnName);
  }
  if (features.includes('ComposeModifier')) {
    const fnName = lowerFirst(data.project.composeModifierName);
    moduleNamedImports.push(fnName);
  }
  if (features.includes('SharedObject'))
    moduleNamedImports.push(`use${data.project.sharedObjectName}`);

  let appModuleCombinedImport = '';
  if (needsDefaultImport || moduleNamedImports.length > 0) {
    const parts: string[] = [];
    if (needsDefaultImport) parts.push(data.project.name);
    if (moduleNamedImports.length > 0) parts.push(`{ ${moduleNamedImports.join(', ')} }`);
    appModuleCombinedImport = `import ${parts.join(', ')} from '${data.project.slug}';\n`;
  }

  const [appReactImportSnippets, appExternalImportSnippets, appHookSnippets, appJSXSnippets] =
    await Promise.all([
      buildAppSnippets(snippetsDir, features, data, 'react-imports'),
      buildAppSnippets(snippetsDir, features, data, 'external-imports'),
      buildAppSnippets(snippetsDir, features, data, 'hooks'),
      buildAppSnippets(snippetsDir, features, data, 'jsx'),
    ]);

  return {
    ...data,
    moduleSnippetsSwift,
    moduleSnippetsKt,
    viewSnippetsSwift,
    viewSnippetsKt,
    webEventImport,
    webEventType,
    webModuleSnippets,
    appModuleCombinedImport,
    appExternalImportSnippets,
    appReactImportSnippets,
    appHookSnippets,
    appJSXSnippets,
    usesSwiftUI: usesSwiftUI(features),
    usesCompose: usesCompose(features),
    usesExpoUI: usesExpoUI(features),
  };
}

/**
 * Copies template files to the target directory.
 */
export async function copyTemplateFiles(
  templatePath: string,
  targetPath: string,
  augmentedData: Awaited<ReturnType<typeof buildAugmentedData>>,
  options: {
    platforms: Platform[];
    platformsOnly?: boolean;
    moduleType: 'standalone' | 'local';
  },
  writeFile: WriteFile = writeFileAsync
): Promise<void> {
  const { platforms, platformsOnly = false, moduleType } = options;
  const files = await getFilesAsync(templatePath);

  for (const file of files) {
    // Skip platform-specific directories when the platform was not selected.
    const topLevelDir = file.split(path.sep)[0] ?? '';
    const requiredPlatform = TEMPLATE_DIR_TO_PLATFORM[topLevelDir];

    if (platformsOnly) {
      if (!requiredPlatform || !platforms.includes(requiredPlatform)) continue;
    } else {
      if (requiredPlatform && !platforms.includes(requiredPlatform)) continue;
      if (moduleType === 'local') {
        if (LOCAL_EXCLUDED_FILES.has(file) || LOCAL_EXCLUDED_DIRS.has(topLevelDir)) continue;
      }
    }

    const renderedRelativePath = ejs.render(file.replace(/^\$/, ''), augmentedData, {
      openDelimiter: '{',
      closeDelimiter: '}',
      escape: (value: string) => value.replace(/\./g, path.sep),
    });
    const fromPath = path.join(templatePath, file);
    const toPath = path.join(targetPath, renderedRelativePath);
    const template = await fs.promises.readFile(fromPath, 'utf8');
    const renderedContent = ejs.render(template, augmentedData);

    await writeFile(toPath, renderedContent);
  }
}

/**
 * Copies the pnpm settings for the module and its example app. See `shouldCreatePnpmWorkspace`.
 * Templates published before these files were added don't have them, and existing files are kept
 * so that rerunning the command doesn't revert settings, e.g. from `pnpm approve-builds`.
 */
export async function copyPnpmWorkspaceFiles(
  templatePath: string,
  targetPath: string,
  writeFile: WriteFile = writeFileAsync
) {
  for (const [file, source] of Object.entries(PNPM_WORKSPACE_FILES)) {
    const fromPath = path.join(templatePath, source);
    const toPath = path.join(targetPath, file);
    if (fs.existsSync(fromPath) && fs.existsSync(path.dirname(toPath)) && !fs.existsSync(toPath)) {
      await writeFile(toPath, await fs.promises.readFile(fromPath, 'utf8'));
    }
  }
}

/**
 * Re-renders the .web.ts stub as a full web implementation using the provided data.
 * Called when adding `web` to a module that already has native platforms.
 */
export async function updateWebStub(
  templatePath: string,
  targetDir: string,
  data: SubstitutionData | LocalSubstitutionData,
  writeFile: WriteFile = writeFileAsync
): Promise<void> {
  const snippetsDir = path.join(templatePath, 'snippets');
  const augmentedData = await buildAugmentedData(snippetsDir, data);

  // Template filename uses EJS: src/{%- project.moduleName %}.web.ts
  const templateRelFile = path.join('src', `{%- project.moduleName %}.web.ts`);
  const renderedFileName = ejs.render(templateRelFile.replace(/^\$/, ''), augmentedData, {
    openDelimiter: '{',
    closeDelimiter: '}',
    escape: (value: string) => value.replace(/\./g, path.sep),
  });

  const fromPath = path.join(templatePath, templateRelFile);
  const toPath = path.join(targetDir, renderedFileName);
  if (fs.existsSync(toPath)) {
    const currentContent = await fs.promises.readFile(toPath, 'utf8');
    const sentinel = getGeneratedWebStubSentinel(data.project.moduleName);
    if (!currentContent.includes(sentinel)) {
      throw new Error(
        `Refusing to overwrite ${toPath} because it does not look like the generated web stub.\n` +
          `Move your custom web implementation or restore the generated "${sentinel}" stub before running this command.`
      );
    }
  }

  const template = await fs.promises.readFile(fromPath, 'utf8');
  const renderedContent = ejs.render(template, augmentedData);

  await writeFile(toPath, renderedContent);
}
