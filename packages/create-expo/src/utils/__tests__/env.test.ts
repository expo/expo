import { env } from '../env';

describe('CI', () => {
  afterEach(() => {
    delete process.env.CI;
  });

  it('only treats 1 and true as CI', () => {
    for (const [value, expected] of [
      ['1', true],
      ['TRUE', true],
      ['yes', false],
      ['', false],
    ] as const) {
      process.env.CI = value;
      expect(env.CI).toBe(expected);
    }
  });
});
