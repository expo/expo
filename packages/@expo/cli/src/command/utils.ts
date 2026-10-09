import chalk from 'chalk';

/** Keep stdout machine-readable and errors concise, like 2g's commands. */
export function reportError(error: unknown) {
  process.stderr.write(`${chalk.red(error instanceof Error ? error.message : String(error))}\n`);
  process.exitCode = 1;
}

export function resolveSelector(positionals: string[]): string | undefined {
  if (positionals.length > 1) {
    throw new Error('Expected at most one session selector. Quote selectors containing spaces.');
  }
  return positionals[0];
}
