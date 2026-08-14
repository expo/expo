import spawnAsync, { SpawnResult } from '@expo/spawn-async';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CLI_PATH = require.resolve('../../bin/cli.js');
export const CREATE_EXPO_BIN = require.resolve('create-expo/bin/create-expo.js');

export interface ExecuteCLIOptions {
  ignoreErrors?: boolean;
  env?: NodeJS.ProcessEnv;
}

/**
 * Execute the CLI
 */
export const executeCLIASync = (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  return executeCommandAsync(cwd, CLI_PATH, args, options);
};

/**
 * Execute Expo CLI
 */
export const executeExpoCLIAsync = (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  return executeCommandAsync(cwd, 'pnpm', ['expo', ...args], options);
};

/**
 * Execute Create Expo CLI
 */
export const executeCreateExpoCLIAsync = async (
  cwd: string,
  args: string[],
  options: ExecuteCLIOptions = { ignoreErrors: false }
) => {
  // Isolate create-expo's tmpdir template cache because `create-expo --template` doesn't support parallel work
  const cacheDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'create-expo-cache-'));
  try {
    return await executeCommandAsync(cwd, CREATE_EXPO_BIN, args, {
      ...options,
      env: { ...process.env, TMPDIR: cacheDir, TMP: cacheDir, TEMP: cacheDir },
    });
  } finally {
    await fs.promises.rm(cacheDir, { recursive: true, force: true });
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
      env: options.env,
    });

    return processOutput({ stdout, stderr, status });
  } catch (error) {
    const { stdout, stderr, status } = error as SpawnResult;

    if (!options.ignoreErrors) {
      console.error(`Command "${[command, ...args].join(' ')}" exited with code ${status ?? 1}`);
      if (stdout) {
        console.error(`stdout:\n${stripAnsi(stdout)}`);
      }
      if (stderr) {
        console.error(`stderr:\n${stripAnsi(stderr)}`);
      }
      throw error;
    }

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
