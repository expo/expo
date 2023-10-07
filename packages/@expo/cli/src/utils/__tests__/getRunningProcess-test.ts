import { execFileSync, execSync } from 'child_process';

import {
  getDirectoryOfProcessById,
  getPID,
  isExpoMaybeRunningInDirectory,
  getRunningProcess,
} from '../getRunningProcess';

const asMock = (fn: any): jest.Mock => fn;

describe(getPID, () => {
  it(`should return the pid value for a running port`, () => {
    asMock(execFileSync).mockImplementationOnce(() => '63828');
    const pid = getPID(63828);
    expect(pid).toBe(63828);
  });
});

describe(getDirectoryOfProcessById, () => {
  it(`should return the directory of a pid`, () => {
    asMock(execSync).mockImplementationOnce(() => 'cwd');
    const directory = getDirectoryOfProcessById(63828);
    expect(directory).toBe('cwd');
  });
});

describe(isExpoMaybeRunningInDirectory, () => {
  it(`should return true when a process running in folder contains expo start`, () => {
    asMock(execSync).mockImplementation((command) => {
      if (command.startsWith('ps')) {
        return `
        38880 grep -w expo start
        59789 npm exec expo start
        43113 npm exec expo start
        `;
      }
      if (command.startsWith('lsof') && command.includes('59789')) {
        return 'users/theguy/notmyawesomeproject';
      }
      if (command.startsWith('lsof') && command.includes('43113')) {
        return 'users/theguy/awesomeproject';
      }
      return 'impossible!';
    });
    const isRunning = isExpoMaybeRunningInDirectory('users/theguy/awesomeproject');
    expect(isRunning).toBe(true);
  });

  it(`should return false when no processes match expo start, expo run:ios, expo run:android`, () => {
    asMock(execSync).mockImplementation((command) => {
      if (command.startsWith('ps')) {
        return `
        38880 grep -w expo start
        59789 something else
        43113 still something else
        `;
      }
      if (command.startsWith('lsof')) {
        return 'users/theguy/notmyawesomeproject';
      }
      return 'impossible!';
    });
    const isRunning = isExpoMaybeRunningInDirectory('users/theguy/awesomeproject');
    expect(isRunning).toBe(false);
  });
});
