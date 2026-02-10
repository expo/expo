import type { Command } from 'commander';

import {
  buildFramework,
  cleanUpArtifacts,
  createXcframework,
  printIosConfig,
  resolveBuildConfigIos,
  validatePrebuild,
} from '../utils';

const buildIos = async (command: Command) => {
  await validatePrebuild('ios');

  const config = resolveBuildConfigIos(command.opts());
  printIosConfig(config);

  await cleanUpArtifacts(config);
  await buildFramework(config);
  await createXcframework(config);
};

export default buildIos;
