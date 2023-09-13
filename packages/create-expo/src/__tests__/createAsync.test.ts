import { logNodeInstallWarning } from '../createAsync';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
});

describe(logNodeInstallWarning, () => {
  beforeEach(() => {
    asMock(console.log).mockClear();
  });
  it(`logs correct cd`, () => {
    logNodeInstallWarning('/foo/bar', 'npm', false);

    expect(console.log).toHaveBeenNthCalledWith(2, expect.stringContaining('cd /foo/bar/'));
    expect(console.log).toHaveBeenNthCalledWith(3, expect.stringContaining('npm install'));
  });
  it(`logs correct cd for same directory`, () => {
    logNodeInstallWarning('', 'yarn', false);

    expect(console.log).toHaveBeenNthCalledWith(2, expect.stringContaining('cd ./'));
    expect(console.log).toHaveBeenNthCalledWith(3, expect.stringContaining('yarn install'));
  });
});
