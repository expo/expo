import { parseAndValidateArgs, resolveAndDispatch } from '../index';

jest.mock('../../transforms', () => ({
  listTransformsAsync: jest.fn().mockResolvedValue(['sdk-56-expo-router-react-navigation-replace']),
  transformFilePath: (name: string) => `/fake/${name}.js`,
}));

jest.mock('../../utils/runner', () => ({
  runTransformAsync: jest.fn(),
}));

// `Log.exit` calls `process.exit` in production. The tests replace it with a
// thrower so expectations can assert that exit was reached without terminating
// the test runner.
jest.mock('../../log', () => ({
  log: jest.fn(),
  error: jest.fn(),
  exit: jest.fn((message: string | Error, code: number = 1): never => {
    const text = message instanceof Error ? message.message : message;
    const err = new Error(text) as Error & { exitCode?: number };
    err.exitCode = code;
    throw err;
  }),
}));

jest.mock('tinyglobby', () => ({ glob: jest.fn() }));

const Log = jest.requireMock<jest.Mocked<typeof import('../../log')>>('../../log');
const { runTransformAsync: runMock } =
  jest.requireMock<jest.Mocked<typeof import('../../utils/runner')>>('../../utils/runner');
const { glob: globMock } = jest.requireMock<jest.Mocked<typeof import('tinyglobby')>>('tinyglobby');
const exitMock = Log.exit;

const TRANSFORM = 'sdk-56-expo-router-react-navigation-replace';

beforeEach(() => {
  runMock.mockReset();
  runMock.mockResolvedValue({ error: 0, ok: 1, nochange: 1, skip: 2, timeElapsed: '0', stats: {} });
  exitMock.mockClear();
  globMock.mockReset();
});

describe('parseAndValidateArgs', () => {
  test('returns parsed command for a valid transform + path', async () => {
    const cmd = await parseAndValidateArgs([TRANSFORM, 'src']);
    expect(cmd).toEqual({
      transform: TRANSFORM,
      paths: ['src'],
    });
  });

  test('accepts multiple paths', async () => {
    const cmd = await parseAndValidateArgs([TRANSFORM, 'src', 'app', 'components']);
    expect(cmd.paths).toEqual(['src', 'app', 'components']);
  });

  test('prints help and exits with code 0 when --help is passed', async () => {
    await expect(parseAndValidateArgs(['--help'])).rejects.toThrow();
    expect(exitMock).toHaveBeenCalledWith(expect.stringContaining('Usage'), 0);
  });

  test('prints help and exits when no transform is provided', async () => {
    await expect(parseAndValidateArgs([])).rejects.toThrow();
    expect(exitMock).toHaveBeenCalledWith(expect.any(String), 0);
  });

  test('exits with code 1 and warns about missing paths when transform has no paths', async () => {
    await expect(parseAndValidateArgs([TRANSFORM])).rejects.toThrow(/path/i);
    expect(exitMock).toHaveBeenCalledTimes(1);
    const [message, code] = exitMock.mock.calls[0];
    expect(message).toEqual(expect.stringContaining(TRANSFORM));
    expect(message).toEqual(expect.stringContaining('src/**/*.{ts,tsx,js,jsx}'));
    expect(message).toEqual(expect.stringContaining('--help'));
    expect(code).toBeUndefined();
  });

  test('exits with code 1 when an unknown flag is passed', async () => {
    await expect(parseAndValidateArgs(['--bogus-flag', TRANSFORM, 'src'])).rejects.toThrow();
    expect(exitMock).toHaveBeenCalledWith(
      expect.stringContaining("Unknown option '--bogus-flag'"),
      1
    );
  });

  test('exits with code 1 when transform is unknown', async () => {
    await expect(parseAndValidateArgs(['does-not-exist', 'src'])).rejects.toThrow(
      /Transform "does-not-exist" does not exist. Valid options:/
    );
    expect(exitMock).toHaveBeenCalledWith(
      expect.stringContaining('Transform "does-not-exist" does not exist. Valid options:')
    );
  });

  test('validates transform before checking for paths', async () => {
    await expect(parseAndValidateArgs(['does-not-exist'])).rejects.toThrow(
      /Transform "does-not-exist" does not exist/
    );
    expect(exitMock).toHaveBeenCalledWith(
      expect.stringContaining('Transform "does-not-exist" does not exist. Valid options:')
    );
  });
});

describe('resolveAndDispatch', () => {
  test('splits files by extension into ts, tsx, and jsx parser buckets', async () => {
    globMock.mockResolvedValue(['a.ts', 'b.tsx', 'c.js', 'd.jsx']);
    await resolveAndDispatch({ transform: TRANSFORM, paths: ['src'] });
    expect(runMock).toHaveBeenCalledTimes(3);

    const tsCall = runMock.mock.calls.find((c) => c[0].parser === 'ts')![0];
    const tsxCall = runMock.mock.calls.find((c) => c[0].parser === 'tsx')![0];
    const jsxCall = runMock.mock.calls.find((c) => c[0].parser === 'jsx')![0];
    expect(tsCall.files).toEqual(['a.ts']);
    expect(tsxCall.files).toEqual(['b.tsx']);
    expect(jsxCall.files).toEqual(['c.js', 'd.jsx']);
  });

  test('only dispatches tsx when only tsx files match', async () => {
    globMock.mockResolvedValue(['a.tsx', 'b.tsx']);
    await resolveAndDispatch({ transform: TRANSFORM, paths: ['src'] });
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock.mock.calls[0][0].parser).toBe('tsx');
  });

  test('only dispatches jsx when only jsx files match', async () => {
    globMock.mockResolvedValue(['a.js', 'b.jsx']);
    await resolveAndDispatch({ transform: TRANSFORM, paths: ['src'] });
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock.mock.calls[0][0].parser).toBe('jsx');
  });

  test('only dispatches ts when only ts files match', async () => {
    globMock.mockResolvedValue(['a.ts', 'b.ts']);
    await resolveAndDispatch({ transform: TRANSFORM, paths: ['src'] });
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock.mock.calls[0][0].parser).toBe('ts');
  });

  test('does not dispatch when no files match', async () => {
    globMock.mockResolvedValue([]);
    await resolveAndDispatch({ transform: TRANSFORM, paths: ['src'] });
    expect(runMock).not.toHaveBeenCalled();
  });

  test('passes node_modules ignore option to glob', async () => {
    globMock.mockResolvedValue([]);
    await resolveAndDispatch({ transform: TRANSFORM, paths: ['src'] });
    expect(globMock).toHaveBeenCalledWith(
      ['src'],
      expect.objectContaining({
        ignore: ['**/node_modules/**'],
      })
    );
  });
});
