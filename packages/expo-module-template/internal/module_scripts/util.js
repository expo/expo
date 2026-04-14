const { spawnSync } = require('child_process');

// On Windows, executables like `tsc` and `jest` are `.cmd` batch files and cannot be
// spawned directly — they require shell: true to resolve. On Unix, shell: true is
// unnecessary.
function spawnSyncWithAutoShell(command, args, options) {
  return spawnSync(command, args, { ...options, shell: process.platform === 'win32' });
}

module.exports = { spawnSyncWithAutoShell };
