#!/usr/bin/env node
import { resolveCommand } from './commands/resolve';

(async () => {
  const command = resolveCommand();
  await command.run();
})();
