import chalk from 'chalk';

import logger from '../Logger';
import { Package } from '../Packages';
import { spawnAsync } from '../Utils';

const { cyan, gray, red, reset } = chalk;

/**
 * Executes the specified script (defined in package.json under "scripts") on the given package.
 */
export default async function runPackageScriptAsync(
  pkg: Package,
  scriptName: string,
  args: string[] = []
): Promise<void> {
  if (!pkg.scripts[scriptName]) {
    // Package doesn't have such script.
    logger.debug(`🤷‍♂️ ${cyan(scriptName)} script not found`);
    return;
  }
  const spawnArgs = [scriptName, ...args];

  logger.log(`🏃‍♀️ Running ${cyan.italic(`yarn ${spawnArgs.join(' ')}`)}`);

  try {
    await spawnAsync('yarn', spawnArgs, {
      stdio: 'pipe',
      cwd: pkg.path,
    });
  } catch (error) {
    logger.error(`${cyan(scriptName)} script failed, see process output:`);
    consoleErrorOutput(error.stdout, 'stdout >', reset);
    consoleErrorOutput(error.stderr, 'stderr >', red);

    // Rethrow error so we can count how many checks failed
    throw error;
  }
}

function consoleErrorOutput(output: string, label: string, color: (string) => string): void {
  const lines = output.trim().split(/\r\n?|\n/g);
  logger.log(lines.map((line) => `${gray(label)} ${color(line)}`).join('\n'));
}
