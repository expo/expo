import chalk from 'chalk';

import { sendMessageAsync } from './messages';
import { DevtoolsApp } from './types';

async function executor(cmd: string, apps: DevtoolsApp[]): Promise<string> {
  // Validate command
  cmd = cmd.toLowerCase();
  if (cmd === 'list') {
    try {
      return formatResults(await sendMessageAsync('getRegisteredBackgroundTasks', apps), apps);
    } catch (error: any) {
      throw new Error('An error occured connecting to the app:' + error.toString());
    }
  } else if (cmd === 'test') {
    // Trigger background tasks
    try {
      return formatResults(await sendMessageAsync('triggerBackgroundTasks', apps), apps);
    } catch (error: any) {
      throw new Error('An error occured connecting to the app:' + error.toString());
    }
  } else {
    return Promise.reject(
      new Error("Unknown command. Use 'list' to see available tasks or 'trigger' to run a task.")
    );
  }
}

const formatResults = (results: any[], apps: DevtoolsApp[]) => {
  return results.length > 0
    ? results
        .map((r) => chalk.bold(apps.find((a) => a.id === r.id)!.title + ': ') + r.result)
        .join('\n')
    : chalk.yellow('No apps connected.');
};

async function main() {
  const cmd = process.argv[2];
  const apps = process.argv[3];
  try {
    if (apps.length === 0) {
      throw new Error(
        'No apps connected to the dev server. Please connect an app to use this command.'
      );
    }
    if (!cmd) {
      throw new Error(
        "No command provided. Use 'list' to see available tasks or 'test' to run a task."
      );
    }
    console.log(await executor(cmd, apps ? JSON.parse(apps) : []));
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
