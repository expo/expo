import spawnAsync from '@expo/spawn-async';
import path from 'path';

import type {
  ModuleDescriptorIos,
  ModuleSwiftPackageInfo,
  PackageRevision,
} from '../../types';
import { fileExistsAsync } from '../../utils';

/**
 * Shape of the JSON emitted by `swift package dump-package` that we care about.
 * Only the fields we read are typed; SwiftPM emits much more.
 */
interface SwiftPackageDump {
  name: string;
  products: { name: string }[];
  targets: { name: string; type: string }[];
}

/**
 * Locates the `Package.swift` for an Expo module. Root-level only for now —
 * if a future module ships its manifest under a subdirectory we'll add a
 * config override (analog of `apple.podspecPath`).
 */
async function findSwiftPackagePathAsync(revision: PackageRevision): Promise<string | null> {
  const candidate = path.join(revision.path, 'Package.swift');
  return (await fileExistsAsync(candidate)) ? candidate : null;
}

/**
 * Runs `swift package dump-package` and parses the JSON output.
 *
 * The autolinking resolver itself is invoked from inside another
 * `Package.swift` (the umbrella). Disable the shared manifest cache so the
 * inner SwiftPM run doesn't try to write into a sandbox-blocked location.
 *
 * Throws if the Swift toolchain isn't available or the manifest fails to evaluate.
 */
async function dumpSwiftPackageAsync(packagePath: string): Promise<SwiftPackageDump> {
  // The autolinking resolver is invoked from inside another `Package.swift`.
  // The outer manifest sandbox is inherited by this nested `swift package`,
  // which then fails on lock file I/O. Callers must disable the outer
  // sandbox: pass `--disable-sandbox` to `swift package` from a CLI, or set
  // `defaults write com.apple.dt.Xcode IDEPackageSupportDisableManifestSandbox -bool YES`
  // for Xcode-driven builds.
  const { stdout } = await spawnAsync(
    'swift',
    ['package', '--package-path', packagePath, 'dump-package'],
    { stdio: ['ignore', 'pipe', 'inherit'] }
  );
  return JSON.parse(stdout);
}

/**
 * Resolves a module's SwiftPM package: its identity, on-disk path, and
 * `.library` product names. Returns `null` if no `Package.swift` is present.
 */
async function resolveSwiftPackageInfoAsync(
  revision: PackageRevision
): Promise<ModuleSwiftPackageInfo | null> {
  const manifestPath = await findSwiftPackagePathAsync(revision);
  if (!manifestPath) {
    return null;
  }

  const packagePath = path.dirname(manifestPath);
  const dump = await dumpSwiftPackageAsync(packagePath);

  return {
    packageName: dump.name,
    packagePath,
    productNames: dump.products.map((product) => product.name),
  };
}

/**
 * SwiftPM-mode counterpart of the CocoaPods resolver in `apple.ts`. Builds a
 * `ModuleDescriptorIos` with the `swiftPackage` field populated and `pods`
 * left empty. Modules without a `Package.swift` are skipped so SwiftPM
 * adoption can roll out one package at a time.
 */
export async function resolveSwiftPackageModuleAsync(
  packageName: string,
  revision: PackageRevision,
  extraOutput: { flags?: Record<string, any> }
): Promise<ModuleDescriptorIos | null> {
  // The `expo` package is the autolinking umbrella — its `Package.swift`
  // invokes this resolver. Dumping its manifest would re-enter the resolver
  // recursively (and fails under the SwiftPM manifest sandbox), so skip it.
  if (packageName === 'expo') {
    return null;
  }

  const swiftPackage = await resolveSwiftPackageInfoAsync(revision);
  if (!swiftPackage) {
    return null;
  }

  const coreFeatures = revision.config?.coreFeatures() ?? [];

  return {
    packageName,
    pods: [],
    swiftPackage,
    swiftModuleNames: swiftPackage.productNames,
    flags: extraOutput.flags,
    modules:
      revision.config
        ?.appleModules()
        .map((module) => (typeof module === 'string' ? { name: null, class: module } : module)) ??
      [],
    appDelegateSubscribers: revision.config?.appleAppDelegateSubscribers() ?? [],
    reactDelegateHandlers: revision.config?.appleReactDelegateHandlers() ?? [],
    debugOnly: revision.config?.appleDebugOnly() ?? false,
    ...(coreFeatures.length > 0 ? { coreFeatures } : {}),
  };
}
