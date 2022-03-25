import { expoInstall } from '../index';
import { installAsync } from '../installAsync';

jest.mock('../installAsync', () => ({
  installAsync: jest.fn(async () => {}),
}));

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
    expoInstall(['--help']);
    expect(installAsync).not.toBeCalled();
    expect(process.exit).toBeCalledWith(0);
  });
  it(`parses arguments`, async () => {
    // asMock(installAsync).mockImplementation(async () => {});
    expoInstall(['react', 'react-dom']);
    expect(installAsync).toHaveBeenCalledWith(['react', 'react-dom']);
  });
});
