import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';

import { exists, readJSON, readText, writeGenerated } from './files';
import { readNativeBuild, validateBuildDependencies, type NativeBuild } from './metadata';
import { readCommandOutput, runCommand } from './process';

// These are build recipes, not module registrations. Autolinking owns the registry.
const recipes: Record<string, string> = {
  expo: 'Expo',
  'expo-modules-core': 'ExpoModulesCore',
  'expo-modules-jsi': 'ExpoModulesJSI',
  '@expo/dom-webview': 'ExpoDomWebView',
  '@expo/log-box': 'ExpoLogBox',
  'expo-asset': 'ExpoAsset',
  'expo-constants': 'EXConstants',
  'expo-file-system': 'ExpoFileSystem',
  'expo-font': 'ExpoFont',
  'expo-keep-awake': 'ExpoKeepAwake',
  'expo-haptics': 'ExpoHaptics',
  'expo-sqlite': 'ExpoSQLite',
};

type ModuleDescriptor = {
  packageName: string;
  packageVersion: string;
  swiftModuleNames?: string[];
  pods: { podName: string; podspecDir: string }[];
};
type ExpoGraph = {
  modules: ModuleDescriptor[];
  extraDependencies?: unknown[];
  coreFeatures?: string[];
};
type ReactNativeGraph = {
  dependencies: Record<string, { platforms?: { ios?: unknown } }>;
};

export function validateVersions(versions: Record<string, string>): void {
  if (
    !/^58\.0\.\d+$/.test(versions.expo) ||
    versions['react-native'] !== '0.88.0' ||
    versions.react !== '19.3.0'
  ) {
    throw new Error(
      `Unsupported runtime: ${JSON.stringify(versions)}. This release supports Expo SDK 58, React Native 0.88.0 and React 19.3.0. Restore compatible versions in expo/package.json and rerun init.`
    );
  }
}

export function validateNativeGraph(
  expo: ExpoGraph,
  reactNative: ReactNativeGraph,
  metadataPackages = new Set<string>()
): void {
  if (expo.extraDependencies?.length || expo.coreFeatures?.length) {
    throw new Error(
      `Native extraDependencies or core features (${(expo.coreFeatures ?? []).join(', ')}) have no build recipes. Remove these requirements or add source-build support before rerunning init.`
    );
  }
  for (const module of expo.modules) {
    if (!Object.hasOwn(recipes, module.packageName) && !metadataPackages.has(module.packageName)) {
      throw new Error(
        `${module.packageName} is autolinked but has no native build recipe. Remove the dependency or add a recipe for its sources, resources and native dependencies before rerunning init.`
      );
    }
    if (Object.hasOwn(recipes, module.packageName) && !/^58\.0\.\d+$/.test(module.packageVersion)) {
      throw new Error(
        `${module.packageName}@${module.packageVersion} does not match the SDK 58 build recipe. Run npx expo install --fix inside expo/ and retry init.`
      );
    }
  }
  for (const [name, dependency] of Object.entries(reactNative.dependencies)) {
    if (name !== 'expo' && dependency.platforms?.ios) {
      throw new Error(
        `${name} is an autolinked React Native library with no native build recipe. Remove it or add source-build support before rerunning init.`
      );
    }
  }
}

