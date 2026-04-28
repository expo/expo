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

const PODS_STAGE_DIRNAME = 'pods-stage';

const PLATFORM_TO_SDK: Partial<Record<BuildPlatform, string>> = {
  iOS: 'iphoneos',
  'iOS Simulator': 'iphonesimulator',
  tvOS: 'appletvos',
  'tvOS Simulator': 'appletvsimulator',
};

function customBuildKey(pkg: SPMPackageSource, product: SPMProduct): string {
  return `${pkg.packageName}/${product.name}`;
}

// Builds the `PODS_ROOT` layout that `apple/scripts/build-xcframework.sh` reads.
async function stagePodsRootAsync(
  pkg: SPMPackageSource,
  artifacts: DownloadedDependencies
): Promise<string> {
  const stage = path.join(pkg.buildPath, PODS_STAGE_DIRNAME);
  const links: [string, string][] = [
    [path.join(artifacts.hermes, 'destroot'), 'hermes-engine/destroot'],
    [path.join(artifacts.react, 'React.xcframework'), 'React-Core-prebuilt/React.xcframework'],
    [
      path.join(artifacts.reactNativeDependencies, 'ReactNativeDependencies.xcframework'),
      'ReactNativeDependencies/framework/packages/react-native/ReactNativeDependencies.xcframework',
    ],
  ];
  for (const [target, rel] of links) {
    const link = path.join(stage, rel);
    await fs.mkdirp(path.dirname(link));
    await fs.remove(link).catch(() => {});
    await fs.ensureSymlink(target, link);
  }

  // Stage React-VFS.yaml as a rewritten copy (not a symlink) so the build
  // script's `sed s|${PODS_ROOT}/React-Core-prebuilt|...|` substitution finds
  // the prefix it expects. The cached yaml has absolute cache paths; we
  // rewrite them to the staged React-Core-prebuilt location.
  const vfsSource = await fs.readFile(path.join(artifacts.react, 'React-VFS.yaml'), 'utf8');
  const cachePrefix = path.join(artifacts.react, 'React.xcframework');
  const stagedPrefix = path.join(stage, 'React-Core-prebuilt', 'React.xcframework');
  const vfsRewritten = vfsSource.split(cachePrefix).join(stagedPrefix);
  await fs.writeFile(path.join(stage, 'React-Core-prebuilt', 'React-VFS.yaml'), vfsRewritten);

  return stage;
}

async function spawnScriptAsync(
  scriptPath: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
  label: string
): Promise<void> {
  const spinner = createAsyncSpinner(label);
  return new Promise((resolve, reject) => {
    const child = spawn(scriptPath, [], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
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
  alreadyBuiltProducts?: Set<string>
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

  await spawnScriptAsync(scriptPath, path.dirname(scriptPath), env, `🛠  Building ${product.name}`);
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
