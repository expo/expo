import { $ } from 'zx';

let defaultVerbose = false;

/**
 * Run a command in the shell.
 */
export async function runAsync(
  command: string,
  args: string[],
  options?: { cwd?: string; verbose?: boolean }
) {
  return await $({
    verbose: options?.verbose ?? defaultVerbose,
    cwd: options?.cwd ?? process.cwd(),
  })`${command} ${args}`;
}

export async function setDefaultVerbose(verbose: boolean) {
  defaultVerbose = verbose;
}
