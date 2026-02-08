import type { OptionValues } from 'commander';

import { buildPublishingTask, findBrownfieldLibrary } from './android';
import type {
  AndroidConfig,
  BuildVariant,
  CommonConfig,
  IosConfig,
  TasksConfigAndroid,
} from './types';

// export const getIosConfig = async (args: Result<Spec>): Promise<BuildConfigIos> => {
//   const buildType = getBuildTypeCommon(args);
//   const derivedDataPath = path.join(process.cwd(), 'ios/build');
//   const buildProductsPath = path.join(derivedDataPath, 'Build/Products');

//   return {
//     ...getCommonConfig(args),
//     artifacts: path.join(process.cwd(), args['--artifacts'] || Defaults.artifactsPath),
//     buildType,
//     derivedDataPath,
//     device: path.join(buildProductsPath, `${buildType}-iphoneos`),
//     simulator: path.join(buildProductsPath, `${buildType}-iphonesimulator`),
//     hermesFrameworkPath: args['--hermes-framework'] || Defaults.hermesFrameworkPath,
//     scheme: args['--scheme'] || (await inferScheme()),
//     workspace: args['--xcworkspace'] || (await inferXCWorkspace()),
//   };
// };

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
  return {
    ...resolveCommonConfig(options),
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
