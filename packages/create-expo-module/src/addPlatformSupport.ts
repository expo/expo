import chalk from 'chalk';
import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';

import {
  type DetectedExpoModule,
  detectExpoModuleFromContent,
  detectFeaturesFromContent,
  detectV2FeaturesFromContent,
  findExpoModuleFile,
  findModuleDefinitionFile,
} from './featureDetection';
import {
  filterFeaturesByPlatforms,
  getViewsModulePlatforms,
  resolveFeatures,
  type Feature,
} from './features';
import { assertSupportedLocalSdk, getLocalSdkMajorVersion } from './localSdk';
import { MODULES_API_VERSIONS, resolveModulesApi, type ModulesApi } from './modulesApi';
import { formatRunCommand, resolvePackageManager } from './packageManager';
import { ALL_PLATFORMS, type NativePlatform, type Platform } from './prompts';
import { copyNativeFileSnippets, copyWebFileSnippets } from './snippets';
import {
  buildAugmentedData,
  copyTemplateFiles,
  createSubstitutionData,
  getViewsNativeModuleName,
  type AugmentedData,
  slugToAndroidPackage,
  updateWebStub,
  withTemplateAsync,
} from './templateUtils';
import type { LocalSubstitutionData, SubstitutionData } from './types';
import { isInteractive } from './utils/env';
import { withFileRollback, type WriteFile } from './utils/files';
import { newStep } from './utils/ora';

const CWD = process.env.INIT_CWD || process.cwd();

type ExistingModuleInfo = {
  slug: string;
  /** Base name without "Module" suffix, e.g. "ApsView" */
  name: string;
  /** Full module name, e.g. "ApsViewModule" */
  moduleName: string;
  /** Android package, e.g. "expo.modules.apsview" */
  packageName: string;
  platforms: Platform[];
  isLocal: boolean;
  version: string;
  description: string;
  author: string;
  license: string;
  repo: string;
};

