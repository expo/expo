import { env } from '../env';

const original = process.env;
afterEach(() => {
  process.env = original;
});

test.each([
  'EXPO_DEBUG',
  'EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS',
  'EXPO_USE_UNVERSIONED_PLUGINS',
] as const)('%s accepts only true or 1 and reads changes lazily', (key) => {
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
    ['true\n', false],
    ['1\n', false],
  ] as const) {
    process.env[key] = value;
    expect(env[key]).toBe(expected);
  }
  delete process.env[key];
  expect(env[key]).toBe(false);
});
