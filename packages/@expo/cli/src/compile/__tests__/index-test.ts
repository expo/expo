import { expoCompile } from '../index';

jest.mock('../../log');
jest.mock('../../utils/args', () => ({
  ...jest.requireActual('../../utils/args'),
  printHelp: jest.fn(),
}));
jest.mock('../../utils/errors', () => ({
  ...jest.requireActual('../../utils/errors'),
  logCmdError: jest.fn(),
}));

const { printHelp } = require('../../utils/args') as { printHelp: jest.Mock };
const { logCmdError } = require('../../utils/errors') as { logCmdError: jest.Mock };

it('prints usage when no platform is passed', async () => {
  await expoCompile([]);

  expect(printHelp).toHaveBeenCalled();
});

it('points to usage for an unknown platform', async () => {
  await expoCompile(['windows']);

  expect(logCmdError).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Unsupported platform: windows. Run `npx expo compile --help` for usage.',
    })
  );
});
