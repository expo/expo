import spawnAsync from '@expo/spawn-async';

export const CLI_PATH = require.resolve('../../bin/cli.js');
export const CREATE_EXPO_BIN = require.resolve('../../../create-expo/build/index.js');
export const EXPO_CLI_BIN = require.resolve('../../../@expo/cli/build/bin/cli');

export interface ExecuteCLIOptions {
  ignoreErrors?: boolean;
}

/**
 * Execute the CLI
 */
export const executeCLIASync = async (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  try {
    const { stdout, stderr, status } = await spawnAsync(CLI_PATH, args, {
      cwd,
      stdio: 'pipe',
    });

    return processOutput({ stdout, stderr, status });
  } catch (error) {
    if (!options.ignoreErrors) {
      console.error(error);
      throw error;
    }

    const { stdout, stderr, status } = error;
    return processOutput({ stdout, stderr, status });
  }
};

/**
 * Execute Expo CLI
 */
export const executeExpoCLIAsync = async (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  try {
    const { stdout, stderr, status } = await spawnAsync(EXPO_CLI_BIN, args, {
      cwd,
      stdio: 'pipe',
    });

    return processOutput({ stdout, stderr, status });
  } catch (error) {
    if (!options.ignoreErrors) {
      console.error(error);
      throw error;
    }

    const { stdout, stderr, status } = error;
    return processOutput({ stdout, stderr, status });
  }
};

/**
 * Execute Create Expo CLI
 */
export const executeCreateExpoCLIAsync = async (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  try {
    const { stdout, stderr, status } = await spawnAsync(CREATE_EXPO_BIN, args, {
      cwd,
      stdio: 'pipe',
    });

    return processOutput({ stdout, stderr, status });
  } catch (error) {
    if (!options.ignoreErrors) {
      console.error(error);
      throw error;
    }

    const { stdout, stderr, status } = error;
    return processOutput({ stdout, stderr, status });
  }
};

/**
 * Execute any command
 */
export const executeCommandAsync = async (
  cwd: string,
  command: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  try {
    const { stdout, stderr, status } = await spawnAsync(command, args, {
      cwd,
      stdio: 'pipe',
    });

    return processOutput({ stdout, stderr, status });
  } catch (error) {
    if (!options.ignoreErrors) {
      console.error(error);
      throw error;
    }

    const { stdout, stderr, status } = error;
    return processOutput({ stdout, stderr, status });
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

/**
 * Process the output of the CLI
 */
const processOutput = ({
  stdout,
  stderr,
  status,
}: {
  stdout: string;
  stderr: string;
  status: number | null;
}) => {
  return {
    exitCode: status ?? 1,
    stderr: stripAnsi(stderr.trim()),
    stdout: stripAnsi(stdout.trim()),
  };
};

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
