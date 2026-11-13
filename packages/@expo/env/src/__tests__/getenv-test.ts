import { boolish, int, string } from '../getenv';

const key = '__EXPO_ENV_PARSER_TEST';
afterEach(() => delete process.env[key]);

test.each(['true', 'TRUE', 'True', '1', 'false', 'FALSE', 'False', '0'])(
  'parses boolean %s',
  (value) => {
    process.env[key] = value;
    expect(boolish(key)).toBe(['true', '1'].includes(value.toLowerCase()));
  }
);

test.each(['', 'yes', ' true ', '2', 'true\n'])('rejects boolean %s', (value) => {
  process.env[key] = value;
  expect(() => boolish(key, false)).toThrow(
    `Invalid value for environment variable $${key}: ${JSON.stringify(value)}. Set it to "true", "false", "1", or "0" (case-insensitive).`
  );
});

test.each(['', '1.5', '+1', ' 1', '1px', '0x10'])('rejects integer %s', (value) => {
  process.env[key] = value;
  expect(() => int(key, 0)).toThrow(
    `Invalid value for environment variable $${key}: ${JSON.stringify(value)}. Set it to a decimal integer such as "42" or "-42".`
  );
});

test('preserves defaults, empty strings, strict integers, and lazy reads', () => {
  delete process.env[key];
  expect(string(key, '')).toBe('');
  expect(boolish(key, false)).toBe(false);
  expect(int(key, -12)).toBe(-12);
  for (const read of [string, boolish, int]) {
    expect(() => read(key)).toThrow(
      `Environment variable $${key} is not set and no fallback was provided. Set $${key} or provide a fallback.`
    );
  }
  process.env[key] = '0012';
  expect(int(key)).toBe(12);
  process.env[key] = '-0';
  expect(int(key)).toBe(-0);
  process.env[key] = '';
  expect(string(key, 'fallback')).toBe('');
  process.env[key] = 'false';
  expect(boolish(key)).toBe(false);
  process.env[key] = 'TRUE';
  expect(boolish(key)).toBe(true);
});

test('treats null fallbacks as absent', () => {
  delete process.env[key];
  for (const read of [string, boolish, int]) {
    expect(() => read(key, null)).toThrow(
      `Environment variable $${key} is not set and no fallback was provided. Set $${key} or provide a fallback.`
    );
  }
});

test('treats null environment values as absent', () => {
  const original = process.env;
  process.env = { ...original, [key]: null } as unknown as NodeJS.ProcessEnv;
  try {
    expect(string(key, 'fallback')).toBe('fallback');
    expect(int(key, 0)).toBe(0);
    expect(boolish(key, false)).toBe(false);
    expect(() => string(key)).toThrow(
      `Environment variable $${key} is not set and no fallback was provided. Set $${key} or provide a fallback.`
    );
  } finally {
    process.env = original;
  }
});
