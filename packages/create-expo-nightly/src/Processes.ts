import { $, cd } from 'zx';

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
