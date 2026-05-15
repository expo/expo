import type { OptionValues } from 'commander';
import path from 'node:path';

import { buildPublishingTask, findBrownfieldLibrary } from './android';
import { findScheme, findWorkspace } from './ios';
import { enumeratePrecompiledModules } from './precompiled';
import type {
  AndroidConfig,
  BuildConfiguration,
  BuildVariant,
  CommonConfig,
  IosConfig,
  TasksConfigAndroid,
} from './types';

export const resolveBuildConfigAndroid = (options: OptionValues): AndroidConfig => {
  const variant = resolveVariant(options);
  return {
    ...resolveCommonConfig(options),
    library: resolveLibrary(options),
    tasks: resolveTaskArray(options, variant),
    variant,
  };
};

export const resolveBuildConfigIos = (options: OptionValues): IosConfig => {
  let artifacts = options.artifacts || './artifacts';
  if (!path.isAbsolute(artifacts)) {
    artifacts = path.join(process.cwd(), artifacts);
  }

  const derivedDataPath = path.join(process.cwd(), 'ios/build');
  const buildProductsPath = path.join(derivedDataPath, 'Build/Products');

  const buildConfiguration = resolveBuildConfiguration(options);
  const device = path.join(buildProductsPath, `${buildConfiguration.toLowerCase()}-iphoneos`);
  const scheme = resolveScheme(options);
  const simulator = path.join(
    buildProductsPath,
    `${buildConfiguration.toLowerCase()}-iphonesimulator`
  );
  // Detect prebuilt Expo module xcframeworks dropped into ios/Pods/ when the project's
  // expo-build-properties config sets `ios.usePrecompiledModules` (or the user ran
  // `EXPO_USE_PRECOMPILED_MODULES=1 pod install` manually). When present we bundle every
  // precompiled module into the SPM output and emit the aggregate-product Package.swift.
  const usePrebuilds = enumeratePrecompiledModules(path.join(process.cwd(), 'ios')).length > 0;

  const basePackageName =
    options.package && typeof options.package === 'string' ? options.package : `${scheme}Artifacts`;
  // SPM .binaryTarget has no per-configuration overload, so when prebuilds are bundled we
  // produce one flavored package per build configuration (e.g. "MyAppPackage-release").
  const packageName = usePrebuilds
    ? `${basePackageName}-${buildConfiguration.toLowerCase()}`
    : basePackageName;
  const output = options.package
    ? {
        packageName,
      }
    : 'frameworks';

  return {
    ...resolveCommonConfig(options),
    artifacts,
    output,
    buildConfiguration,
    derivedDataPath,
    device,
    simulator,
    scheme: resolveScheme(options),
    usePrebuilds,
    workspace: resolveWorkspace(options),
  };
};

export const resolveTasksConfigAndroid = (options: OptionValues): TasksConfigAndroid => {
  return {
    ...resolveCommonConfig(options),
    library: resolveLibrary(options),
  };
};

const resolveCommonConfig = (options: OptionValues): CommonConfig => {
  return {
    dryRun: !!options.dryRun,
    verbose: !!options.verbose,
  };
};

// SECTION: Android Helpers

const resolveLibrary = (options: OptionValues): string => {
  return options.library || findBrownfieldLibrary();
};

const resolveTaskArray = (options: OptionValues, variant: BuildVariant): string[] => {
  const tasks: string[] = options.task ?? [];
  const repoTasks = (options.repository ?? []).map((repo: string) =>
    buildPublishingTask(variant, repo)
  );

  return Array.from(new Set([...tasks, ...repoTasks]));
};

const resolveVariant = (options: OptionValues): BuildVariant => {
  let variant: BuildVariant = 'All';
  if (options.release && !options.debug) {
    variant = 'Release';
  }
  if (options.debug && !options.release) {
    variant = 'Debug';
  }

  return variant;
};

// END SECTION: Android Helpers

// SECTION: iOS Helpers

const resolveBuildConfiguration = (options: OptionValues): BuildConfiguration => {
  let buildConfiguration: BuildConfiguration = 'Release';
  if (options.debug && !options.release) {
    buildConfiguration = 'Debug';
  }

  return buildConfiguration;
};

const resolveScheme = (options: OptionValues): string => {
  return options.scheme || findScheme();
};

const resolveWorkspace = (options: OptionValues): string => {
  return options.xcworkspace || findWorkspace(options.dryRun);
};

// END SECTION: iOS Helpers
