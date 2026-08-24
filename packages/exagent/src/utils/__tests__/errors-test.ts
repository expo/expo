import { EXIT_NEEDS_HUMAN } from '../../exitCodes';
import { log, warn } from '../../log';
import {
  CommandError,
  NeedsHumanError,
  formatNeedsHumanBlock,
  isNeedsHumanError,
  logCmdError,
  type NeedsHuman,
} from '../errors';
import { setJsonRequested } from '../jsonMode';

const emitted: { name: string; payload: any }[] = [];

jest.mock('2g', () => {
  const events: any = (group: string) => (name: string, payload: any) => {
    emitted.push({ name: `${group}:${name}`, payload });
  };
  events.debug = () => jest.fn();
  return { events, flushEventLogger: jest.fn(async () => {}) };
});

jest.mock('../../log', () => ({
  exit: jest.fn(),
  exception: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
}));

/** A handoff, as the registry hands one over. */
function needsHuman(overrides: Partial<NeedsHuman> = {}): NeedsHuman {
  return {
    scenario: 'eas-login',
    need: 'Sign in to an Expo account on this machine.',
    command: 'npx eas login',
    url: 'https://expo.dev/settings/access-tokens',
    unattendedEnv: ['EXPO_TOKEN'],
    resumable: true,
    detectedBy: 'exit-signature',
    ...overrides,
  };
}

describe(logCmdError, () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    emitted.length = 0;
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  /** Run the error path and wait for the flush the exit is chained onto. */
  async function exitCodeOfAsync(error: Error): Promise<unknown> {
    logCmdError(error);
    await new Promise((resolve) => setImmediate(resolve));
    return exitSpy.mock.calls[0]?.[0];
  }

  it('exits 1 for an error that names no code', async () => {
    expect(await exitCodeOfAsync(new CommandError('BAD_ARGS', 'nope'))).toBe(1);
  });

  // The band an error opts into: a step only a person can finish is not a tool failure
  // (llp/0010 §Exit codes).
  it('exits with the code the error carries', async () => {
    const error = new CommandError('NEEDS_HUMAN', 'Finish the login in your browser.');
    error.exitCode = EXIT_NEEDS_HUMAN;

    expect(await exitCodeOfAsync(error)).toBe(7);
  });

  it('exits 7 for a needs-human error without being told the code', async () => {
    const error = new NeedsHumanError('EAS_LOGIN_REQUIRED', 'Nobody is signed in.', needsHuman());

    expect(await exitCodeOfAsync(error)).toBe(EXIT_NEEDS_HUMAN);
  });

  it('emits cli:error and then cli:needs_human, with the whole handoff', async () => {
    await exitCodeOfAsync(
      new NeedsHumanError('EAS_LOGIN_REQUIRED', 'Nobody is signed in.', needsHuman())
    );

    expect(emitted.map((entry) => entry.name)).toEqual(['cli:error', 'cli:needs_human']);
    expect(emitted[0]!.payload).toEqual({
      code: 'EAS_LOGIN_REQUIRED',
      message: 'Nobody is signed in.',
      suggestedCommand: 'npx eas login',
      needsHuman: true,
    });
    expect(emitted[1]!.payload).toEqual({
      code: 'EAS_LOGIN_REQUIRED',
      scenario: 'eas-login',
      need: 'Sign in to an Expo account on this machine.',
      command: 'npx eas login',
      url: 'https://expo.dev/settings/access-tokens',
      unattendedEnv: ['EXPO_TOKEN'],
      resumable: true,
      detectedBy: 'exit-signature',
    });
  });

  it('marks an ordinary error as not needing a human', async () => {
    await exitCodeOfAsync(new CommandError('BAD_ARGS', 'nope'));

    expect(emitted.map((entry) => entry.name)).toEqual(['cli:error']);
    expect(emitted[0]!.payload).toMatchObject({ needsHuman: false });
  });

  it('prints the three-line block instead of the Try line', async () => {
    await exitCodeOfAsync(
      new NeedsHumanError('EAS_LOGIN_REQUIRED', 'Nobody is signed in.', needsHuman())
    );

    expect(jest.mocked(warn).mock.calls.map(([line]) => line)).toEqual([
      'Needs a human   eas-login',
      'Ask the user    npx eas login',
      'Or set          EXPO_TOKEN  (https://expo.dev/settings/access-tokens)',
    ]);
  });

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
  describe('the --json error envelope', () => {
    afterEach(() => setJsonRequested(false));

    /** The one object stdout carried, or null when nothing was printed there. */
    function stdoutObject(): any {
      const calls = jest.mocked(log).mock.calls;
      expect(calls.length).toBeLessThanOrEqual(1);
      return calls.length ? JSON.parse(calls[0]![0]!) : null;
    }

    it('prints nothing on stdout when JSON was not asked for', async () => {
      await exitCodeOfAsync(new CommandError('BAD_ARGS', 'nope'));

      expect(stdoutObject()).toBeNull();
    });

    it('prints one object with the stable key set', async () => {
      setJsonRequested(true);
      const error = new CommandError('PROJECT_NOT_FOUND', 'Project root directory not found.');
      error.suggestedCommand = 'npx exagent new my-app';

      await exitCodeOfAsync(error);

      expect(stdoutObject()).toEqual({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project root directory not found.',
          suggestedCommand: 'npx exagent new my-app',
          needsHuman: null,
        },
      });
    });

    it('carries the whole handoff for a needs-human failure', async () => {
      setJsonRequested(true);

      await exitCodeOfAsync(
        new NeedsHumanError('EAS_LOGIN_REQUIRED', 'Nobody is signed in.', needsHuman())
      );

      expect(stdoutObject()).toEqual({
        error: {
          code: 'EAS_LOGIN_REQUIRED',
          message: 'Nobody is signed in.',
          suggestedCommand: 'npx eas login',
          needsHuman: needsHuman(),
        },
      });
    });

    it('reports a null suggestedCommand rather than dropping the key', async () => {
      setJsonRequested(true);

      await exitCodeOfAsync(new CommandError('BAD_ARGS', 'nope'));

      expect(stdoutObject().error).toHaveProperty('suggestedCommand', null);
    });
  });
});

