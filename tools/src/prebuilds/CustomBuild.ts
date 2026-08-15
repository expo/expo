/**
 * Escape hatch for products whose xcframework is produced by a package-owned
 * build script (e.g. expo-modules-jsi). The pipeline stages a synthetic
 * `PODS_ROOT` from the artifact cache, runs the script, and copies the result
 * into the standard prebuild output path.
 */

import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import logger from '../Logger';
import type { DownloadedDependencies } from './Artifacts.types';
import type { SPMPackageSource } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import type { BuildFlavor } from './Prebuilder.types';
import type { BuildPlatform, SPMProduct } from './SPMConfig.types';
import { createAsyncSpinner } from './Utils';
import { resolvePackagePath } from './resolvePackage';

const PODS_STAGE_DIRNAME = 'pods-stage';

const PLATFORM_TO_SDK: Partial<Record<BuildPlatform, string>> = {
  iOS: 'iphoneos',
  'iOS Simulator': 'iphonesimulator',
  tvOS: 'appletvos',
  'tvOS Simulator': 'appletvsimulator',
};

// Pods that expose React Native source headers via `Pods/Headers/Public/<pod>/`.
// Tuple is: [source dir relative to react-native package root, exposure path under <pod>/].
const RN_HEADER_POD_LAYOUT: Record<string, [string, string]> = {
  'React-jsi': ['ReactCommon/jsi/jsi', 'jsi'],
  'React-runtimescheduler': [
    'ReactCommon/react/renderer/runtimescheduler',
    'react/renderer/runtimescheduler',
  ],
  'React-rendererconsistency': [
    'ReactCommon/react/renderer/consistency',
    'react/renderer/consistency',
  ],
  'React-performancetimeline': [
    'ReactCommon/react/performance/timeline',
    'react/performance/timeline',
  ],
  'React-timing': ['ReactCommon/react/timing', 'react/timing'],
  'React-debug': ['ReactCommon/react/debug', 'react/debug'],
  'React-callinvoker': ['ReactCommon/callinvoker/ReactCommon', 'ReactCommon'],
  'React-runtimeexecutor': ['ReactCommon/runtimeexecutor/ReactCommon', 'ReactCommon'],
};

function customBuildKey(pkg: SPMPackageSource, product: SPMProduct): string {
  return `${pkg.packageName}/${product.name}`;
}

// Builds a synthetic `PODS_ROOT` layout that mimics what CocoaPods produces
// for the apps we build: `Headers/Public/<pod>/...` directories that
// `apple/scripts/build-xcframework.sh` consumes via header search paths in
// `Package.swift`. Inputs come from React Native source (resolved via npm)
// for code headers and from the artifact cache for prebuilt third-party deps.
async function stagePodsRootAsync(
  pkg: SPMPackageSource,
  artifacts: DownloadedDependencies
): Promise<string> {
  const stage = path.join(pkg.buildPath, PODS_STAGE_DIRNAME);
  const headersPublic = path.join(stage, 'Headers', 'Public');
  const reactNativeSourcePath = resolvePackagePath('react-native');

  const links: [string, string][] = [];

  // React Native source headers, surfaced as Pods/Headers/Public/<pod>/<exposure>.
  for (const [pod, [sourceRel, exposure]] of Object.entries(RN_HEADER_POD_LAYOUT)) {
    links.push([
      path.join(reactNativeSourcePath, sourceRel),
      path.join(headersPublic, pod, exposure),
    ]);
  }

  // Hermes headers from the artifact cache: <hermes>/destroot/include/hermes/...
  // surfaced as Pods/Headers/Public/hermes-engine/hermes/...
  links.push([
    path.join(artifacts.hermes, 'destroot', 'include', 'hermes'),
    path.join(headersPublic, 'hermes-engine', 'hermes'),
  ]);

  // ReactNativeDependencies bundles folly/boost/fmt/glog/double-conversion/etc.
  // headers inside the xcframework itself, so we expose its `Headers/` dir as
  // `Pods/Headers/Public/ReactNativeDependencies`.
  links.push([
    path.join(artifacts.reactNativeDependencies, 'ReactNativeDependencies.xcframework', 'Headers'),
    path.join(headersPublic, 'ReactNativeDependencies'),
  ]);

  for (const [target, link] of links) {
    await fs.mkdirp(path.dirname(link));
    await fs.remove(link).catch(() => {});
    await fs.ensureSymlink(target, link);
  }

  // Cache invalidation signal — the build script hashes this file to detect
  // RN version bumps (the real CocoaPods install drops a similar JSON here).
  const localPodspecs = path.join(stage, 'Local Podspecs');
  await fs.mkdirp(localPodspecs);
  await fs.writeJson(path.join(localPodspecs, 'React-Core.podspec.json'), {
    name: 'React-Core',
    version: artifacts.reactNativeVersion,
  });

  return stage;
}

