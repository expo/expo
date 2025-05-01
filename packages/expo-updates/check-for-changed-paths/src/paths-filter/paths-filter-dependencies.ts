// Implementation of paths-filter dependencies
import type { SpawnResult } from '@expo/spawn-async';

const spawnAsync = require('@expo/spawn-async');

type ExecOutputResult = SpawnResult & {
  exitCode: number;
};

export const getExecOutput = async (
  command: string,
  args: string[],
  options?: {
    ignoreReturnCode?: boolean;
  }
): Promise<ExecOutputResult> => {
  const result = await spawnAsync(command, args, { stdio: 'pipe' });
  if (result.status === 0 || options?.ignoreReturnCode) {
    return {
      ...result,
      exitCode: result.status ?? 0,
    };
  }
  throw new Error(result.stderr);
};

export const core = {
  startGroup: (_message: string) => {},
  endGroup: () => {},
  info: (_message: string) => {},
  warning: (_message: string) => {},
};
