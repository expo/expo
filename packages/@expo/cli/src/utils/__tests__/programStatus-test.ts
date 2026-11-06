import { isInteractive } from '../interactive';
import { withProgramStatus } from '../programStatus';

jest.mock('../interactive', () => ({
  isInteractive: jest.fn(),
}));

describe(withProgramStatus, () => {
  it('still runs the action when reporting the status throws', async () => {
    jest.mocked(isInteractive).mockImplementation(() => {
      throw new Error('Invalid value');
    });

    await expect(
      withProgramStatus({ state: 'blocked', kind: 'auth' }, async () => 'result')
    ).resolves.toBe('result');
  });
});
