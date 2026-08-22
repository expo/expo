import { resolveSpawnTarget } from '../windowsShim';

const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

afterEach(() => {
  mockPlatform(realPlatform);
});

describe(resolveSpawnTarget, () => {
  describe('on posix', () => {
    beforeEach(() => {
      mockPlatform('darwin');
    });

    it(`should spawn the command as it is`, () => {
      expect(resolveSpawnTarget('/project/node_modules/.bin/expo', ['start', '--web'])).toEqual({
        command: '/project/node_modules/.bin/expo',
        args: ['start', '--web'],
        shell: false,
      });
    });

    it(`should not give a shell to a file that merely ends in .cmd`, () => {
      // A `.cmd` extension means nothing outside Windows, and a shell would only add a quoting
      // problem to a spawn that already works.
      expect(resolveSpawnTarget('/project/weird.cmd', ['run'])).toEqual({
        command: '/project/weird.cmd',
        args: ['run'],
        shell: false,
      });
    });
  });

  describe('on windows', () => {
    beforeEach(() => {
      mockPlatform('win32');
    });

    it(`should run a .cmd shim through a shell, with everything quoted`, () => {
      // Node sets `windowsVerbatimArguments` under `shell: true` and quotes nothing itself, so the
      // quoting is this function's job. `cmd /d /s /c` strips the outer pair it is handed.
      expect(
        resolveSpawnTarget('C:\\project\\node_modules\\.bin\\expo.cmd', ['install', 'expo-camera'])
      ).toEqual({
        command: '"C:\\project\\node_modules\\.bin\\expo.cmd"',
        args: ['"install"', '"expo-camera"'],
        shell: true,
      });
    });

    it(`should run a .bat shim through a shell`, () => {
      expect(resolveSpawnTarget('C:\\tools\\eas.bat', [])).toEqual({
        command: '"C:\\tools\\eas.bat"',
        args: [],
        shell: true,
      });
    });

    it(`should keep a path with spaces in one piece`, () => {
      expect(
        resolveSpawnTarget('C:\\Users\\Ada Lovelace\\app\\node_modules\\.bin\\expo.cmd', [
          'export',
          '--output-dir',
          'C:\\Users\\Ada Lovelace\\app\\dist',
        ])
      ).toEqual({
        command: '"C:\\Users\\Ada Lovelace\\app\\node_modules\\.bin\\expo.cmd"',
        args: ['"export"', '"--output-dir"', '"C:\\Users\\Ada Lovelace\\app\\dist"'],
        shell: true,
      });
    });

    it(`should escape a double quote inside an argument`, () => {
      // `exagent install` forwards whatever the caller typed, so an argument can contain anything.
      expect(resolveSpawnTarget('C:\\bin\\expo.cmd', ['install', 'a"b'])).toEqual({
        command: '"C:\\bin\\expo.cmd"',
        args: ['"install"', '"a\\"b"'],
        shell: true,
      });
    });

    it(`should recognize the extension whatever its case`, () => {
      expect(resolveSpawnTarget('C:\\bin\\EXPO.CMD', []).shell).toBe(true);
    });

    it(`should spawn a real executable directly`, () => {
      // `git.exe`, `adb.exe` and `node.exe` are images Windows can run: a shell would only be one
      // more process and one more quoting rule.
      expect(resolveSpawnTarget('C:\\Program Files\\Git\\bin\\git.exe', ['init'])).toEqual({
        command: 'C:\\Program Files\\Git\\bin\\git.exe',
        args: ['init'],
        shell: false,
      });
    });

    it(`should spawn a bare command name directly, letting the resolver find it`, () => {
      expect(resolveSpawnTarget('git', ['rev-parse'])).toEqual({
        command: 'git',
        args: ['rev-parse'],
        shell: false,
      });
    });
  });
});
