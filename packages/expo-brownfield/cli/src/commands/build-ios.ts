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

  if (config.output !== 'frameworks') {
    // Ship frameworks as swift package
    shipSwiftPackage(config);
  } else {
    // Ship frameworks as standalone XCFrameworks
    shipFrameworks(config);
  }
};

export default buildIos;
