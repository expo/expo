import { env } from '../env';

const original = process.env;
afterEach(() => {
  process.env = original;
});

test.each(['EXPO_IMAGE_UTILS_DEBUG', 'EXPO_IMAGE_UTILS_NO_SHARP'] as const)(
  '%s reads flags lazily and treats invalid values as disabled',
  (key) => {
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
      process.env[key] = value;
      expect(env[key]).toBe(expected);
    }
    delete process.env[key];
    expect(env[key]).toBe(false);
  }
);
