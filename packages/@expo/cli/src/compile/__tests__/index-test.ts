import { Log } from '../../log';
import { expoCompile } from '../index';

jest.mock('../../log');

it('points to usage for an unknown platform', async () => {
  await expect(expoCompile(['windows'])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Unsupported platform: windows. Run `npx expo compile --help` for usage.',
    })
  );
});
