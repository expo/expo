import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { Ora } from 'ora';
import os from 'os';
import path from 'path';
import wrapAnsi from 'wrap-ansi';

import * as Log from '../../log';
import { CI } from '../../utils/env';
import { CommandError, SilentError } from '../../utils/errors';
import { ora } from '../../utils/ora';
import { confirmAsync } from '../../utils/prompts';

async function isInstalledAsync() {
  try {
    await spawnAsync('ios-deploy', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function installOnDeviceAsync(props: {
  bundle: string;
  appDeltaDirectory?: string;
  udid: string;
  deviceName: string;
}): Promise<void> {
  const { bundle, appDeltaDirectory, udid, deviceName } = props;
  const args = [
    '--bundle',
    bundle,
    '--id',
    udid,
    '--justlaunch',
    // Wifi devices tend to stall and never resolve
    '--no-wifi',
  ];
  if (appDeltaDirectory) {
    args.push('--app_deltas', appDeltaDirectory);
  }
  // TODO: Attach LLDB debugger for native logs
  // '--debug'

  Log.debug(`  ios-deploy ${args.join(' ')}`);

  let indicator: Ora | undefined;
  let copyingFileCount = 0;
  let currentPhase: string | undefined;
  const output = await spawnIOSDeployAsync(args, (message) => {
    const loadingMatch = message.match(/\[(.*?)\] (.*)/m);
    if (loadingMatch) {
      const progress = tryParsingNumericValue(loadingMatch[1]);
      const message = loadingMatch[2];
      if (indicator) {
        indicator.text = `${chalk.bold(currentPhase)} ${progress}%`;
      }
      if (message.startsWith('Copying ')) {
        copyingFileCount++;
      }
      return;
    }
    // Install, Debug, Uninstall
    const phaseMatch = message.match(/------\s(\w+) phase\s------/m);
    if (phaseMatch) {
      let phase = phaseMatch[1]?.trim?.();
      // Remap name
      phase = PhaseNameMap[phase] ?? phase;

      if (indicator) {
        if (currentPhase === 'Installing') {
          const copiedMessage = chalk.gray`Copied ${copyingFileCount} file(s)`;
          // Emulate Xcode copy file count, this helps us know if app deltas are working.
          indicator.succeed(`${chalk.bold('Installed')} ${copiedMessage}`);
        } else {
          indicator.succeed();
        }
      }
      indicator = ora(phase).start();
      currentPhase = phase;
      return;
    }
    Log.debug(message);
  });

  if (output.code !== 0) {
    if (indicator) {
      indicator.fail();
    }
    // Allow users to unlock their phone and try the launch over again.
    if (output.error.includes('The device is locked')) {
      // Get the app name from the binary path.
      const appName = path.basename(bundle).split('.')[0] ?? 'app';
      if (
        !CI &&
        (await confirmAsync({
          message: `Cannot launch ${appName} because the device is locked. Unlock ${deviceName} to continue...`,
          initial: true,
        }))
      ) {
        return installOnDeviceAsync(props);
      } else {
        throw new CommandError(
          `Cannot launch ${appName} on ${deviceName} because the device is locked.`
        );
      }
    }
    throw new CommandError(
      `Failed to install the app on device. Error in "ios-deploy" command: ${output.error}`
    );
  } else {
    if (indicator) {
      if (currentPhase === 'Launching') {
        indicator.succeed(`${chalk.bold`Launched`} ${chalk.gray(`on ${deviceName}`)}`);
      } else {
        indicator.succeed();
      }
    }
  }
}

const PhaseNameMap: Record<string, string> = {
  Install: 'Installing',
  Debug: 'Launching',
  Uninstall: 'Uninstalling',
};

function tryParsingNumericValue(str?: string): number | null {
  try {
    return parseInt(str?.match(/\d+/)?.[0] ?? '-1', 10);
  } catch {
    return -1;
  }
}

function spawnIOSDeployAsync(args: string[], onStdout: (message: string) => void) {
  return new Promise<{ output: string; error: string; code: number }>(async (resolve, reject) => {
    const fork = spawn('ios-deploy', args);
    let output = '';
    let errorOutput = '';
    fork.stdout.on('data', (data: Buffer) => {
      const stringData = data.toString().split(os.EOL);
      for (let line of stringData) {
        line = line.trim();
        if (!line) continue;
        if (line.match(/Error: /)) {
          errorOutput = line;
        } else {
          output += line;
          onStdout(line);
        }
      }
    });

    fork.stderr.on('data', (data: Buffer) => {
      const stringData = data instanceof Buffer ? data.toString() : data;
      errorOutput += stringData;
    });

    fork.on('close', (code: number) => {
      resolve({ output, error: errorOutput, code });
    });
  });
}

export async function assertInstalledAsync() {
  if (!(await isInstalledAsync())) {
    if (
      await confirmAsync({
        message: chalk`Required package {cyan ios-deploy} is not installed, would you like to try installing it with homebrew?`,
        initial: true,
      })
    ) {
      try {
        await brewInstallAsync();
        return;
      } catch (error) {
        Log.error(chalk`Failed to install {bold ios-deploy} with homebrew: ${error.message}`);
      }
    }
    // Controlled error message.
    const error = chalk`Cannot install iOS apps on devices without {bold ios-deploy} installed globally. Please install it with {bold brew install ios-deploy} and try again, or build the app with a simulator.`;
    Log.warn(wrapAnsi(error, process.stdout.columns || 80));
    throw new SilentError(error);
  }
}

async function brewInstallAsync() {
  await spawnAsync('brew', ['install', 'ios-deploy'], {
    stdio: 'inherit',
  });
}
