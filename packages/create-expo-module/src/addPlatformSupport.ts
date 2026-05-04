import chalk from 'chalk';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import prompts from 'prompts';

import { detectFeaturesFromFile, findModuleDefinitionFile } from './featureDetection';
import { resolveFeatures, type Feature } from './features';
import { formatRunCommand, resolvePackageManager } from './packageManager';
import { ALL_PLATFORMS, type Platform } from './prompts';
import { copyNativeFileSnippets, copyWebFileSnippets } from './snippets';
import {
  buildAugmentedData,
  copyTemplateFiles,
  downloadPackageAsync,
  handleSuffix,
  slugToAndroidPackage,
  updateWebStub,
} from './templateUtils';
import type { LocalSubstitutionData, SubstitutionData } from './types';
import { isInteractive } from './utils/env';
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

async function detectPublicModuleNameFromModuleSourceFiles(
  moduleRoot: string
): Promise<string | null> {
  const sourceFiles = await findModuleSourceFiles(moduleRoot);

  for (const filePath of sourceFiles) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const moduleName = detectPublicModuleNameFromModuleSourceContent(content);
    if (moduleName) {
      return moduleName;
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
  const allPlatforms = [...info.platforms, ...newPlatforms];
  const resolvedSharedObjectName = sharedObjectName ?? `${info.moduleName}SharedObject`;

  const project = {
    slug: info.slug,
    name: info.name,
    package: info.packageName,
    moduleName: info.moduleName,
    viewName: handleSuffix(info.name, 'View'),
    sharedObjectName: resolvedSharedObjectName,
    platforms: allPlatforms,
    features,
  };

  if (info.isLocal) {
    return { project, type: 'local' };
  }

  return {
    project: { ...project, version: info.version, description: info.description },
    author: info.author,
    license: info.license,
    repo: info.repo,
    type: 'standalone',
  };
}

async function updateModuleConfig(
  configPath: string,
  newPlatforms: Platform[],
  data: SubstitutionData | LocalSubstitutionData
): Promise<void> {
  const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));
  config.platforms = [...(config.platforms ?? []), ...newPlatforms];

  for (const platform of newPlatforms) {
    if (platform === 'apple') {
      config.apple = { modules: [data.project.moduleName] };
    } else if (platform === 'android') {
      config.android = { modules: [`${data.project.package}.${data.project.moduleName}`] };
    }
    // web: no native config block needed
  }

  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export type AddPlatformSupportOptions = {
  platform?: string[];
  features?: string[];
  source?: string;
};

type TemplatePathInfo = {
  templatePath: string;
  templateTempDir: string | null;
};

function exitWithError(message: string): never {
  console.error(chalk.red(message));
  process.exit(1);
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

async function findExistingModuleDefinitionFile(
  moduleRoot: string,
  moduleInfo: ExistingModuleInfo
): Promise<string | null> {
  const existingNativePlatform = moduleInfo.platforms.find(
    (p): p is 'apple' | 'android' => p === 'apple' || p === 'android'
  );

  if (existingNativePlatform) {
    const moduleDefinitionFile = await findModuleDefinitionFile(moduleRoot, existingNativePlatform);
    if (!moduleDefinitionFile) {
      exitWithError(
        `❌ Could not find a module definition file in ` +
          `${existingNativePlatform === 'apple' ? 'ios/' : 'android/src/'}.\n` +
          `   This command only works with modules using the Expo Modules API DSL.\n` +
          `   Older module formats are not supported.`
      );
    }
    return moduleDefinitionFile;
  }

  return null;
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

async function resolveDetectedFeatures(
  moduleDefinitionFile: string | null,
  options: AddPlatformSupportOptions
): Promise<{ detectedFeatures: Feature[]; sharedObjectName: string | null }> {
  if (options.features && options.features.length > 0) {
    return { detectedFeatures: resolveFeatures(options.features), sharedObjectName: null };
  }

  if (moduleDefinitionFile) {
    const { features, sharedObjectName } = await detectFeaturesFromFile(moduleDefinitionFile);
    if (features.length === 0) {
      console.warn(
        chalk.yellow(
          '⚠️  No features detected in the module definition. Generating a minimal scaffold.'
        )
      );
    } else {
      console.log(
        chalk.dim(
          `Detected features from ${path.relative(CWD, moduleDefinitionFile)} (best effort). ` +
            'Use --features to override.'
        )
      );
    }
    return { detectedFeatures: features, sharedObjectName };
  }

  // Web-only module adding a native platform: no ModuleDefinition to scan.
  console.log(chalk.dim('No native module definition found. Generating minimal scaffold.'));
  return { detectedFeatures: [], sharedObjectName: null };
}

async function updatePublicModuleNameFromSources(
  moduleInfo: ExistingModuleInfo,
  moduleRoot: string,
  moduleDefinitionFile: string | null
): Promise<void> {
  const detectedPublicModuleName =
    (moduleDefinitionFile
      ? detectPublicModuleNameFromNativeContent(
          await fs.promises.readFile(moduleDefinitionFile, 'utf8')
        )
      : null) ?? (await detectPublicModuleNameFromModuleSourceFiles(moduleRoot));

  if (detectedPublicModuleName) {
    moduleInfo.name = detectedPublicModuleName;
  }
}

async function resolveTemplatePath(
  options: AddPlatformSupportOptions,
  moduleInfo: ExistingModuleInfo
): Promise<TemplatePathInfo> {
  if (options.source) {
    const templatePath = path.resolve(CWD, options.source);
    if (!fs.existsSync(templatePath)) {
      exitWithError(
        `❌ Template source directory does not exist: ${templatePath}.\n` +
          `   Check the --source path and try again.`
      );
    }
    if (!fs.statSync(templatePath).isDirectory()) {
      exitWithError(
        `❌ Template source is not a directory: ${templatePath}.\n` +
          `   Pass the root directory of an expo-module-template package.`
      );
    }
    return { templatePath, templateTempDir: null };
  }

  const templateTempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'add-platform-support-')
  );
  const templatePath = await downloadPackageAsync(templateTempDir, moduleInfo.isLocal);
  return { templatePath, templateTempDir };
}

