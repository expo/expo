import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { $, cd } = require('zx') as typeof import('zx');

let defaultVerbose = false;

/**
 * Run a command in the shell.
 */
export async function runAsync(
  command: string,
  args: string[],
  options?: { cwd?: string; verbose?: boolean }
) {
  $.verbose = options?.verbose ?? defaultVerbose;
  if (options?.cwd) {
    cd(options.cwd);
  }
  return await $`${command} ${args}`;
}

export async function setDefaultVerbose(verbose: boolean) {
  defaultVerbose = verbose;
}
