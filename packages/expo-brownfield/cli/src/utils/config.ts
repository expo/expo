import type { OptionValues } from 'commander';
import { getConfig } from 'expo/config';
import path from 'node:path';

import { buildPublishingTask, findBrownfieldLibrary } from './android';
import { findScheme, findWorkspace } from './ios';
import type {
  AndroidConfig,
  BuildConfiguration,
  BuildVariant,
  CommonConfig,
  IosConfig,
  TasksConfigAndroid,
} from './types';

export const resolveBuildConfigAndroid = (options: OptionValues): AndroidConfig => {
  const fused = !!options.fused;
  const variant: BuildVariant = resolveVariant(options);
  const library = resolveLibrary(options);
  return {
    ...resolveCommonConfig(options),
    library,
    tasks: resolveTaskArray(options, variant, { fused, library }),
    variant,
    fused,
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

  const hermesFrameworkPath =
    'Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework';
  const packageName =
    options.package && typeof options.package === 'string' ? options.package : `${scheme}Artifacts`;
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

const resolveTaskArray = (
  options: OptionValues,
  variant: BuildVariant,
  fusedOpts: { fused: boolean; library: string }
): string[] => {
  const tasks: string[] = options.task ?? [];
  let repositories: string[] = options.repository ?? [];
  if (tasks.length === 0 && repositories.length === 0) {
    repositories = resolveLocalRepositoriesFromAppConfig(!!options.verbose);
    if (repositories.length > 0) {
      console.info(
        `No --repo or --task specified; defaulting to local repositories from the app config: ${repositories.join(', ')}`
      );
    }
  }
  // In `--fused` mode, `--all` expands to separate Debug + Release task
  // invocations against the matching sibling subprojects.
  const variantsForRepoTasks: BuildVariant[] =
    fusedOpts.fused && variant === 'All' ? ['Debug', 'Release'] : [variant];
  const repoTasks = repositories.flatMap((repo) =>
    variantsForRepoTasks.map((v) => buildPublishingTask(v, repo, fusedOpts))
  );

  return Array.from(new Set([...tasks, ...repoTasks]));
};

const resolveLocalRepositoriesFromAppConfig = (verbose: boolean): string[] => {
  let publishing: unknown;
  try {
    const { exp } = getConfig(process.cwd(), { skipSDKVersionRequirement: true });
    const plugin = exp.plugins?.find(
      (entry): entry is [string, any] => Array.isArray(entry) && entry[0] === 'expo-brownfield'
    );
    publishing = plugin?.[1]?.android?.publishing;
  } catch (error) {
    // App config could not be evaluated here — fall through to the plugin's
    // default publishing target below.
    if (verbose) {
      console.warn(
        `Could not read \`android.publishing\` from the app config, falling back to MavenLocal: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const entries =
    Array.isArray(publishing) && publishing.length > 0 ? publishing : [{ type: 'localMaven' }];
  const repositories = entries.flatMap((entry) => {
    if (entry?.type === 'localMaven') {
      return ['MavenLocal'];
    }
    if (entry?.type === 'localDirectory' && typeof entry?.name === 'string') {
      return [entry.name];
    }
    return [];
  });
  return Array.from(new Set(repositories));
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
