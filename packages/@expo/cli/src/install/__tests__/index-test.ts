import * as Log from '../../log';
import { expoInstall } from '../index';
import { installAsync } from '../installAsync';

jest.mock('../../log');

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

function setProcessExit(fn: Function) {
  Object.defineProperty(process, 'exit', {
    value: fn,
    writable: true,
  });
}

const originalExit = process.exit;

afterAll(() => {
  setProcessExit(originalExit);
});

describe(expoInstall, () => {
  beforeEach(() => {
    setProcessExit(jest.fn());
  });

  it(`prints help`, async () => {
    asMock(Log.exit).mockImplementationOnce(() => {
      throw new Error();
    });

    await expect(expoInstall(['--help'])).rejects.toThrow();

    expect(installAsync).not.toBeCalled();
    expect(Log.exit).toBeCalledWith(expect.any(String), 0);
  });
});
