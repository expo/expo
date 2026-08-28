import { isProcessAlive } from '../processLiveness';

function mockKill(implementation: (pid: number, signal: string | number) => boolean) {
  return jest.spyOn(process, 'kill').mockImplementation(implementation as never);
}

function errorWithCode(code: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(`kill ${code}`);
  error.code = code;
  return error;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe(isProcessAlive, () => {
  it(`should ask with signal 0, which delivers nothing`, () => {
    const kill = mockKill(() => true);

    expect(isProcessAlive(4242)).toBe(true);
    expect(kill).toHaveBeenCalledWith(4242, 0);
  });

  it(`should read ESRCH as gone`, () => {
    mockKill(() => {
      throw errorWithCode('ESRCH');
    });

    expect(isProcessAlive(4242)).toBe(false);
  });

  // A process this user may not signal is a process that is *there*. Reading it as gone would
  // report a stop that did not happen — reachable with a dev server started under sudo.
  it(`should read EPERM as alive`, () => {
    mockKill(() => {
      throw errorWithCode('EPERM');
    });

    expect(isProcessAlive(4242)).toBe(true);
  });

  it(`should read anything else as gone, rather than throwing out of a report`, () => {
    mockKill(() => {
      throw new Error('no code at all');
    });

    expect(isProcessAlive(4242)).toBe(false);
  });
});
