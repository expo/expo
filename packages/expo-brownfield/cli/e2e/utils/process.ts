import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';

const CLI_PATH = require.resolve('../../../cli/build/index.js');

export interface ExecuteCLIOptions {
  ignoreErrors?: boolean;
}

/**
 * Execute the CLI synchronously
 */
export const executeCLIASync = async (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  try {
    // Ensure the CLI can be executed
    fs.chmodSync(CLI_PATH, 0o777);
    const { stdout, stderr, status } = await spawnAsync(CLI_PATH, args, {
      cwd,
      stdio: 'pipe',
    });
    return { stdout, stderr, exitCode: status };
  } catch (error) {
    if (!options.ignoreErrors) {
      console.error(error);
      throw error;
    }

    return { stdout: error.stdout, stderr: error.stderr, exitCode: 1 };
  }
};

/**
 * Strip ANSI escape characters from a string
 */
export const stripAnsi = (str: string): string => {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
};
