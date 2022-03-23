import { execFileSync, execSync } from 'child_process';

import { getDirectoryOfProcessById, getPID } from '../getRunningProcess';

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