async function addNativePlatformFiles(
  templatePath: string,
  moduleRoot: string,
  moduleInfo: ExistingModuleInfo,
  platformsToAdd: Platform[],
  detectedFeatures: Feature[],
  data: SubstitutionData | LocalSubstitutionData
): Promise<void> {
  const nativePlatforms = platformsToAdd.filter(
    (p): p is 'apple' | 'android' => p === 'apple' || p === 'android'
  );
  if (nativePlatforms.length === 0) {
    return;
  }

  const snippetsDir = path.join(templatePath, 'snippets');
  const augmentedData = await buildAugmentedData(snippetsDir, data);
  await newStep('Adding platform files', async (step) => {
    await copyTemplateFiles(templatePath, moduleRoot, augmentedData, {
      platforms: nativePlatforms,
      platformsOnly: true,
      moduleType: moduleInfo.isLocal ? 'local' : 'standalone',
    });
    const dataForNewPlatforms = {
      ...data,
      project: { ...data.project, platforms: nativePlatforms },
    } as SubstitutionData | LocalSubstitutionData;
    await copyNativeFileSnippets(snippetsDir, detectedFeatures, dataForNewPlatforms, moduleRoot);
    step.succeed('Added platform files');
  });
}

async function addWebPlatformFiles(
  templatePath: string,
  moduleRoot: string,
  platformsToAdd: Platform[],
  detectedFeatures: Feature[],
  data: SubstitutionData | LocalSubstitutionData
): Promise<void> {
  if (!platformsToAdd.includes('web')) {
    return;
  }

  const snippetsDir = path.join(templatePath, 'snippets');
  await newStep('Updating web implementation', async (step) => {
    await updateWebStub(templatePath, moduleRoot, data);
    const dataWithWeb = {
      ...data,
      project: { ...data.project, platforms: ['web'] as Platform[] },
    } as SubstitutionData | LocalSubstitutionData;
    await copyWebFileSnippets(snippetsDir, detectedFeatures, dataWithWeb, moduleRoot);
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
  const moduleDefinitionFile = await findExistingModuleDefinitionFile(moduleRoot, moduleInfo);
  const platformsToAdd = await resolvePlatformsToAdd(moduleInfo, options);
  if (!platformsToAdd) {
    return;
  }

  ensureNativePlatformTargetsAvailable(moduleRoot, platformsToAdd);

  const { detectedFeatures, sharedObjectName } = await resolveDetectedFeatures(
    moduleDefinitionFile,
    options
  );

  await updatePublicModuleNameFromSources(moduleInfo, moduleRoot, moduleDefinitionFile);

  const data = buildSubstitutionData(
    moduleInfo,
    platformsToAdd,
    detectedFeatures,
    sharedObjectName
  );
  const { templatePath, templateTempDir } = await resolveTemplatePath(options, moduleInfo);

  try {
    await addNativePlatformFiles(
      templatePath,
      moduleRoot,
      moduleInfo,
      platformsToAdd,
      detectedFeatures,
      data
    );
    await addWebPlatformFiles(templatePath, moduleRoot, platformsToAdd, detectedFeatures, data);

    await newStep('Updating expo-module.config.json', async (step) => {
      await updateModuleConfig(configPath, platformsToAdd, data);
      step.succeed('Updated expo-module.config.json');
    });
  } finally {
    if (templateTempDir) {
      await fs.promises.rm(templateTempDir, { recursive: true, force: true });
    }
  }

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
