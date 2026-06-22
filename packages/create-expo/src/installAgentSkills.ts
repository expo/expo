import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import prompts from 'prompts';

import { Log } from './log';
import type { PackageManagerName } from './resolvePackageManager';
import { env } from './utils/env';
import { withSectionLog } from './utils/log';

const debug = require('debug')('expo:init:agent-skills') as typeof console.log;

export type AgentSkillsOptions = {
  agentSkills?: boolean;
  yes: boolean;
};

type InstallAgentSkillsCommand = {
  command: string;
  args: string[];
  display: string;
};

function resolveInstallAgentSkillsCommand(
  packageManager: PackageManagerName
): InstallAgentSkillsCommand {
  switch (packageManager) {
    case 'yarn':
      return {
        command: 'yarn',
        args: ['dlx', 'skills', 'add', 'expo/skills', '--copy'],
        display: 'yarn dlx skills add expo/skills --copy',
      };
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['dlx', 'skills', 'add', 'expo/skills', '--copy'],
        display: 'pnpm dlx skills add expo/skills --copy',
      };
    case 'bun':
      return {
        command: 'bunx',
        args: ['skills', 'add', 'expo/skills', '--copy'],
        display: 'bunx skills add expo/skills --copy',
      };
    case 'npm':
    default:
      return {
        command: 'npx',
        args: ['--yes', 'skills', 'add', 'expo/skills', '--copy'],
        display: 'npx --yes skills add expo/skills --copy',
      };
  }
}

export async function shouldInstallAgentSkillsAsync(props: AgentSkillsOptions): Promise<boolean> {
  if (props.agentSkills != null) {
    return props.agentSkills;
  }

  if (props.yes || env.CI) {
    return false;
  }

  const { answer } = await prompts({
    type: 'confirm',
    name: 'answer',
    message: 'Add Expo agent skills to this project?',
    initial: false,
  });

  return answer === true;
}

export async function installAgentSkillsAsync(
  projectRoot: string,
  packageManager: PackageManagerName
): Promise<boolean> {
  const installCommand = resolveInstallAgentSkillsCommand(packageManager);

  try {
    await withSectionLog(
      (spinner) => {
        spinner.stop();
        return spawnAsync(installCommand.command, installCommand.args, {
          cwd: projectRoot,
          stdio: 'inherit',
        });
      },
      {
        pending: chalk.bold('Installing Expo agent skills.'),
        success: 'Installed Expo agent skills.',
        error: (error) => `Unable to install Expo agent skills: ${error.message}`,
      }
    );
    return true;
  } catch (error: any) {
    debug(`Error installing Expo agent skills: %O`, error);
    Log.error(
      `Expo app created, but Expo agent skills installation failed. Run this inside your project: ${installCommand.display}`
    );
    return false;
  }
}

export async function maybeInstallAgentSkillsAsync(
  projectRoot: string,
  props: AgentSkillsOptions,
  packageManager: PackageManagerName
): Promise<void> {
  if (!(await shouldInstallAgentSkillsAsync(props))) {
    return;
  }

  await installAgentSkillsAsync(projectRoot, packageManager);
}
