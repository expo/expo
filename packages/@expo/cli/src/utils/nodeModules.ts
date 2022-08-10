import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { logNewSection } from './ora';

export async function clearNodeModulesAsync(projectRoot: string) {
  // This step can take a couple seconds, if the installation logs are enabled (with EXPO_DEBUG) then it
  // ends up looking odd to see "Installing JavaScript dependencies" for ~5 seconds before the logs start showing up.
  const cleanJsDepsStep = logNewSection('Cleaning JavaScript dependencies');
  const time = Date.now();
  // nuke the node modules
  // TODO: this is substantially slower, we should find a better alternative to ensuring the modules are installed.
  await fs.promises.rm(path.join(projectRoot, 'node_modules'), { recursive: true, force: true });
  cleanJsDepsStep.succeed(
    `Cleaned JavaScript dependencies ${chalk.gray(Date.now() - time + 'ms')}`
  );
}
