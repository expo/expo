import spawnAsync from '@expo/spawn-async';

import { getDirectoryOfProcessById, getPID, getProcessCommand } from '../getRunningProcess';

jest.mock('@expo/spawn-async');

describe(getPID, () => {
  it(`should return the pid value for a running port`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ stdout: ' 63828 ' } as any);
    const pid = await getPID(8081);
    expect(pid).toBe(63828);
  });
});

describe(getDirectoryOfProcessById, () => {
  it(`should return the directory of a pid`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ stdout: '\nn/test/folder\n' } as any);
    const directory = await getDirectoryOfProcessById(63828);
    expect(directory).toBe('/test/folder');
  });
});

describe(getProcessCommand, () => {
  it(`should return the argv of a pid`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({ stdout: 'command arg' } as any);
    const command = await getProcessCommand(63828, __dirname);
    expect(command).toBe('command arg');
  });
});
