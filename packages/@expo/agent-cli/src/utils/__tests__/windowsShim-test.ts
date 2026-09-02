import path from 'path';

import { resolveSpawnTarget, windowsTaskkillCommand } from '../windowsShim';

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
        args: ['^"install^"', '^"expo-camera^"'],
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
        args: [
          '^"export^"',
          '^"--output-dir^"',
          // The space carries its own `^`, so the path stays one token without a quoted run.
          '^"C:\\Users\\Ada^ Lovelace\\app\\dist^"',
        ],
        shell: true,
      });
    });

    it(`should escape a double quote inside an argument for both readers of it`, () => {
      // `@expo/agent-cli install` forwards whatever the caller typed, so an argument can contain
      // anything. The quote is `\"` for the program that is started and `^`-escaped so `cmd.exe`
      // never sees it as the end of a quoted run.
      expect(resolveSpawnTarget('C:\\bin\\expo.cmd', ['install', 'a"b'])).toEqual({
        command: '"C:\\bin\\expo.cmd"',
        args: ['^"install^"', '^"a\\^"b^"'],
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

    it(`should resolve taskkill under System32, so a stubbed PATH cannot hide it`, () => {
      expect(windowsTaskkillCommand()).toBe(
        path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe')
      );
    });

    it(`should not quote a bare .cmd name, so cmd.exe still searches PATH`, () => {
      // Quoting `"npx.cmd"` makes cmd.exe look in cwd rather than PATH, which printed
      // `'"npx.cmd"' is not recognized` on the Windows runner.
      const originalPath = process.env.PATH;
      process.env.PATH = 'C:\\no-such-npx';
      try {
        expect(resolveSpawnTarget('npx.cmd', ['--yes', 'eas-cli@latest'])).toEqual({
          command: 'npx.cmd',
          args: ['^"--yes^"', '^"eas-cli@latest^"'],
          shell: true,
        });
      } finally {
        process.env.PATH = originalPath;
      }
    });
  });
});

// The property the whole module exists for: after `cmd.exe` has read the line, the program it
// starts must receive each argument exactly as it was handed in, and `cmd.exe` must have found no
// syntax in it. `cmd.exe` has no backslash escape — it toggles quoting on every `"` and escapes
// with `^` — so a `"` inside a value used to end the quoted run and expose the rest as syntax.
describe('Quoting an argument for cmd.exe', () => {
  beforeEach(() => {
    mockPlatform('win32');
  });

  /** Undo what `cmd.exe` does to a token: drop one `^` before each escaped character. */
  function readAsCmdWould(token: string): string {
    return token.replace(/\^(.)/g, '$1');
  }

  /** Undo what the MS C runtime does to a token, i.e. what the started program parses. */
  function readAsProgramWould(token: string): string {
    const body = token.replace(/^"|"$/g, '');
    return body.replace(/\\(\\*)"/g, '$1"').replace(/\\\\/g, '\\');
  }

  it.each([
    ['a quote and an ampersand', 'com.x"&calc&"'],
    ['a semicolon and a pipe', 'com.x;calc|whoami'],
    ['a caret', 'a^b'],
    ['redirection', 'a>b<c'],
    ['parentheses and a percent', 'a(b)c%PATH%'],
    ['a plain application id', 'com.example.demo'],
    ['a path with spaces', 'C:\\Users\\Ada Lovelace\\app\\dist'],
  ])('should round-trip %s back to the original value', (_label, value) => {
    const { args } = resolveSpawnTarget('C:\\bin\\npx.cmd', [value]);

    expect(readAsProgramWould(readAsCmdWould(args[0]!))).toBe(value);
  });

  // `^` is left out: it is the escape character itself, so it legitimately leads a pair. The
  // round-trip case above is what covers a literal `^` in a value.
  it.each(['&', '|', '<', '>', '"'])(
    'should leave no unescaped %s for cmd.exe to read as syntax',
    (meta) => {
      const { args } = resolveSpawnTarget('C:\\bin\\npx.cmd', [`a${meta}b"&calc&"`]);

      // Every metacharacter in the token carries its own `^`, so none of them toggles quoting or
      // separates a command.
      expect(args[0]).not.toMatch(new RegExp(`(?<!\\^)\\${meta}`));
    }
  );

  it('should not let a crafted app id start a second command', () => {
    const { args } = resolveSpawnTarget('C:\\bin\\npx.cmd', ['close', 'com.x"&calc&"']);

    expect(readAsCmdWould(args[1]!)).toBe('"com.x\\"&calc&\\""');
    expect(args[1]).not.toContain('^&calc^& ');
  });
});