async function packageRoot(module: ModuleDescriptor): Promise<string> {
  let candidate = module.pods[0]?.podspecDir;
  while (candidate) {
    const manifest = join(candidate, 'package.json');
    if ((await exists(manifest)) && (await readJSON(manifest)).name === module.packageName)
      return candidate;
    const parent = dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  throw new Error(
    `Could not locate ${module.packageName} from autolinking metadata. Reinstall the dependencies in expo/ and rerun init.`
  );
}

export async function discoverNativeModules(projectRoot: string) {
  const requireFromApp = createRequire(join(projectRoot, 'package.json'));
  const resolvePackage = (name: string) => dirname(requireFromApp.resolve(`${name}/package.json`));
  const expoRoot = resolvePackage('expo');
  const reactNativeRoot = resolvePackage('react-native');
  const versions = Object.fromEntries(
    await Promise.all(
      ['expo', 'react', 'react-native'].map(async (name) => [
        name,
        (await readJSON(join(resolvePackage(name), 'package.json'))).version,
      ])
    )
  );
  validateVersions(versions);
  const bin = createRequire(join(expoRoot, 'package.json')).resolve(
    'expo-modules-autolinking/bin/expo-modules-autolinking.js'
  );
  const run = (args: string[]) =>
    readCommandOutput(process.execPath, [bin, ...args], {
      cwd: projectRoot,
      maxBuffer: 64 * 1024 * 1024,
    });
  const expo: ExpoGraph = JSON.parse(await run(['resolve', '--platform', 'apple', '--json']));
  const searched = JSON.parse(await run(['search', '--platform', 'apple', '--json']));
  for (const [name, revision] of Object.entries(searched) as [string, { path: string }][]) {
    if (
      !expo.modules.some((module) => module.packageName === name) &&
      (
        await Promise.all(
          ['Package.swift', 'spm.config.json'].map((file) => exists(join(revision.path, file)))
        )
      ).some(Boolean)
    ) {
      throw new Error(
        `${name} has a Swift build manifest but Expo Apple autolinking did not resolve it. This iteration still needs a discovery podspec and expo-module.config.json for registration; add them before rerunning init.`
      );
    }
  }
  const reactNative: ReactNativeGraph = JSON.parse(
    await run(['react-native-config', '--platform', 'ios', '--project-root', projectRoot, '--json'])
  );

  for (const name of ['expo', 'expo-modules-core', 'expo-modules-jsi', 'expo-constants']) {
    if (!expo.modules.some((module) => module.packageName === name)) {
      throw new Error(
        `${name} is required by the embedding host but was excluded from autolinking. Restore it in the autolinking configuration and rerun init.`
      );
    }
  }
  if (
    ['EXPO_UNSTABLE_LOG_BOX', 'EXPO_DEVELOP_LOG_BOX', 'EXPO_DEBUG_LOG_BOX'].some((name) =>
      /^(1|true)$/i.test(process.env[name] ?? '')
    )
  ) {
    throw new Error(
      'Custom Expo LogBox modes have no resource build recipe. Unset EXPO_UNSTABLE_LOG_BOX, EXPO_DEVELOP_LOG_BOX and EXPO_DEBUG_LOG_BOX and rerun init.'
    );
  }
  const modules = await Promise.all(
    expo.modules.map(async (module) => {
      const root = await packageRoot(module);
      const targetName = Object.hasOwn(recipes, module.packageName)
        ? recipes[module.packageName]
        : undefined;
      if (targetName)
        return {
          ...module,
          packageRoot: root,
          targetName,
          build: undefined as NativeBuild | undefined,
        };
      try {
        const build = await readNativeBuild(
          root,
          module.pods.map((pod) => join(pod.podspecDir, `${pod.podName}.podspec`))
        );
        for (const name of module.swiftModuleNames ?? []) {
          if (!build.targets.some((target) => target.name === name)) {
            throw new Error(
              `Autolinking requires Swift module ${name}, but the build manifest does not provide it. Fix the module metadata and rerun init.`
            );
          }
        }
        return {
          ...module,
          packageRoot: root,
          targetName: build.targets[0].name,
          build,
        };
      } catch (error) {
        throw new Error(`${module.packageName}: ${error instanceof Error ? error.message : error}`);
      }
    })
  );
  modules.sort((a, b) => a.packageName.localeCompare(b.packageName));
  validateNativeGraph(
    expo,
    reactNative,
    new Set(modules.filter((module) => module.build).map((module) => module.packageName))
  );
  validateBuildDependencies(
    modules.flatMap((module) => module.build?.targets ?? []),
    [
      ...modules.filter((module) => !module.build).map((module) => module.targetName),
      'React',
      'ReactNativeDependencies',
      'hermesvm',
      'ReactCodegen',
      'ReactAppDependencyProvider',
      'expoappbrownfield',
    ]
  );
  const inlineRoot = join(projectRoot, 'Native');
  const inlineFiles = (await exists(inlineRoot))
    ? (await readdir(inlineRoot, { recursive: true }))
        .map(String)
        .filter((file) => file.endsWith('.swift'))
        .sort()
    : [];
  return { modules, versions, expoRoot, reactNativeRoot, bin, inlineFiles };
}

export async function generateModulesProvider(
  projectRoot: string,
  output: string,
  plan: Awaited<ReturnType<typeof discoverNativeModules>>
): Promise<void> {
  await mkdir(dirname(output), { recursive: true });
  const temporary = await mkdtemp(join(tmpdir(), 'expo-embedding-provider-'));
  try {
    const target = join(temporary, basename(output));
    const properties = join(temporary, 'inline-modules.json');
    await writeFile(
      properties,
      JSON.stringify({
        'expo.inlineModules.watchedDirectories': JSON.stringify(
          (await exists(join(projectRoot, 'Native'))) ? ['Native'] : []
        ),
        'expo.inlineModules.xcodeProjectTargets': JSON.stringify({
          targets: ['expoappbrownfield'],
        }),
      })
    );
    await runCommand(
      process.execPath,
      [
        plan.bin,
        'generate-modules-provider',
        '--target',
        target,
        '--app-root',
        projectRoot,
        '--platform',
        'apple',
        '--target-platform',
        'ios',
        '--target-name',
        'expoappbrownfield',
        '--podfile-properties-file-path',
        properties,
        '--packages',
        ...plan.modules.map((module) => module.packageName),
      ],
      { cwd: projectRoot }
    );
    // The upstream provider targets an app; our framework also exposes public inline modules.
    const contents = (await readText(target)).replace(/^internal import /gm, 'public import ');
    await writeGenerated(output, contents);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
