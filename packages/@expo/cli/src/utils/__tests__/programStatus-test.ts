import { withProgramStatus } from '../programStatus';

describe(withProgramStatus, () => {
  const originalCI = process.env.CI;

  afterEach(() => {
    if (originalCI === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = originalCI;
    }
  });

  it(`runs the action when isInteractive throws on an invalid CI value`, async () => {
    process.env.CI = 'yes';

    await expect(
      withProgramStatus({ state: 'blocked', kind: 'auth' }, async () => 'result')
    ).resolves.toBe('result');
  });
});
