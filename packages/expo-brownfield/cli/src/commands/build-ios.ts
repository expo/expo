import type { Command } from 'commander';

import {
  buildFramework,
  printIosConfig,
  resolveBuildConfigIos,
  validateHostProvided,
  validatePrebuild,
  shipSwiftPackage,
  shipFrameworks,
} from '../utils';

const buildIos = async (command: Command) => {
  const opts = command.opts();
  await validatePrebuild('ios', { dryRun: !!opts.dryRun });
  const config = resolveBuildConfigIos(opts);
  printIosConfig(config);
  validateHostProvided(config);

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
