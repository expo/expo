import type { Command } from 'commander';

import {
  buildFramework,
  printIosConfig,
  resolveBuildConfigIos,
  validatePrebuild,
  shipSwiftPackage,
  shipFrameworks,
} from '../utils';

const buildIos = async (command: Command) => {
  await validatePrebuild('ios');

  const config = resolveBuildConfigIos(command.opts());
  printIosConfig(config);

  await buildFramework(config);
  // await createXcframework(config);
  // await copyHermesXcframework(config);
  // await copyRNFrameworks(config);

  // TODO(pmleczek): Replace with proper check once rebased
  const truth = 'true';
  if (truth === 'true') {
    // Ship frameworks as swift package
    shipSwiftPackage(config);
  } else {
    // Ship frameworks as standalone XCFrameworks
    shipFrameworks(config);
  }
};

export default buildIos;
