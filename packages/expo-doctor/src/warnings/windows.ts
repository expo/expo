// copied from https://github.com/expo/expo-cli/blob/d00319aae4fdcacf1a335af5a8428c45b62fc4d7/packages/expo-cli/src/commands/info/doctor/windows.ts
// no changes

import { yellow } from 'chalk';
import { execFile } from 'child_process';
import { promisify } from 'util';

// I deliberately use `execFile` instead of `spawn`, because I expect the output of known format always.
const execFileAsync = promisify(execFile);

/**
 * Windows only. On any other platform (including WSL on Windows) it's no-op.
 *
 * Checks whether the script is executed from `cmd.exe` and if positive suggests using other terminals.
 */
export async function warnUponCmdExe() {
  if (process.platform !== 'win32') {
    return;
  }

  // we're on Windows & we want to suggest using PowerShell instead of CMD
  await (async () => {
    // https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/tasklist
    const { stdout, stderr } = await execFileAsync(
      'tasklist',
      ['/nh', '/fo', 'csv', '/fi', `PID eq ${process.ppid}`],
      { windowsHide: true }
    );
    if (!stdout.startsWith('') || stderr !== '') {
      // Message upon no command output or wrong input is printed without '"" and results are printed with them.
      // console.log(stdout);
      // console.log(stderr);
      return;
    }

    const [parentProcessName] = stdout.match(/(?<=^").*?(?=",)/) || [''];
    if (parentProcessName.toLowerCase().includes('cmd.exe')) {
      // eslint-disable-next-line no-console
      console.warn(
        yellow(
          'WARNING: We recommend using PowerShell or Bash via WSL 2 for development with Expo CLI on Windows. You may encounter issues using cmd.exe.\n'
        )
      );
    }
  })();
}
