import { type EnvMode, getOriginalEnv, setNodeEnv } from '@expo/env';
import spawnAsync from '@expo/spawn-async';
import resolveFrom, { silent as silentResolveFrom } from 'resolve-from';

export class ExpoUpdatesCLIModuleNotFoundError extends Error {}
export class ExpoUpdatesCLIInvalidCommandError extends Error {}
export class ExpoUpdatesCLICommandFailedError extends Error {}

export async function expoUpdatesCommandAsync(
  projectDir: string,
  args: string[],
  mode: EnvMode
): Promise<string> {
  let expoUpdatesCli;
  try {
    expoUpdatesCli =
      silentResolveFrom(projectDir, 'expo-updates/bin/cli') ??
      resolveFrom(projectDir, 'expo-updates/bin/cli.js');
  } catch (e: any) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new ExpoUpdatesCLIModuleNotFoundError(`The \`expo-updates\` package was not found. `);
    }
    throw e;
  }

  try {
    const commandEnv = getOriginalEnv();
    setNodeEnv(mode, { systemEnv: commandEnv });
    commandEnv.__EXPO_CONFIG_MODE = mode;

    return (
      await spawnAsync(expoUpdatesCli, args, {
        stdio: 'pipe',
        env: commandEnv as NodeJS.ProcessEnv,
      })
    ).stdout;
  } catch (e: any) {
    if (e.stderr && typeof e.stderr === 'string') {
      if (e.stderr.includes('Invalid command')) {
        throw new ExpoUpdatesCLIInvalidCommandError(
          `The command specified by ${args} was not valid in the \`expo-updates\` CLI.`
        );
      } else {
        throw new ExpoUpdatesCLICommandFailedError(e.stderr);
      }
    }

    throw e;
  }
}
