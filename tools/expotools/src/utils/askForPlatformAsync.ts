import inquirer from 'inquirer';

import { Platform } from '../ProjectVersions';

export default async function askForPlatformAsync(platforms: Platform[] = ['ios', 'android']): Promise<Platform> {
  if (process.env.CI) {
    throw new Error(`Run with \`--platform <${platforms.join(' | ')}>\`.`);
  }

  if (platforms.length === 1) {
    return platforms[0];
  }

  const { platform } = await inquirer.prompt<{ platform: Platform }>([
    {
      type: 'list',
      name: 'platform',
      message: 'For which platform you want to run this script?',
      default: platforms[0],
      choices: platforms,
    },
  ]);
  return platform;
}