describe(formatNeedsHumanBlock, () => {
  it('names the URL as the ask when there is no command', () => {
    expect(
      formatNeedsHumanBlock(
        needsHuman({
          scenario: 'launch-browser-handoff',
          command: null,
          url: 'https://launch.expo.dev/l/abc',
          unattendedEnv: [],
        })
      )
    ).toEqual([
      'Needs a human   launch-browser-handoff',
      'Ask the user    https://launch.expo.dev/l/abc',
    ]);
  });

  it('keeps the URL next to the command when nothing can be set instead', () => {
    expect(
      formatNeedsHumanBlock(
        needsHuman({
          scenario: 'asc-api-key-create',
          command: 'npx eas credentials --platform ios',
          url: 'https://appstoreconnect.apple.com',
          unattendedEnv: [],
        })
      )[1]
    ).toBe(
      'Ask the user    npx eas credentials --platform ios  (https://appstoreconnect.apple.com)'
    );
  });

  it('does not repeat a URL the command already spells out', () => {
    expect(
      formatNeedsHumanBlock(
        needsHuman({
          scenario: 'macos-automation',
          command: 'open "x-apple.systempreferences:com.apple.preference.security"',
          url: 'x-apple.systempreferences:com.apple.preference.security',
          unattendedEnv: [],
        })
      )[1]
    ).toBe('Ask the user    open "x-apple.systempreferences:com.apple.preference.security"');
  });

  it('falls back to the need when a scenario names neither', () => {
    expect(
      formatNeedsHumanBlock(needsHuman({ command: null, url: null, unattendedEnv: [] }))[1]
    ).toBe('Ask the user    Sign in to an Expo account on this machine.');
  });
});

describe(isNeedsHumanError, () => {
  it('recognises the class without an instanceof check', () => {
    expect(isNeedsHumanError(new NeedsHumanError('X', 'x', needsHuman()))).toBe(true);
    expect(isNeedsHumanError(new CommandError('X', 'x'))).toBe(false);
    expect(isNeedsHumanError(new Error('x'))).toBe(false);
  });
});
