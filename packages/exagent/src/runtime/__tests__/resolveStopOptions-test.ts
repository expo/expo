import { resolveRuntimeStopOptions } from '../resolveStopOptions';

describe(resolveRuntimeStopOptions, () => {
  it(`should leave the device and the app to be worked out`, () => {
    expect(resolveRuntimeStopOptions([])).toEqual({
      platform: undefined,
      appId: undefined,
      devServerUrl: null,
      json: false,
      followups: true,
    });
  });

  it(`should read every flag`, () => {
    expect(
      resolveRuntimeStopOptions([
        '--android',
        '--app-id',
        'com.example.demo',
        '--dev-server-url',
        'http://192.168.1.10:8081/',
        '--json',
        '--no-followups',
      ])
    ).toEqual({
      platform: 'android',
      appId: 'com.example.demo',
      devServerUrl: 'http://192.168.1.10:8081',
      json: true,
      followups: false,
    });
  });

  it(`should refuse two platforms at once`, () => {
    expect(() => resolveRuntimeStopOptions(['--ios', '--android'])).toThrow(/only one of them/);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d). Dropping the argument
  // would stop whatever the command worked out on its own and then print the id it stopped, which
  // reads like it obeyed.
  it(`should refuse a bare application id and name the flag that takes one`, () => {
    const error = expectThrow(() => resolveRuntimeStopOptions(['com.example.demo']));
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--app-id com.example.demo');
  });

  it(`should refuse a dev server URL that is not a URL`, () => {
    expect(() => resolveRuntimeStopOptions(['--dev-server-url', 'nope'])).toThrow(
      /--dev-server-url/
    );
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
