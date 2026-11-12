const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});

function loadParentCommand(inheritedCommand?: string) {
  process.env = { ...originalEnv };
  if (inheritedCommand === undefined) {
    delete process.env.EXPO_PARENT_COMMAND;
  } else {
    process.env.EXPO_PARENT_COMMAND = inheritedCommand;
  }

  let parentCommand!: typeof import('../parentCommand');
  jest.isolateModules(() => {
    parentCommand = require('../parentCommand');
  });
  return parentCommand;
}

it('reads the inherited parent command', () => {
  expect(loadParentCommand('eas build').parentCommand).toBe('eas build');
});

it.each([undefined, ''])('has no parent command when the inherited value is %p', (value) => {
  expect(loadParentCommand(value).parentCommand).toBeUndefined();
});

it('keeps the inherited parent command after it marks child processes', () => {
  const parentCommand = loadParentCommand('eas build');

  parentCommand.markAsParentCommand('expo prebuild');

  expect(process.env.EXPO_PARENT_COMMAND).toBe('expo prebuild');
  expect(parentCommand.parentCommand).toBe('eas build');
});
