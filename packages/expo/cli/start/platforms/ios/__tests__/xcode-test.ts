import { getXcodeVersionInternal, getXcodeVersion } from '../xcode';
import { execSync } from 'child_process';
import * as Log from '../../../../log';

const asMock = (fn: any): jest.Mock => fn;
jest.mock(`../../../../log`);

jest.mock('child_process', () => {
  return {
    execSync: jest.fn(),
  };
});

describe(getXcodeVersionInternal, () => {
  beforeEach(() => {
    jest.mock('../../../../log').resetAllMocks();
  });
  it(`returns the xcode version`, () => {
    asMock(execSync).mockReturnValue(`Xcode 13.1
Build version 13A1030d`);
    expect(getXcodeVersionInternal()).toEqual('13.1.0');
  });
  it(`logs an error when the xcode cli format is invalid`, () => {
    asMock(execSync).mockReturnValue(`foobar`);
    expect(getXcodeVersionInternal()).toEqual(null);
    expect(Log.error).toHaveBeenLastCalledWith(
      expect.stringMatching(/Unable to check Xcode version/)
    );
  });
  it(`returns null when the xcode command fails (not installed)`, () => {
    asMock(execSync).mockImplementationOnce(() => {
      throw new Error('foobar');
    });
    expect(getXcodeVersionInternal()).toEqual(null);
    expect(Log.error).not.toBeCalled();
  });
});

describe(getXcodeVersion, () => {
  it(`caches results for a single process`, () => {
    asMock(execSync)
      .mockImplementationOnce(
        () =>
          `Xcode 13.1
Build version 13A1030d`
      )
      .mockImplementationOnce(() => {
        throw new Error('should not be called twice');
      });
    expect(getXcodeVersion()).toEqual('13.1.0');
    expect(getXcodeVersion()).toEqual('13.1.0');
  });
});
