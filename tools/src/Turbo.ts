import { spawnAsync } from './Utils';

export type TurboRunOptions = {
  filters?: string[];
  affected?: boolean;
  /** Git ref to diff against when `affected` is set. */
  scmBase?: string;
  continueOnError?: boolean;
  /** Forwarded to the underlying task scripts after `--`. */
  passthroughArgs?: string[];
};

// Shared by `check-packages` and the publish pipeline so both run the same task graph as CI.
export async function runTurboTasksAsync(
  tasks: string[],
  options: TurboRunOptions = {}
): Promise<void> {
  const args = ['turbo', 'run', ...tasks];

  for (const filter of options.filters ?? []) {
    args.push(`--filter=${filter}`);
  }
  if (options.affected) {
    args.push('--affected');
  }
  if (options.continueOnError) {
    args.push('--continue=dependencies-successful');
  }
  if (options.passthroughArgs?.length) {
    args.push('--', ...options.passthroughArgs);
  }

  const env = { ...process.env };
  if (options.scmBase) {
    env.TURBO_SCM_BASE = options.scmBase;
  }

  await spawnAsync('pnpm', args, { stdio: 'inherit', env });
}
