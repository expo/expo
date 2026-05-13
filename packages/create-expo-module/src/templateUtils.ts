import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import ejs from 'ejs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Platform } from './prompts';
import {
  buildAppSnippets,
  buildModuleSnippets,
  buildViewSnippets,
  buildWebModuleSnippets,
} from './snippets';
import type { LocalSubstitutionData, SubstitutionData } from './types';
import { env } from './utils/env';
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
    if (!Array.isArray(json) || !json[0]?.filename) {
      throw new Error(`Invalid response from npm: ${results}`);
    }
    return json[0].filename;
  } catch (error: any) {
    throw new Error(
      `Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`
    );
  }
}

/**
 * Gets expo SDK version major from the local package.json.
 */
async function getLocalSdkMajorVersion(): Promise<string | null> {
  const path = require.resolve('expo/package.json', { paths: [process.cwd()] });
  if (!path) {
    return null;
  }
  const { version } = require(path) ?? {};
  return version?.split('.')[0] ?? null;
}

/**
 * Selects correct version of the template based on the SDK version for local modules and EXPO_BETA flag.
 */
async function getTemplateVersion(isLocal: boolean) {
  if (env.EXPO_BETA) {
    return 'next';
  }
  if (!isLocal) {
    return 'latest';
  }
  try {
    const sdkVersionMajor = await getLocalSdkMajorVersion();
    return sdkVersionMajor ? `sdk-${sdkVersionMajor}` : 'latest';
  } catch {
    console.log();
    console.warn(
      chalk.yellow(
        "Couldn't determine the SDK version from the local project, using `latest` as the template version."
      )
    );
    return 'latest';
  }
}

/**
 * Downloads the template from NPM registry.
 */
export async function downloadPackageAsync(targetDir: string, isLocal = false): Promise<string> {
  return await newStep('Downloading module template from npm', async (step) => {
    const templateVersion = await getTemplateVersion(isLocal);
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
  }
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

    if (!fs.existsSync(path.dirname(toPath))) {
      await fs.promises.mkdir(path.dirname(toPath), { recursive: true });
    }
    await fs.promises.writeFile(toPath, renderedContent, 'utf8');
  }
}

/**
 * Re-renders the .web.ts stub as a full web implementation using the provided data.
 * Called when adding `web` to a module that already has native platforms.
 */
export async function updateWebStub(
  templatePath: string,
  targetDir: string,
  data: SubstitutionData | LocalSubstitutionData
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

  if (!fs.existsSync(path.dirname(toPath))) {
    await fs.promises.mkdir(path.dirname(toPath), { recursive: true });
  }
  await fs.promises.writeFile(toPath, renderedContent, 'utf8');
}
