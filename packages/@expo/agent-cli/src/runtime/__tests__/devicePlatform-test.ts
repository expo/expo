import { resolveDevicePlatform } from '../devicePlatform';
import { resolveReloadOptions } from '../reload/resolveOptions';
import { resolveRuntimeStopOptions } from '../resolveStopOptions';

const bothHint = { bothHint: 'run the command twice, once per device.' };

describe(resolveDevicePlatform, () => {
  it('leaves the device undecided when nothing names one', () => {
    expect(resolveDevicePlatform({}, 'runtime:stop', bothHint)).toBeUndefined();
  });

  it.each([
    [{ '--ios': true }, 'ios'],
    [{ '--android': true }, 'android'],
    [{ '--platform': 'ios' }, 'ios'],
    [{ '--platform': 'android' }, 'android'],
  ])('reads %j as %s', (flags, expected) => {
    expect(resolveDevicePlatform(flags, 'runtime:stop', bothHint)).toBe(expected);
  });

  // The two spellings of one platform are one answer, not two devices.
  it('accepts --ios and --platform ios together', () => {
    expect(
      resolveDevicePlatform({ '--ios': true, '--platform': 'ios' }, 'runtime:stop', bothHint)
    ).toBe('ios');
  });

  it('refuses two different devices', () => {
    expect(() =>
      resolveDevicePlatform({ '--ios': true, '--android': true }, 'runtime:stop', bothHint)
    ).toThrow(/name two different devices/);
    expect(() =>
      resolveDevicePlatform({ '--ios': true, '--platform': 'android' }, 'runtime:stop', bothHint)
    ).toThrow(/name two different devices/);
  });

  it('names the platforms it can act on when --platform names something else', () => {
    expect(() => resolveDevicePlatform({ '--platform': 'web' }, 'runtime:stop', bothHint)).toThrow(
      /--platform is "web"[\s\S]*ios and android/
    );
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §One preflight for the runtime family — the shape the friction
// run asked for: `runtime:stop --json` reports `"platform": "ios"`, so `--platform ios` has to be
// a command the next call can make.
describe('the runtime commands take both spellings', () => {
  it('runtime:stop reads --platform ios and --port', () => {
    expect(resolveRuntimeStopOptions(['--platform', 'ios', '--port', '8195'])).toMatchObject({
      platform: 'ios',
      devServerUrl: 'http://127.0.0.1:8195',
    });
  });

  it('runtime:reload reads --platform android and --port', () => {
    expect(resolveReloadOptions(['--platform', 'android', '--port', '8195'])).toMatchObject({
      platform: 'android',
      devServerUrl: 'http://127.0.0.1:8195',
    });
  });
});
