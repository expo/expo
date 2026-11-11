import { isInteractive } from '../interactive';
import { withProgramStatus } from '../programStatus';

jest.mock('../interactive', () => ({
  isInteractive: jest.fn(),
}));

describe(withProgramStatus, () => {
  it('clears only its own status when another is still active', async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    const write = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

    await withProgramStatus({ state: 'blocked', kind: 'question' }, async () => {
      await withProgramStatus({ state: 'working' }, async () => {});
    });
    expect(write.mock.calls.map(([data]) => data)).toEqual([
      '\x1b]7501;state=blocked:app=expo:kind=question:id=1\x1b\\',
      '\x1b]7501;state=working:app=expo:id=2\x1b\\',
      '\x1b]7501;state=clear:id=2\x1b\\',
      '\x1b]7501;state=clear:id=1\x1b\\',
    ]);

    write.mockRestore();
  });

  it('still runs the action when reporting the status throws', async () => {
    jest.mocked(isInteractive).mockImplementation(() => {
      throw new Error('Invalid value');
    });

    await expect(
      withProgramStatus({ state: 'blocked', kind: 'auth' }, async () => 'result')
    ).resolves.toBe('result');
  });

  it('cuts the message to 2048 bytes without splitting a character', async () => {
    jest.mocked(isInteractive).mockReturnValue(true);
    const write = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

    await withProgramStatus({ state: 'working', msg: '€'.repeat(700) }, async () => {});
    const msg = /:msg=([^:\x1b]+)/.exec(String(write.mock.calls[0]![0]))![1]!;
    expect(Buffer.from(msg, 'base64').toString()).toBe('€'.repeat(682));

    write.mockRestore();
  });
});
