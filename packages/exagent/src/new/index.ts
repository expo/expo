import type { Command } from '../types';

// Placeholder — implementation lands with LLP 0007 (headless creation). Owned by new-deploy-worker.
export const exagentNew: Command = async () => {
  const { CommandError, logCmdError } = await import('../utils/errors');
  logCmdError(new CommandError('NOT_IMPLEMENTED', '`exagent new` is not implemented yet.'));
};
