import { env } from '../env';

const original = process.env;
afterEach(() => {
  process.env = original;
  jest.restoreAllMocks();
});

test('reads the workspace root flag lazily and treats invalid values as disabled', () => {
  process.env = { ...original };
  for (const [value, expected] of [
    ['true', true],
    ['TRUE', true],
    ['True', true],
    ['1', true],
    ['false', false],
    ['FALSE', false],
    ['0', false],
    ['', false],
    ['yes', false],
    [' true ', false],
  ] as const) {
    process.env.EXPO_NO_METRO_WORKSPACE_ROOT = value;
    expect(env.EXPO_NO_METRO_WORKSPACE_ROOT).toBe(expected);
  }
  delete process.env.EXPO_NO_METRO_WORKSPACE_ROOT;
  expect(env.EXPO_NO_METRO_WORKSPACE_ROOT).toBe(false);
});

test('ignores the obsolete workspace root flag without warning', () => {
  process.env = { ...original, EXPO_USE_METRO_WORKSPACE_ROOT: '1' };
  delete process.env.EXPO_NO_METRO_WORKSPACE_ROOT;
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(env.EXPO_NO_METRO_WORKSPACE_ROOT).toBe(false);
  expect(warn).not.toHaveBeenCalled();
});

test('treats an invalid debug flag as disabled', () => {
  process.env = { ...original, EXPO_DEBUG: 'yes' };
  jest.isolateModules(() => {
    expect(require('../../plugins/withInternal').EXPO_DEBUG).toBe(false);
  });
});
