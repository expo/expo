import {
  DEFAULT_DEV_STOP_TIMEOUT_MS,
  DEV_STOP_SIGNALS,
  resolveDevStopOptions,
} from '../resolveStopOptions';

describe(resolveDevStopOptions, () => {
  // Null, not 8081: without a lock this command has not been told which dev server the caller
  // means, and guessing the default port is how one ends up reporting on another project's.
  it(`should look at no port and send SIGTERM by default`, () => {
    expect(resolveDevStopOptions([])).toEqual({
      port: null,
      signal: 'SIGTERM',
      force: false,
      timeoutMs: DEFAULT_DEV_STOP_TIMEOUT_MS,
      json: false,
      followups: true,
    });
  });

  it(`should read every flag`, () => {
    expect(
      resolveDevStopOptions([
        '--port',
        '8170',
        '--signal',
        'SIGKILL',
        '--force',
        '--timeout',
        '30s',
        '--json',
        '--no-followups',
      ])
    ).toEqual({
      port: 8170,
      signal: 'SIGKILL',
      force: true,
      timeoutMs: 30_000,
      json: true,
      followups: false,
    });
  });

  it(`should accept -p for the port`, () => {
    expect(resolveDevStopOptions(['-p', '8082']).port).toBe(8082);
  });

  // A closed list, not an arbitrary string: the point of the command is that the caller does not
  // have to know what a dev server does with a signal.
  it(`should refuse a signal it does not send`, () => {
    const error = expectThrow(() => resolveDevStopOptions(['--signal', 'SIGHUP']));
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('SIGTERM');
    expect(DEV_STOP_SIGNALS).toEqual(['SIGTERM', 'SIGINT', 'SIGKILL']);
  });

  it.each([['0'], ['-1'], ['70000'], ['eight-thousand']])(`should refuse the port %s`, (value) => {
    expect(() => resolveDevStopOptions(['--port', value])).toThrow(/--port/);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules.
  it(`should refuse a bare port and name the flag that takes one`, () => {
    const error = expectThrow(() => resolveDevStopOptions(['8081']));
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--port 8081');
  });

  it(`should refuse a timeout that is not a duration`, () => {
    expect(() => resolveDevStopOptions(['--timeout', 'soon'])).toThrow(/--timeout/);
  });
});

function expectThrow(run: () => unknown): any {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the call to throw, but it returned');
}
