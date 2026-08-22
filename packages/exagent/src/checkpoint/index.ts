import type { Command } from '../types';

// Placeholder — implementation lands with LLP 0008 (checkpoints). Owned by checkpoint-worker.
export const exagentCheckpoint: Command = async () => {
  const { CommandError, logCmdError } = await import('../utils/errors');
  logCmdError(new CommandError('NOT_IMPLEMENTED', '`exagent checkpoint` is not implemented yet.'));
};

export const exagentUndo: Command = async () => {
  const { CommandError, logCmdError } = await import('../utils/errors');
  logCmdError(new CommandError('NOT_IMPLEMENTED', '`exagent undo` is not implemented yet.'));
};