async function spawnScriptAsync(
  scriptPath: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  label: string
): Promise<void> {
  const spinner = createAsyncSpinner(label);
  return new Promise((resolve, reject) => {
    const child = spawn(scriptPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const pipe = (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        const t = line.trim();
        if (t) spinner.info(t);
      }
    };
    child.stdout.on('data', pipe);
    child.stderr.on('data', (d) => {
      stderr += d.toString();
      pipe(d);
    });
    child.on('error', (err) => {
      spinner.fail(`${label}: ${err.message}`);
      reject(err);
    });
    child.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(label);
        resolve();
      } else {
        spinner.fail(`${label} failed (${code})`);
        reject(new Error(`${scriptPath} exited with code ${code}\n${stderr.trim()}`));
      }
    });
  });
}

/**
 * Stages a `PODS_ROOT` and runs the product's customBuild script. The script
 * always emits a Release-mode xcframework with `BUILD_LIBRARY_FOR_DISTRIBUTION=YES`,
 * so to avoid rebuilding once per flavor, the result is cached via
 * `alreadyBuiltProducts` and reused (compose still copies per flavor).
 */
export async function runCustomBuildAsync(
  pkg: SPMPackageSource,
  product: SPMProduct,
  artifacts: DownloadedDependencies,
  platformFilter: BuildPlatform | undefined,
  alreadyBuiltProducts?: Set<string>,
  clean?: boolean
): Promise<void> {
  const cb = product.customBuild!;
  const key = customBuildKey(pkg, product);
  if (alreadyBuiltProducts?.has(key)) {
    logger.info(`🛠  ${product.name} already built this run — reusing.`);
    return;
  }

  const scriptPath = path.resolve(pkg.path, cb.script);
  const podsRoot = await stagePodsRootAsync(pkg, artifacts);
  const sdk = platformFilter && PLATFORM_TO_SDK[platformFilter];
  const env: NodeJS.ProcessEnv = { ...process.env, PODS_ROOT: podsRoot };
  if (sdk) env.PLATFORM_NAME = sdk;
  else delete env.PLATFORM_NAME;

  const args = clean ? ['--clean'] : [];
  await spawnScriptAsync(
    scriptPath,
    args,
    path.dirname(scriptPath),
    env,
    `🛠  Building ${product.name}`
  );
  alreadyBuiltProducts?.add(key);
}

/** Copies the script's xcframework into the standard prebuild output path. */
export async function composeCustomBuildAsync(
  pkg: SPMPackageSource,
  product: SPMProduct,
  flavor: BuildFlavor
): Promise<void> {
  const src = path.resolve(pkg.path, product.customBuild!.output);
  if (!(await fs.pathExists(src))) {
    throw new Error(`customBuild produced no xcframework at ${src}`);
  }
  const dest = Frameworks.getFrameworkPath(pkg.buildPath, product.name, flavor);
  await fs.mkdirp(path.dirname(dest));
  await fs.remove(dest);
  await fs.copy(src, dest);
  logger.info(`📦 Staged ${product.name}.xcframework (${flavor}).`);
}
