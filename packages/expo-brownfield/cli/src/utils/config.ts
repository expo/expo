import type { Result, Spec } from 'arg';
import path from 'path';

import type {
  BuildConfigAndroid,
  BuildConfigCommon,
  BuildConfigIos,
  BuildTypeAndroid,
  BuildTypeCommon,
} from './types';
import { Defaults } from '../constants';
import { inferAndroidLibrary, inferScheme, inferXCWorkspace } from './infer';

export const getCommonConfig = (args: Result<Spec>): BuildConfigCommon => {
  return {
    help: !!args['--help'],
    verbose: !!args['--verbose'],
  };
};

export const getAndroidConfig = async (args: Result<Spec>): Promise<BuildConfigAndroid> => {
  return {
    ...getCommonConfig(args),
    buildType: getBuildTypeAndroid(args),
    libraryName: args['--library'] || (await inferAndroidLibrary()),
    repositories: args['--repository'] || [],
    tasks: args['--task'] || [],
  };
};

export const getIosConfig = async (args: Result<Spec>): Promise<BuildConfigIos> => {
  const buildType = getBuildTypeCommon(args);
  const derivedDataPath = path.join(process.cwd(), 'ios/build');
  const buildProductsPath = path.join(derivedDataPath, 'Build/Products');

  return {
    ...getCommonConfig(args),
    artifacts: path.join(process.cwd(), args['--artifacts'] || Defaults.artifactsPath),
    buildType,
    derivedDataPath,
    device: path.join(buildProductsPath, `${buildType}-iphoneos`),
    simulator: path.join(buildProductsPath, `${buildType}-iphonesimulator`),
    hermesFrameworkPath: args['--hermes-framework'] || Defaults.hermesFrameworkPath,
    scheme: args['--scheme'] || (await inferScheme()),
    workspace: args['--workspace'] || (await inferXCWorkspace()),
  };
};

export const getTasksAndroidConfig = async (args: Result<Spec>) => {
  return {
    ...getCommonConfig(args),
    libraryName: args['--library'] || (await inferAndroidLibrary()),
  };
};

export const getBuildTypeCommon = (args: Result<Spec>): BuildTypeCommon => {
  return !args['--release'] && args['--debug'] ? 'debug' : 'release';
};

export const getBuildTypeAndroid = (args: Result<Spec>): BuildTypeAndroid => {
  if ((args['--debug'] && args['--release']) || (!args['--debug'] && !args['--release'])) {
    return 'all';
  }

  return getBuildTypeCommon(args);
};
