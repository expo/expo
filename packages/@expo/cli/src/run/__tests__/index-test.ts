import { Log } from '../../log';
import { expoRun } from '../index';

jest.mock('../../log');
jest.mock('../../utils/interactive', () => ({ isInteractive: () => false }));
jest.mock('../../utils/prompts.js', () => jest.requireActual('../../utils/prompts'), {
  virtual: true,
});

it('names the platform argument in non-interactive mode', async () => {
  await expect(expoRun([])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining(
        'platform: argument must be provided in non-interactive mode. Valid choices are: android, ios'
      ),
    })
  );
});
