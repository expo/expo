const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.EXPO_PARENT_COMMAND;
});

afterEach(() => {
  process.env = originalEnv;
});

it.each([undefined, '', 'eas build', 'expo install'])(
  'preserves the inherited parent command %p after marking children',
  (inheritedCommand) => {
    if (inheritedCommand !== undefined) {
      process.env.EXPO_PARENT_COMMAND = inheritedCommand;
    }

    jest.isolateModules(() => {
      const cliCommand = require('../cliCommand') as typeof import('../cliCommand');
      cliCommand.setCliCommand('expo config');

      expect(cliCommand.parentCommand).toBe(inheritedCommand || null);
      expect(process.env.EXPO_PARENT_COMMAND).toBe('expo config');
    });
  }
);

it('passes the current command to child processes without changing its own parent', () => {
  process.env.EXPO_PARENT_COMMAND = 'eas build';

  jest.isolateModules(() => {
    const { execFileSync } = jest.requireActual<typeof import('child_process')>('child_process');
    const cliCommand = require('../cliCommand') as typeof import('../cliCommand');
    cliCommand.setCliCommand('expo prebuild');

    const childParent = execFileSync(
      process.execPath,
      ['-e', 'process.stdout.write(process.env.EXPO_PARENT_COMMAND)'],
      { encoding: 'utf8', env: process.env }
    );

    expect(childParent).toBe('expo prebuild');
    expect(cliCommand.parentCommand).toBe('eas build');
  });
});
