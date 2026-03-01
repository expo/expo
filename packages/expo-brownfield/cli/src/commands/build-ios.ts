import type { Command } from 'commander';

import {
  buildFramework,
  cleanUpArtifacts,
  createSwiftPackage,
  createXcframework,
  copyHermesXcframework,
  makeArtifactsDirectory,
  printIosConfig,
  resolveBuildConfigIos,
  validatePrebuild,
} from '../utils';

const buildIos = async (command: Command) => {
  await validatePrebuild('ios');

  const config = resolveBuildConfigIos(command.opts());
  printIosConfig(config);

  await cleanUpArtifacts(config);
  makeArtifactsDirectory(config);
  await buildFramework(config);
  await createSwiftPackage(config);
  await createXcframework(config);
  await copyHermesXcframework(config);
};

export default buildIos;
