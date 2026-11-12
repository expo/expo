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

it.each(['expo run:ios', 'eas build', 'eas update:roll-back-to-embedded'])(
  'reads the inherited parent command %p',
  (command) => {
    expect(loadParentCommand(command).parentCommand).toBe(command);
  }
);

it.each([undefined, '', 'npm install', 'eas build --profile production', '/usr/bin/expo start'])(
  'drops the inherited value %p',
  (value) => {
    expect(loadParentCommand(value).parentCommand).toBeUndefined();
  }
);

it('keeps the inherited parent command after it marks child processes', () => {
  const parentCommand = loadParentCommand('eas build');

  parentCommand.markAsParentCommand('expo prebuild');

  expect(process.env.EXPO_PARENT_COMMAND).toBe('expo prebuild');
  expect(parentCommand.parentCommand).toBe('eas build');
});
