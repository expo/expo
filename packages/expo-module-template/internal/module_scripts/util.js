const { spawnSync } = require('child_process');

// On Windows, executables like `tsc` and `jest` are `.cmd` batch files and cannot be
// spawned directly — they require shell: true to resolve. On Unix, shell: true is
// unnecessary.
function spawnSyncWithAutoShell(command, args, options) {
  const result = spawnSync(command, args, { ...options, shell: process.platform === 'win32' });
  if (result.error) {
    console.error(
      `Couldn't start \`${command}\` (${result.error.message}). The module's dependencies are probably not installed. ` +
        `Run your package manager's install command in the module directory, then run this script again.`
    );
  }
  return result;
}

module.exports = { spawnSyncWithAutoShell };
