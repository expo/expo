import { getParentCommand, markAsParentCommand } from '../parentCommand';

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.__EXPO_PARENT_COMMAND;
});

afterEach(() => {
  process.env = originalEnv;
});

it('reads the inherited parent command, then marks child processes', () => {
  process.env.__EXPO_PARENT_COMMAND = 'eas build';

  expect(markAsParentCommand('expo prebuild')).toBe('eas build');

  expect(getParentCommand()).toBe('eas build');
  expect(process.env.__EXPO_PARENT_COMMAND).toBe('expo prebuild');
});

it.each([undefined, ''])('has no parent command when the inherited value is %p', (value) => {
  if (value !== undefined) {
    process.env.__EXPO_PARENT_COMMAND = value;
  }

  markAsParentCommand('expo prebuild');

  expect(getParentCommand()).toBeUndefined();
});
