import type { Command } from '../types';

// Placeholder — implementation lands with LLP 0007 (deploy). Owned by new-deploy-worker.
export const exagentDeploy: Command = async () => {
  const { CommandError, logCmdError } = await import('../utils/errors');
  logCmdError(new CommandError('NOT_IMPLEMENTED', '`exagent deploy` is not implemented yet.'));
};
