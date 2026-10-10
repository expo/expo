import { confirmAsync, createSelectionFilter, promptAsync } from '../prompts';

jest.mock('prompts', () => jest.fn(async () => ({ value: true })));
jest.mock('../interactive', () => ({
  isInteractive: () => true,
}));

describe(promptAsync, () => {
  let write: jest.SpyInstance;

  beforeEach(() => {
    write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    write.mockRestore();
  });

  it(`reports blocked while prompting and clears it afterwards`, async () => {
    await confirmAsync({ message: '\u001b[1mInstall\u001b[22m\nexpo-dev-client?' });

    expect(write.mock.calls).toEqual([
      [
        '\x1b]7501;state=blocked:app=expo:kind=permission:msg=SW5zdGFsbCBleHBvLWRldi1jbGllbnQ/\x1b\\',
      ],
      ['\x1b]7501;state=clear\x1b\\'],
    ]);
  });

  it(`reports the kind passed by the caller`, async () => {
    await promptAsync(
      { type: 'text', name: 'otp', message: 'One-time password' },
      { programStatusKind: 'auth' }
    );

    expect(write.mock.calls[0]).toEqual([
      `\x1b]7501;state=blocked:app=expo:kind=auth:msg=${Buffer.from('One-time password').toString('base64')}\x1b\\`,
    ]);
  });
});

describe(createSelectionFilter, () => {
  it(`searches values`, async () => {
    const filter = createSelectionFilter();
    const choices = [{ title: 'bacon' }, { title: `\\hey` }];

    for (const [search, result] of [
      [`\\`, `\\hey`],
      [`on`, `bacon`],
    ]) {
      expect(await filter(search, choices)).toEqual([{ title: result }]);
    }
    // escaped
    expect(await filter('\\\n\t\r', choices)).toEqual([]);
  });
});