const nativeModuleNamePattern = /Name\s*\(\s*["']([^"']+)["']\s*\)/;
const nativeViewModuleNamePattern = /requireNativeView(?:<[\s\S]*?>)?\(\s*(["'`])([^"'`]+)\1/g;
const moduleSourceNamePatterns = [
  /globalThis\.expo\?\.\s*modules\?\.\s*\[\s*(["'`])([^"'`]+)\1\s*\]/,
  /requireNativeModule(?:<[\s\S]*?>)?\(\s*(["'`])([^"'`]+)\1\s*\)/,
  /requireOptionalNativeModule(?:<[\s\S]*?>)?\(\s*(["'`])([^"'`]+)\1\s*\)/,
  /registerWebModule\s*\(\s*[^,]+,\s*(["'`])([^"'`]+)\1\s*\)/,
] as const;

export function detectPublicModuleNameFromNativeContent(content: string): string | null {
  const moduleDefinitionIndex = content.indexOf('ModuleDefinition');
  const searchContent = moduleDefinitionIndex >= 0 ? content.slice(moduleDefinitionIndex) : content;
  return searchContent.match(nativeModuleNamePattern)?.[1] ?? null;
}

export function detectPublicModuleNameFromModuleSourceContent(content: string): string | null {
  for (const pattern of moduleSourceNamePatterns) {
    const match = content.match(pattern);
    if (match?.[2]) {
      return match[2];
    }
  }
  return null;
}

async function findModuleSourceFiles(moduleRoot: string): Promise<string[]> {
  const srcRoot = path.join(moduleRoot, 'src');
  const sourceFiles: string[] = [];

  async function visit(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__') {
          continue;
        }
        await visit(entryPath);
        continue;
      }

      if (
        !/\.(ts|tsx|js|jsx)$/.test(entry.name) ||
        entry.name.endsWith('.d.ts') ||
        entry.name.includes('.test.') ||
        entry.name.includes('.spec.') ||
        entry.name.endsWith('.types.ts')
      ) {
        continue;
      }
      sourceFiles.push(entryPath);
    }
  }

  await visit(srcRoot);
  return sourceFiles.sort((left, right) => {
    const leftRelative = path.relative(srcRoot, left);
    const rightRelative = path.relative(srcRoot, right);
    const leftDepth = leftRelative.split(path.sep).length;
    const rightDepth = rightRelative.split(path.sep).length;
    if (leftDepth !== rightDepth) {
      return leftDepth - rightDepth;
    }
    return leftRelative.localeCompare(rightRelative);
  });
}

/** Returns the first value that `find` returns for the content of a module source file. */
async function findInModuleSourceFiles<T>(
  moduleRoot: string,
  find: (content: string) => T | null | undefined
): Promise<T | null> {
  for (const file of await findModuleSourceFiles(moduleRoot)) {
    const found = find(await fs.promises.readFile(file, 'utf8'));
    if (found) {
      return found;
    }
  }
  return null;
}

async function readExistingModuleInfo(moduleRoot: string): Promise<ExistingModuleInfo> {
  const configPath = path.join(moduleRoot, 'expo-module.config.json');
  const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));

  const platforms: Platform[] = ((config.platforms ?? []) as string[]).filter((p): p is Platform =>
    (ALL_PLATFORMS as readonly string[]).includes(p)
  );

  const appleModule: string | undefined = config.apple?.modules?.[0];
  const androidClass: string | undefined = config.android?.modules?.[0];

  let moduleName: string;
  if (appleModule) {
    moduleName = appleModule;
  } else if (androidClass) {
    moduleName = androidClass.split('.').pop()!;
  } else {
    // Web-only module: derive a conventional module name from the directory name
    const base = path.basename(moduleRoot);
    moduleName =
      base.charAt(0).toUpperCase() +
      base.slice(1).replace(/-./g, (m) => (m[1] ?? '').toUpperCase()) +
      'Module';
  }

  // Determine project.name from the *.types.ts file in src/.
  let name: string;
  try {
    const srcFiles = await fs.promises.readdir(path.join(moduleRoot, 'src'));
    const typesFile = srcFiles.find((f) => f.endsWith('.types.ts'));
    name = typesFile ? typesFile.replace(/\.types\.ts$/, '') : moduleName;
  } catch {
    name = moduleName;
  }

  let packageName: string;
  if (androidClass) {
    packageName = androidClass.split('.').slice(0, -1).join('.');
  } else {
    packageName = slugToAndroidPackage(path.basename(moduleRoot));
  }

  const packageJsonPath = path.join(moduleRoot, 'package.json');
  const isLocal = !fs.existsSync(packageJsonPath);

  let pkgJson: any = null;
  if (!isLocal) {
    pkgJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
  }

  const slug = isLocal ? path.basename(moduleRoot) : (pkgJson?.name ?? path.basename(moduleRoot));

  let version = '0.1.0';
  let description = '';
  let author = '';
  let license = 'MIT';
  let repo = '';

  if (pkgJson) {
    version = pkgJson.version ?? '0.1.0';
    description = pkgJson.description ?? '';
    license = pkgJson.license ?? 'MIT';
    repo =
      typeof pkgJson.repository === 'string' ? pkgJson.repository : (pkgJson.repository?.url ?? '');
    if (typeof pkgJson.author === 'string') {
      author = pkgJson.author;
    } else if (pkgJson.author?.name) {
      const a = pkgJson.author;
      author = `${a.name}${a.email ? ` <${a.email}>` : ''}${a.url ? ` (${a.url})` : ''}`;
    }
  }

  return {
    slug,
    name,
    moduleName,
    packageName,
    platforms,
    isLocal,
    version,
    description,
    author,
    license,
    repo,
  };
}

function buildSubstitutionData(
  info: ExistingModuleInfo,
  newPlatforms: Platform[],
  features: Feature[],
  sharedObjectName: string | null
): SubstitutionData | LocalSubstitutionData {
  return createSubstitutionData(
    {
      slug: info.slug,
      name: info.name,
      package: info.packageName,
      moduleName: info.moduleName,
      sharedObjectName: sharedObjectName ?? `${info.moduleName}SharedObject`,
      platforms: [...info.platforms, ...newPlatforms],
      features,
    },
    info.isLocal
      ? null
      : {
          version: info.version,
          description: info.description,
          author: info.author,
          license: info.license,
          repo: info.repo,
        }
  );
}

/**
 * Adds the new platforms to `expo-module.config.json`, with their native modules from the
 * template's config.
 */
async function updateModuleConfig(
  configPath: string,
  templatePath: string,
  newPlatforms: Platform[],
  augmentedData: AugmentedData,
  writeFile: WriteFile
): Promise<void> {
  const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));
  const templateConfig = JSON.parse(
    ejs.render(
      await fs.promises.readFile(path.join(templatePath, 'expo-module.config.json'), 'utf-8'),
      augmentedData
    )
  );
  config.platforms = [...(config.platforms ?? []), ...newPlatforms];

  for (const platform of newPlatforms) {
    if (templateConfig[platform]) {
      config[platform] = templateConfig[platform];
    }
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
}

export type AddPlatformSupportOptions = {
  platform?: string[];
  features?: string[];
  modulesApi?: ModulesApi;
  source?: string;
  ignoreCompatibilityCheck?: boolean;
};

function exitWithError(message: string): never {
  console.error(chalk.red(message));
  process.exit(1);
}

/**
 * Gets the Expo Modules API version that the module's view components expect, from the native
 * module that they load the views from. Expo Modules API 2.0 modules define views in a separate
 * `<Name>Views` module.
 */
async function detectViewComponentsModulesApi(
  moduleRoot: string,
  name: string
): Promise<ModulesApi | null> {
  return findInModuleSourceFiles(moduleRoot, (content) => {
    const viewModuleNames = [...content.matchAll(nativeViewModuleNamePattern)].map(
      (match) => match[2]
    );
    return MODULES_API_VERSIONS.find((modulesApi) =>
      viewModuleNames.includes(getViewsNativeModuleName(name, modulesApi))
    );
  });
}

const MATCH_EXISTING_CODE_NEXT_STEP =
  'The new code uses the Expo Modules API 2.0 to match the existing code of the module. Use a template and an Expo SDK that support it.';

/**
 * Gets the Expo Modules API version that the new native code should use: the requested one, or
 * the version of the existing native code or view components, which can't fall back to another
 * version. Exits when the requested version would define views in a module that the view
 * components don't load.
 */
async function getNewCodeModulesApi(
  moduleRoot: string,
  moduleInfo: ExistingModuleInfo,
  nativeSources: NativeModuleSources | null,
  features: Feature[],
  newNativePlatforms: NativePlatform[],
  requested: ModulesApi | undefined
): Promise<{ modulesApi: ModulesApi | undefined; matchesExistingCode: boolean }> {
  const addsViews = getViewsModulePlatforms(features, newNativePlatforms).length > 0;
  const viewComponentsModulesApi = addsViews
    ? await detectViewComponentsModulesApi(moduleRoot, moduleInfo.name)
    : null;
  if (viewComponentsModulesApi) {
    if (requested && requested !== viewComponentsModulesApi) {
      const requestedName = requested === 'v2' ? 'Expo Modules API 2.0' : 'Expo Modules API 1.0';
      const loadedFrom = getViewsNativeModuleName(moduleInfo.name, viewComponentsModulesApi);
      const definedIn = getViewsNativeModuleName(moduleInfo.name, requested);
      exitWithError(
        `❌ Cannot generate the views with the ${requestedName}, because the view components of the module load them from the "${loadedFrom}" native module, and ${requestedName} code defines them in "${definedIn}".\n` +
          `   Re-run the command with --modules-api ${viewComponentsModulesApi}.`
      );
    }
    return { modulesApi: viewComponentsModulesApi, matchesExistingCode: true };
  }
  if (requested || !nativeSources) {
    return { modulesApi: requested, matchesExistingCode: false };
  }
  return { modulesApi: nativeSources.expoModule ? 'v2' : 'v1', matchesExistingCode: true };
}

async function readModuleInfoOrExit(
  moduleRoot: string,
  configPath: string
): Promise<ExistingModuleInfo> {
  if (!fs.existsSync(configPath)) {
    exitWithError(
      `❌ Could not find expo-module.config.json in ${moduleRoot}.\n` +
        `   Run this command from the module's root directory, or pass the path as an argument:\n` +
        `   npx create-expo-module add-platform-support <path-to-module>`
    );
  }

  try {
    return await readExistingModuleInfo(moduleRoot);
  } catch (e: any) {
    exitWithError(`❌ Failed to read module configuration: ${e.message}`);
  }
}

/**
 * The native module sources of the module's existing native platform.
 */
type NativeModuleSources = {
  /** The files to name in logs. */
  files: string[];
  /** The Expo Modules API 2.0 module class, or null for a Module DSL module. */
  expoModule: (DetectedExpoModule & { source: string }) | null;
  /**
   * The source of the Module DSL definition: the module of an Expo Modules API 1.0 module, or the
   * views module of a 2.0 module.
   */
  moduleDefinition: string | null;
};

async function readExistingNativeModuleSources(
  moduleRoot: string,
  moduleInfo: ExistingModuleInfo
): Promise<NativeModuleSources | null> {
  const existingNativePlatform = moduleInfo.platforms.find((p) => p !== 'web');
  if (!existingNativePlatform) {
    return null;
  }

  const [expoModuleFile, moduleDefinitionFile] = await Promise.all([
    findExpoModuleFile(moduleRoot, existingNativePlatform),
    findModuleDefinitionFile(moduleRoot, existingNativePlatform),
  ]);
  const files = [expoModuleFile, moduleDefinitionFile].filter((file) => file !== null);
  if (files.length === 0) {
    exitWithError(
      `❌ Could not find a module definition file in ` +
        `${existingNativePlatform === 'apple' ? 'ios/' : 'android/src/'}.\n` +
        `   This command only works with modules using the Expo Modules API.\n` +
        `   Older module formats are not supported.`
    );
  }
  const read = (file: string | null) => (file ? fs.promises.readFile(file, 'utf8') : null);
  const [expoModuleSource, moduleDefinition] = await Promise.all([
    read(expoModuleFile),
    read(moduleDefinitionFile),
  ]);
  const expoModuleNames = expoModuleSource ? detectExpoModuleFromContent(expoModuleSource) : null;
  const expoModule =
    expoModuleSource && expoModuleNames ? { source: expoModuleSource, ...expoModuleNames } : null;
  return { files, expoModule, moduleDefinition };
}

async function resolvePlatformsToAdd(
  moduleInfo: ExistingModuleInfo,
  options: AddPlatformSupportOptions
): Promise<Platform[] | null> {
  const availablePlatforms = ALL_PLATFORMS.filter((p) => !moduleInfo.platforms.includes(p));

  if (availablePlatforms.length === 0) {
    console.log(chalk.yellow('ℹ️  All platforms are already supported by this module.'));
    return null;
  }

  if (options.platform && options.platform.length > 0) {
    const invalid = options.platform.filter(
      (p) => !(ALL_PLATFORMS as readonly string[]).includes(p)
    );
    if (invalid.length > 0) {
      exitWithError(
        `❌ Invalid platform(s): ${invalid.join(', ')}. Valid values: ${ALL_PLATFORMS.join(', ')}.`
      );
    }
    const conflicts = options.platform.filter((p) => moduleInfo.platforms.includes(p as Platform));
    if (conflicts.length > 0) {
      exitWithError(
        `❌ The following platform(s) are already supported: ${conflicts.join(', ')}.\n` +
          `   No changes were made.`
      );
    }
    return options.platform as Platform[];
  }

  if (!isInteractive()) {
    exitWithError(
      `❌ --platform is required in non-interactive mode.\n` +
        `   Available: ${availablePlatforms.join(', ')}\n` +
        `   Example: npx create-expo-module add-platform-support --platform ${availablePlatforms[0]}`
    );
  }

  const result = await prompts(
    {
      type: 'multiselect',
      name: 'platforms',
      message: 'Which platforms would you like to add?',
      choices: availablePlatforms.map((p) => ({ title: p, value: p, selected: false })),
      min: 1,
      hint: '- Space to select. Enter to confirm.',
    },
    { onCancel: () => process.exit(0) }
  );
  return result.platforms;
}

function ensureNativePlatformTargetsAvailable(
  moduleRoot: string,
  platformsToAdd: Platform[]
): void {
  for (const platform of platformsToAdd) {
    if (platform === 'web') continue;
    const dir = path.join(moduleRoot, platform === 'apple' ? 'ios' : 'android');
    if (fs.existsSync(dir)) {
      const stat = fs.statSync(dir);
      exitWithError(
        `❌ ${dir} already exists as a ${stat.isDirectory() ? 'directory' : 'file'}.\n` +
          `   Cannot add ${platform === 'apple' ? 'Apple' : 'Android'} platform support without overwriting existing files.\n` +
          `   No changes were made.`
      );
    }
  }
}

function resolveDetectedFeatures(
  sources: NativeModuleSources | null,
  options: AddPlatformSupportOptions
): { detectedFeatures: Feature[]; sharedObjectName: string | null } {
  if (options.features && options.features.length > 0) {
    return { detectedFeatures: resolveFeatures(options.features), sharedObjectName: null };
  }

  if (sources) {
    const v2 = sources.expoModule ? detectV2FeaturesFromContent(sources.expoModule.source) : null;
    const dsl = sources.moduleDefinition
      ? detectFeaturesFromContent(sources.moduleDefinition)
      : null;
    const features = [...new Set([...(v2?.features ?? []), ...(dsl?.features ?? [])])];
    if (features.length === 0) {
      console.warn(
        chalk.yellow(
          '⚠️  No features detected in the module definition. Generating a minimal scaffold.'
        )
      );
    } else {
      console.log(
        chalk.dim(
          `Detected features from ${sources.files.map((file) => path.relative(CWD, file)).join(', ')} (best effort). ` +
            'Use --features to override.'
        )
      );
    }
    return {
      detectedFeatures: features,
      sharedObjectName: v2?.sharedObjectName ?? dsl?.sharedObjectName ?? null,
    };
  }

  // Web-only module adding a native platform: no ModuleDefinition to scan.
  console.log(chalk.dim('No native module definition found. Generating minimal scaffold.'));
  return { detectedFeatures: [], sharedObjectName: null };
}

/**
 * Reads the module names from the native sources, falling back to the module's JS sources.
 */
async function updateModuleNamesFromSources(
  moduleInfo: ExistingModuleInfo,
  moduleRoot: string,
  sources: NativeModuleSources | null
): Promise<void> {
  if (sources?.expoModule) {
    moduleInfo.name = sources.expoModule.name;
    moduleInfo.moduleName = sources.expoModule.moduleName;
    return;
  }

  const detectedPublicModuleName =
    (sources?.moduleDefinition
      ? detectPublicModuleNameFromNativeContent(sources.moduleDefinition)
      : null) ??
    (await findInModuleSourceFiles(moduleRoot, detectPublicModuleNameFromModuleSourceContent));

  if (detectedPublicModuleName) {
    moduleInfo.name = detectedPublicModuleName;
  }
}

function withPlatforms(data: AugmentedData, platforms: Platform[]): AugmentedData {
  return { ...data, project: { ...data.project, platforms } };
}

async function addNativePlatformFiles(
  templatePath: string,
  moduleRoot: string,
  moduleInfo: ExistingModuleInfo,
  platformsToAdd: Platform[],
  detectedFeatures: Feature[],
  augmentedData: AugmentedData,
  writeFile: WriteFile
): Promise<void> {
  const nativePlatforms = platformsToAdd.filter(
    (p): p is 'apple' | 'android' => p === 'apple' || p === 'android'
  );
  if (nativePlatforms.length === 0) {
    return;
  }

  const snippetsDir = path.join(templatePath, 'snippets');
  await newStep('Adding platform files', async (step) => {
    await copyTemplateFiles(
      templatePath,
      moduleRoot,
      augmentedData,
      {
        platforms: nativePlatforms,
        platformsOnly: true,
        moduleType: moduleInfo.isLocal ? 'local' : 'standalone',
      },
      writeFile
    );
    const dataForNewPlatforms = withPlatforms(augmentedData, nativePlatforms);
    await copyNativeFileSnippets(
      snippetsDir,
      detectedFeatures,
      dataForNewPlatforms,
      moduleRoot,
      writeFile
    );
    step.succeed('Added platform files');
  });
}

async function addWebPlatformFiles(
  templatePath: string,
  moduleRoot: string,
  platformsToAdd: Platform[],
  detectedFeatures: Feature[],
  augmentedData: AugmentedData,
  writeFile: WriteFile
): Promise<void> {
  if (!platformsToAdd.includes('web')) {
    return;
  }

  const snippetsDir = path.join(templatePath, 'snippets');
  await newStep('Updating web implementation', async (step) => {
    await updateWebStub(templatePath, moduleRoot, augmentedData, writeFile);
    const dataWithWeb = withPlatforms(augmentedData, ['web']);
    await copyWebFileSnippets(snippetsDir, detectedFeatures, dataWithWeb, moduleRoot, writeFile);
    step.succeed('Updated web implementation');
  });
}

function getNativeOpenCommands(platformsToAdd: Platform[]): string[] {
  const packageManager = resolvePackageManager();
  return platformsToAdd
    .filter(
      (platform): platform is 'apple' | 'android' => platform === 'apple' || platform === 'android'
    )
    .map((platform) =>
      platform === 'apple'
        ? formatRunCommand(packageManager, 'open:ios')
        : formatRunCommand(packageManager, 'open:android')
    );
}

export async function addPlatformSupport(
  modulePathArg: string | undefined,
  options: AddPlatformSupportOptions
): Promise<void> {
  const moduleRoot = modulePathArg ? path.resolve(CWD, modulePathArg) : CWD;
  const configPath = path.join(moduleRoot, 'expo-module.config.json');
  const moduleInfo = await readModuleInfoOrExit(moduleRoot, configPath);
  // Prefer the app above the module. A module outside the app (for example, in a custom
  // `nativeModulesDir`) has no `expo` above it, so fall back to the app in the working directory.
  const sdkVersion = moduleInfo.isLocal
    ? (getLocalSdkMajorVersion(moduleRoot) ?? getLocalSdkMajorVersion(CWD))
    : null;
  assertSupportedLocalSdk(sdkVersion, options.ignoreCompatibilityCheck);
  const nativeSources = await readExistingNativeModuleSources(moduleRoot, moduleInfo);
  const platformsToAdd = await resolvePlatformsToAdd(moduleInfo, options);
  if (!platformsToAdd) {
    return;
  }

  ensureNativePlatformTargetsAvailable(moduleRoot, platformsToAdd);

  const allPlatforms: Platform[] = [...moduleInfo.platforms, ...platformsToAdd];
  const { detectedFeatures: rawFeatures, sharedObjectName } = resolveDetectedFeatures(
    nativeSources,
    options
  );
  const detectedFeatures = filterFeaturesByPlatforms(rawFeatures, allPlatforms);
  await updateModuleNamesFromSources(moduleInfo, moduleRoot, nativeSources);
  // Web code doesn't depend on the Expo Modules API version.
  const newNativePlatforms = platformsToAdd.filter((platform) => platform !== 'web');
  const newCodeModulesApi =
    newNativePlatforms.length > 0
      ? await getNewCodeModulesApi(
          moduleRoot,
          moduleInfo,
          nativeSources,
          detectedFeatures,
          newNativePlatforms,
          options.modulesApi
        )
      : null;

  const data = buildSubstitutionData(
    moduleInfo,
    platformsToAdd,
    detectedFeatures,
    sharedObjectName
  );
  await withTemplateAsync(
    {
      source: options.source ? path.resolve(CWD, options.source) : undefined,
      isLocal: moduleInfo.isLocal,
      sdkVersion,
    },
    async (templatePath) => {
      const modulesApi = newCodeModulesApi
        ? resolveModulesApi(
            newCodeModulesApi.modulesApi,
            templatePath,
            sdkVersion,
            newCodeModulesApi.matchesExistingCode ? MATCH_EXISTING_CODE_NEXT_STEP : undefined
          )
        : 'v1';
      const augmentedData = await buildAugmentedData(
        path.join(templatePath, 'snippets'),
        data,
        modulesApi
      );
      await withFileRollback(async (writeFile) => {
        await addNativePlatformFiles(
          templatePath,
          moduleRoot,
          moduleInfo,
          platformsToAdd,
          detectedFeatures,
          augmentedData,
          writeFile
        );
        await addWebPlatformFiles(
          templatePath,
          moduleRoot,
          platformsToAdd,
          detectedFeatures,
          augmentedData,
          writeFile
        );

        await newStep('Updating expo-module.config.json', async (step) => {
          await updateModuleConfig(
            configPath,
            templatePath,
            platformsToAdd,
            augmentedData,
            writeFile
          );
          step.succeed('Updated expo-module.config.json');
        });
      });
    }
  );

  console.log();
  console.log(`✅ Successfully added ${platformsToAdd.join(', ')} support to the module.`);
  if (detectedFeatures.length > 0) {
    console.log(chalk.dim(`   Scaffolded features: ${detectedFeatures.join(', ')}`));
  }

  const nativeOpenCommands = getNativeOpenCommands(platformsToAdd);
  if (nativeOpenCommands.length > 0) {
    console.log(
      chalk.dim(`   To write the native implementation, use ${nativeOpenCommands.join(' or ')}.`)
    );
  }
}
