import { withProgramStatus } from '../programStatus';

jest.mock('../interactive', () => ({
  isInteractive: () => {
    throw new Error('Invalid value for environment variable');
  },
}));

describe(withProgramStatus, () => {
  it(`runs the action when the status write throws`, async () => {
    await expect(
      withProgramStatus({ state: 'blocked', kind: 'auth' }, async () => 'result')
    ).resolves.toBe('result');
  });
});
